use std::ffi::{CStr, CString};
use std::os::raw::c_char;
use std::ptr;
use automerge::{Automerge, AutomergeError, ObjId, ObjType, ReadDoc, ROOT, transaction::Transactable, ScalarValue};
use serde_json::Value as JsonValue;

#[repr(C)]
pub struct AutomergeDocHandle {
    doc: Automerge,
    user_id: String,
}

#[no_mangle]
pub extern "C" fn automerge_doc_new(user_id: *const c_char) -> *mut AutomergeDocHandle {
    let user_id_str = unsafe {
        if user_id.is_null() {
            return ptr::null_mut();
        }
        match CStr::from_ptr(user_id).to_str() {
            Ok(s) => s.to_string(),
            Err(_) => return ptr::null_mut(),
        }
    };

    let mut doc = Automerge::new();
    
    let result = doc.transact_with::<_, _, AutomergeError, _>(
        |_| Default::default(),
        |tx| {
            tx.put(ROOT, "version", "1.0.0")?;
            tx.put(ROOT, "created_at", chrono::Utc::now().to_rfc3339())?;
            tx.put(ROOT, "updated_at", chrono::Utc::now().to_rfc3339())?;
            tx.put(ROOT, "user_id", user_id_str.as_str())?;
            
            tx.put_object(ROOT, "transactions", ObjType::Map)?;
            tx.put_object(ROOT, "accounts", ObjType::Map)?;
            tx.put_object(ROOT, "categories", ObjType::Map)?;
            tx.put_object(ROOT, "budgets", ObjType::Map)?;
            tx.put_object(ROOT, "tags", ObjType::Map)?;
            tx.put_object(ROOT, "preferences", ObjType::Map)?;
            tx.put_object(ROOT, "rules", ObjType::Map)?;
            
            let indices = tx.put_object(ROOT, "indices", ObjType::Map)?;
            tx.put(&indices, "version", ScalarValue::Int(0))?;
            
            Ok(())
        },
    );

    if result.is_err() {
        return ptr::null_mut();
    }

    Box::into_raw(Box::new(AutomergeDocHandle {
        doc,
        user_id: user_id_str,
    }))
}

#[no_mangle]
pub extern "C" fn automerge_doc_free(handle: *mut AutomergeDocHandle) {
    if !handle.is_null() {
        unsafe {
            drop(Box::from_raw(handle));
        }
    }
}

#[no_mangle]
pub extern "C" fn automerge_doc_get_json(handle: *const AutomergeDocHandle) -> *mut c_char {
    if handle.is_null() {
        return ptr::null_mut();
    }

    let doc_handle = unsafe { &(*handle) };
    
    match doc_to_json(&doc_handle.doc) {
        Ok(json_str) => match CString::new(json_str) {
            Ok(s) => s.into_raw(),
            Err(_) => ptr::null_mut(),
        },
        Err(_) => ptr::null_mut(),
    }
}

fn doc_to_json(doc: &Automerge) -> Result<String, AutomergeError> {
    let mut result = serde_json::Map::new();
    
    for key in ["version", "created_at", "updated_at", "user_id"] {
        if let Some((value, _)) = doc.get(ROOT, key)? {
            if let Some(s) = value.to_str() {
                result.insert(key.to_string(), JsonValue::String(s.to_string()));
            }
        }
    }
    
    for collection in ["transactions", "accounts", "categories", "budgets", "tags", "preferences", "rules"] {
        if let Some((value, obj_id)) = doc.get(ROOT, collection)? {
            if value.is_object() {
                result.insert(collection.to_string(), obj_to_json(doc, &obj_id)?);
            }
        }
    }
    
    if let Some((value, obj_id)) = doc.get(ROOT, "indices")? {
        if value.is_object() {
            result.insert("indices".to_string(), obj_to_json(doc, &obj_id)?);
        }
    }
    
    Ok(serde_json::to_string(&result).unwrap())
}

fn obj_to_json(doc: &Automerge, obj_id: &ObjId) -> Result<JsonValue, AutomergeError> {
    match doc.object_type(obj_id) {
        Ok(ObjType::Map) => {
            let mut map = serde_json::Map::new();
            for key in doc.keys(obj_id) {
                if let Some((value, id)) = doc.get(obj_id, &key)? {
                    map.insert(key.to_string(), scalar_or_obj_to_json(doc, &value, &id)?);
                }
            }
            Ok(JsonValue::Object(map))
        },
        Ok(ObjType::List) => {
            let mut arr = Vec::new();
            let len = doc.length(obj_id);
            for i in 0..len {
                if let Some((value, id)) = doc.get(obj_id, i)? {
                    arr.push(scalar_or_obj_to_json(doc, &value, &id)?);
                }
            }
            Ok(JsonValue::Array(arr))
        },
        _ => Ok(JsonValue::Null),
    }
}

fn scalar_or_obj_to_json(doc: &Automerge, value: &automerge::Value<'_>, obj_id: &ObjId) -> Result<JsonValue, AutomergeError> {
    if value.is_object() {
        obj_to_json(doc, obj_id)
    } else {
        Ok(scalar_to_json(value))
    }
}

fn scalar_to_json(value: &automerge::Value<'_>) -> JsonValue {
    match value {
        automerge::Value::Scalar(s) => match s.as_ref() {
            ScalarValue::Str(s) => JsonValue::String(s.to_string()),
            ScalarValue::Int(i) => JsonValue::Number((*i).into()),
            ScalarValue::Uint(u) => JsonValue::Number((*u).into()),
            ScalarValue::F64(f) => JsonValue::Number(serde_json::Number::from_f64(*f).unwrap_or(0.into())),
            ScalarValue::Boolean(b) => JsonValue::Bool(*b),
            ScalarValue::Null => JsonValue::Null,
            ScalarValue::Counter(c) => {
                let serialized = serde_json::to_value(c).unwrap_or(JsonValue::Number(0.into()));
                serialized
            },
            ScalarValue::Timestamp(t) => JsonValue::Number((*t).into()),
            _ => JsonValue::Null,
        },
        _ => JsonValue::Null,
    }
}

#[no_mangle]
pub extern "C" fn automerge_doc_create(
    handle: *mut AutomergeDocHandle,
    collection: *const c_char,
    id: *const c_char,
    data_json: *const c_char,
) -> i32 {
    if handle.is_null() || collection.is_null() || id.is_null() || data_json.is_null() {
        return 0;
    }

    let collection_str = unsafe {
        match CStr::from_ptr(collection).to_str() {
            Ok(s) => s,
            Err(_) => return 0,
        }
    };

    let id_str = unsafe {
        match CStr::from_ptr(id).to_str() {
            Ok(s) => s,
            Err(_) => return 0,
        }
    };

    let data_str = unsafe {
        match CStr::from_ptr(data_json).to_str() {
            Ok(s) => s,
            Err(_) => return 0,
        }
    };

    let data_value: JsonValue = match serde_json::from_str(data_str) {
        Ok(v) => v,
        Err(_) => return 0,
    };

    let doc_handle = unsafe { &mut (*handle) };
    
    let result = doc_handle.doc.transact_with::<_, _, AutomergeError, _>(
        |_| Default::default(),
        |tx| {
            let collection_obj = match tx.get(ROOT, collection_str)? {
                Some((_, obj_id)) => obj_id,
                None => return Err(AutomergeError::Fail),
            };
            
            let item_obj = tx.put_object(&collection_obj, id_str, ObjType::Map)?;
            
            json_to_automerge(tx, &item_obj, &data_value)?;
            
            tx.put(ROOT, "updated_at", chrono::Utc::now().to_rfc3339())?;
            
            if let Some((_, indices_id)) = tx.get(ROOT, "indices")? {
                if let Some((val, _)) = tx.get(&indices_id, "version")? {
                    if let Some(version) = val.to_i64() {
                        tx.put(&indices_id, "version", ScalarValue::Int(version + 1))?;
                    }
                }
            }
            
            Ok(())
        },
    );

    if result.is_ok() { 1 } else { 0 }
}

#[no_mangle]
pub extern "C" fn automerge_doc_update(
    handle: *mut AutomergeDocHandle,
    collection: *const c_char,
    id: *const c_char,
    updates_json: *const c_char,
) -> i32 {
    if handle.is_null() || collection.is_null() || id.is_null() || updates_json.is_null() {
        return 0;
    }

    let collection_str = unsafe {
        match CStr::from_ptr(collection).to_str() {
            Ok(s) => s,
            Err(_) => return 0,
        }
    };

    let id_str = unsafe {
        match CStr::from_ptr(id).to_str() {
            Ok(s) => s,
            Err(_) => return 0,
        }
    };

    let updates_str = unsafe {
        match CStr::from_ptr(updates_json).to_str() {
            Ok(s) => s,
            Err(_) => return 0,
        }
    };

    let updates_value: JsonValue = match serde_json::from_str(updates_str) {
        Ok(v) => v,
        Err(_) => return 0,
    };

    let doc_handle = unsafe { &mut (*handle) };
    
    let result = doc_handle.doc.transact_with::<_, _, AutomergeError, _>(
        |_| Default::default(),
        |tx| {
            let collection_obj = match tx.get(ROOT, collection_str)? {
                Some((_, obj_id)) => obj_id,
                None => return Err(AutomergeError::Fail),
            };
            
            let item_obj = match tx.get(&collection_obj, id_str)? {
                Some((_, obj_id)) => obj_id,
                None => return Err(AutomergeError::Fail),
            };
            
            if let JsonValue::Object(updates_map) = updates_value {
                for (key, value) in updates_map {
                    put_json_value(tx, &item_obj, &key, &value)?;
                }
            }
            
            tx.put(&item_obj, "updated_at", chrono::Utc::now().to_rfc3339())?;
            tx.put(ROOT, "updated_at", chrono::Utc::now().to_rfc3339())?;
            
            if let Some((_, indices_id)) = tx.get(ROOT, "indices")? {
                if let Some((val, _)) = tx.get(&indices_id, "version")? {
                    if let Some(version) = val.to_i64() {
                        tx.put(&indices_id, "version", ScalarValue::Int(version + 1))?;
                    }
                }
            }
            
            Ok(())
        },
    );

    if result.is_ok() { 1 } else { 0 }
}

#[no_mangle]
pub extern "C" fn automerge_doc_delete(
    handle: *mut AutomergeDocHandle,
    collection: *const c_char,
    id: *const c_char,
) -> i32 {
    if handle.is_null() || collection.is_null() || id.is_null() {
        return 0;
    }

    let collection_str = unsafe {
        match CStr::from_ptr(collection).to_str() {
            Ok(s) => s,
            Err(_) => return 0,
        }
    };

    let id_str = unsafe {
        match CStr::from_ptr(id).to_str() {
            Ok(s) => s,
            Err(_) => return 0,
        }
    };

    let doc_handle = unsafe { &mut (*handle) };
    
    let result = doc_handle.doc.transact_with::<_, _, AutomergeError, _>(
        |_| Default::default(),
        |tx| {
            let collection_obj = match tx.get(ROOT, collection_str)? {
                Some((_, obj_id)) => obj_id,
                None => return Err(AutomergeError::Fail),
            };
            
            let item_obj = match tx.get(&collection_obj, id_str)? {
                Some((_, obj_id)) => obj_id,
                None => return Err(AutomergeError::Fail),
            };
            
            tx.put(&item_obj, "deleted_at", chrono::Utc::now().to_rfc3339())?;
            tx.put(ROOT, "updated_at", chrono::Utc::now().to_rfc3339())?;
            
            if let Some((_, indices_id)) = tx.get(ROOT, "indices")? {
                if let Some((val, _)) = tx.get(&indices_id, "version")? {
                    if let Some(version) = val.to_i64() {
                        tx.put(&indices_id, "version", ScalarValue::Int(version + 1))?;
                    }
                }
            }
            
            Ok(())
        },
    );

    if result.is_ok() { 1 } else { 0 }
}

#[no_mangle]
pub extern "C" fn automerge_doc_save(handle: *const AutomergeDocHandle) -> *mut c_char {
    if handle.is_null() {
        return ptr::null_mut();
    }

    let doc_handle = unsafe { &(*handle) };
    
    let bytes = doc_handle.doc.save();
    let base64 = base64_encode(&bytes);
    match CString::new(base64) {
        Ok(s) => s.into_raw(),
        Err(_) => ptr::null_mut(),
    }
}

#[no_mangle]
pub extern "C" fn automerge_doc_load(data: *const c_char, user_id: *const c_char) -> *mut AutomergeDocHandle {
    let data_str = unsafe {
        if data.is_null() {
            return ptr::null_mut();
        }
        match CStr::from_ptr(data).to_str() {
            Ok(s) => s,
            Err(_) => return ptr::null_mut(),
        }
    };

    let user_id_str = unsafe {
        if user_id.is_null() {
            return ptr::null_mut();
        }
        match CStr::from_ptr(user_id).to_str() {
            Ok(s) => s.to_string(),
            Err(_) => return ptr::null_mut(),
        }
    };

    let bytes = match base64_decode(data_str) {
        Ok(b) => b,
        Err(_) => return automerge_doc_new(user_id),
    };

    match Automerge::load(&bytes) {
        Ok(doc) => Box::into_raw(Box::new(AutomergeDocHandle {
            doc,
            user_id: user_id_str,
        })),
        Err(_) => automerge_doc_new(user_id),
    }
}

#[no_mangle]
pub extern "C" fn automerge_doc_merge(
    handle: *mut AutomergeDocHandle,
    changes_base64: *const c_char,
) -> i32 {
    if handle.is_null() || changes_base64.is_null() {
        return 0;
    }

    let changes_str = unsafe {
        match CStr::from_ptr(changes_base64).to_str() {
            Ok(s) => s,
            Err(_) => return 0,
        }
    };

    let bytes = match base64_decode(changes_str) {
        Ok(b) => b,
        Err(_) => return 0,
    };

    let doc_handle = unsafe { &mut (*handle) };
    
    match Automerge::load(&bytes) {
        Ok(mut other_doc) => {
            match doc_handle.doc.merge(&mut other_doc) {
                Ok(_) => 1,
                Err(_) => 0,
            }
        },
        Err(_) => 0,
    }
}

#[no_mangle]
pub extern "C" fn automerge_string_free(s: *mut c_char) {
    if !s.is_null() {
        unsafe {
            drop(CString::from_raw(s));
        }
    }
}

fn json_to_automerge<T: Transactable>(tx: &mut T, obj_id: &ObjId, value: &JsonValue) -> Result<(), AutomergeError> {
    match value {
        JsonValue::Object(map) => {
            for (key, val) in map {
                put_json_value(tx, obj_id, key, val)?;
            }
        },
        _ => {},
    }
    Ok(())
}

fn put_json_value<T: Transactable>(tx: &mut T, obj_id: &ObjId, key: &str, value: &JsonValue) -> Result<(), AutomergeError> {
    match value {
        JsonValue::String(s) => {
            tx.put(obj_id, key, s.as_str())?;
        },
        JsonValue::Number(n) => {
            if let Some(i) = n.as_i64() {
                tx.put(obj_id, key, ScalarValue::Int(i))?;
            } else if let Some(u) = n.as_u64() {
                tx.put(obj_id, key, ScalarValue::Uint(u))?;
            } else if let Some(f) = n.as_f64() {
                tx.put(obj_id, key, ScalarValue::F64(f))?;
            }
        },
        JsonValue::Bool(b) => {
            tx.put(obj_id, key, *b)?;
        },
        JsonValue::Null => {
            tx.put(obj_id, key, ScalarValue::Null)?;
        },
        JsonValue::Array(arr) => {
            let list_obj = tx.put_object(obj_id, key, ObjType::List)?;
            for (i, val) in arr.iter().enumerate() {
                put_json_value_to_list(tx, &list_obj, i, val)?;
            }
        },
        JsonValue::Object(map) => {
            let map_obj = tx.put_object(obj_id, key, ObjType::Map)?;
            for (k, v) in map {
                put_json_value(tx, &map_obj, k, v)?;
            }
        },
    }
    Ok(())
}

fn put_json_value_to_list<T: Transactable>(tx: &mut T, list_id: &ObjId, index: usize, value: &JsonValue) -> Result<(), AutomergeError> {
    match value {
        JsonValue::String(s) => {
            tx.insert(list_id, index, s.as_str())?;
        },
        JsonValue::Number(n) => {
            if let Some(i) = n.as_i64() {
                tx.insert(list_id, index, ScalarValue::Int(i))?;
            } else if let Some(u) = n.as_u64() {
                tx.insert(list_id, index, ScalarValue::Uint(u))?;
            } else if let Some(f) = n.as_f64() {
                tx.insert(list_id, index, ScalarValue::F64(f))?;
            }
        },
        JsonValue::Bool(b) => {
            tx.insert(list_id, index, *b)?;
        },
        JsonValue::Null => {
            tx.insert(list_id, index, ScalarValue::Null)?;
        },
        JsonValue::Object(map) => {
            let map_obj = tx.insert_object(list_id, index, ObjType::Map)?;
            for (k, v) in map {
                put_json_value(tx, &map_obj, k, v)?;
            }
        },
        JsonValue::Array(arr) => {
            let list_obj = tx.insert_object(list_id, index, ObjType::List)?;
            for (i, val) in arr.iter().enumerate() {
                put_json_value_to_list(tx, &list_obj, i, val)?;
            }
        },
    }
    Ok(())
}

fn base64_encode(bytes: &[u8]) -> String {
    use std::fmt::Write;
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    
    let mut result = String::new();
    let mut i = 0;
    
    while i < bytes.len() {
        let b1 = bytes[i];
        let b2 = if i + 1 < bytes.len() { bytes[i + 1] } else { 0 };
        let b3 = if i + 2 < bytes.len() { bytes[i + 2] } else { 0 };
        
        let c1 = CHARS[(b1 >> 2) as usize] as char;
        let c2 = CHARS[(((b1 & 0x03) << 4) | (b2 >> 4)) as usize] as char;
        let c3 = if i + 1 < bytes.len() {
            CHARS[(((b2 & 0x0F) << 2) | (b3 >> 6)) as usize] as char
        } else {
            '='
        };
        let c4 = if i + 2 < bytes.len() {
            CHARS[(b3 & 0x3F) as usize] as char
        } else {
            '='
        };
        
        write!(&mut result, "{}{}{}{}", c1, c2, c3, c4).unwrap();
        i += 3;
    }
    
    result
}

fn base64_decode(s: &str) -> Result<Vec<u8>, ()> {
    let chars: Vec<char> = s.chars().collect();
    let mut result = Vec::new();
    
    let decode_char = |c: char| -> Result<u8, ()> {
        match c {
            'A'..='Z' => Ok((c as u8) - b'A'),
            'a'..='z' => Ok((c as u8) - b'a' + 26),
            '0'..='9' => Ok((c as u8) - b'0' + 52),
            '+' => Ok(62),
            '/' => Ok(63),
            '=' => Ok(0),
            _ => Err(()),
        }
    };
    
    let mut i = 0;
    while i < chars.len() {
        if i + 3 >= chars.len() {
            break;
        }
        
        let c1 = decode_char(chars[i])?;
        let c2 = decode_char(chars[i + 1])?;
        let c3 = decode_char(chars[i + 2])?;
        let c4 = decode_char(chars[i + 3])?;
        
        result.push((c1 << 2) | (c2 >> 4));
        if chars[i + 2] != '=' {
            result.push((c2 << 4) | (c3 >> 2));
        }
        if chars[i + 3] != '=' {
            result.push((c3 << 6) | c4);
        }
        
        i += 4;
    }
    
    Ok(result)
}

#[cfg(target_os = "android")]
pub mod android {
    use super::*;
    use jni::JNIEnv;
    use jni::objects::{JClass, JString};
    use jni::sys::{jlong, jboolean};

    #[no_mangle]
    pub unsafe extern "C" fn Java_expo_modules_expoautomergecrdt_ExpoAutomergeCrdtModule_nativeDocNew(
        mut env: JNIEnv,
        _class: JClass,
        user_id: JString,
    ) -> jlong {
        let user_id_str = match env.get_string(&user_id) {
            Ok(s) => s.to_string_lossy().to_string(),
            Err(_) => return 0,
        };
        
        let c_user_id = match CString::new(user_id_str) {
            Ok(s) => s,
            Err(_) => return 0,
        };
        
        let handle = automerge_doc_new(c_user_id.as_ptr());
        handle as jlong
    }

    #[no_mangle]
    pub unsafe extern "C" fn Java_expo_modules_expoautomergecrdt_ExpoAutomergeCrdtModule_nativeDocFree(
        _env: JNIEnv,
        _class: JClass,
        handle: jlong,
    ) {
        if handle != 0 {
            automerge_doc_free(handle as *mut AutomergeDocHandle);
        }
    }

    #[no_mangle]
    pub unsafe extern "C" fn Java_expo_modules_expoautomergecrdt_ExpoAutomergeCrdtModule_nativeDocGetJson<'local>(
        mut env: JNIEnv<'local>,
        _class: JClass<'local>,
        handle: jlong,
    ) -> JString<'local> {
        if handle == 0 {
            return env.new_string("{}").unwrap_or_default();
        }
        
        let json_ptr = automerge_doc_get_json(handle as *const AutomergeDocHandle);
        if json_ptr.is_null() {
            return env.new_string("{}").unwrap_or_default();
        }
        
        let json_cstr = CStr::from_ptr(json_ptr);
        let json_str = json_cstr.to_string_lossy();
        let result = env.new_string(json_str.as_ref()).unwrap_or_default();
        
        automerge_string_free(json_ptr);
        result
    }

    #[no_mangle]
    pub unsafe extern "C" fn Java_expo_modules_expoautomergecrdt_ExpoAutomergeCrdtModule_nativeDocCreate<'local>(
        mut env: JNIEnv<'local>,
        _class: JClass<'local>,
        handle: jlong,
        collection: JString,
        item_json: JString,
    ) -> JString<'local> {
        if handle == 0 {
            return env.new_string("").unwrap_or_default();
        }
        
        let collection_str = match env.get_string(&collection) {
            Ok(s) => s.to_string_lossy().to_string(),
            Err(_) => return env.new_string("").unwrap_or_default(),
        };
        
        let item_json_str = match env.get_string(&item_json) {
            Ok(s) => s.to_string_lossy().to_string(),
            Err(_) => return env.new_string("").unwrap_or_default(),
        };
        
        let item_id = format!("{}-{}", chrono::Utc::now().timestamp_millis(), uuid::Uuid::new_v4());
        
        let c_collection = match CString::new(collection_str) {
            Ok(s) => s,
            Err(_) => return env.new_string("").unwrap_or_default(),
        };
        
        let c_id = match CString::new(item_id.clone()) {
            Ok(s) => s,
            Err(_) => return env.new_string("").unwrap_or_default(),
        };
        
        let c_json = match CString::new(item_json_str) {
            Ok(s) => s,
            Err(_) => return env.new_string("").unwrap_or_default(),
        };
        
        let result = automerge_doc_create(
            handle as *mut AutomergeDocHandle,
            c_collection.as_ptr(),
            c_id.as_ptr(),
            c_json.as_ptr(),
        );
        
        if result != 0 {
            env.new_string(item_id).unwrap_or_default()
        } else {
            env.new_string("").unwrap_or_default()
        }
    }

    #[no_mangle]
    pub unsafe extern "C" fn Java_expo_modules_expoautomergecrdt_ExpoAutomergeCrdtModule_nativeDocUpdate(
        mut env: JNIEnv,
        _class: JClass,
        handle: jlong,
        collection: JString,
        item_id: JString,
        item_json: JString,
    ) -> jboolean {
        if handle == 0 {
            return 0;
        }
        
        let collection_str = match env.get_string(&collection) {
            Ok(s) => s.to_string_lossy().to_string(),
            Err(_) => return 0,
        };
        
        let item_id_str = match env.get_string(&item_id) {
            Ok(s) => s.to_string_lossy().to_string(),
            Err(_) => return 0,
        };
        
        let item_json_str = match env.get_string(&item_json) {
            Ok(s) => s.to_string_lossy().to_string(),
            Err(_) => return 0,
        };
        
        let c_collection = match CString::new(collection_str) {
            Ok(s) => s,
            Err(_) => return 0,
        };
        
        let c_id = match CString::new(item_id_str) {
            Ok(s) => s,
            Err(_) => return 0,
        };
        
        let c_json = match CString::new(item_json_str) {
            Ok(s) => s,
            Err(_) => return 0,
        };
        
        automerge_doc_update(
            handle as *mut AutomergeDocHandle,
            c_collection.as_ptr(),
            c_id.as_ptr(),
            c_json.as_ptr(),
        ) as jboolean
    }

    #[no_mangle]
    pub unsafe extern "C" fn Java_expo_modules_expoautomergecrdt_ExpoAutomergeCrdtModule_nativeDocDelete(
        mut env: JNIEnv,
        _class: JClass,
        handle: jlong,
        collection: JString,
        item_id: JString,
    ) -> jboolean {
        if handle == 0 {
            return 0;
        }
        
        let collection_str = match env.get_string(&collection) {
            Ok(s) => s.to_string_lossy().to_string(),
            Err(_) => return 0,
        };
        
        let item_id_str = match env.get_string(&item_id) {
            Ok(s) => s.to_string_lossy().to_string(),
            Err(_) => return 0,
        };
        
        let c_collection = match CString::new(collection_str) {
            Ok(s) => s,
            Err(_) => return 0,
        };
        
        let c_id = match CString::new(item_id_str) {
            Ok(s) => s,
            Err(_) => return 0,
        };
        
        automerge_doc_delete(
            handle as *mut AutomergeDocHandle,
            c_collection.as_ptr(),
            c_id.as_ptr(),
        ) as jboolean
    }

    #[no_mangle]
    pub unsafe extern "C" fn Java_expo_modules_expoautomergecrdt_ExpoAutomergeCrdtModule_nativeDocSave<'local>(
        mut env: JNIEnv<'local>,
        _class: JClass<'local>,
        handle: jlong,
    ) -> JString<'local> {
        if handle == 0 {
            return env.new_string("").unwrap_or_default();
        }
        
        let base64_ptr = automerge_doc_save(handle as *const AutomergeDocHandle);
        if base64_ptr.is_null() {
            return env.new_string("").unwrap_or_default();
        }
        
        let base64_cstr = CStr::from_ptr(base64_ptr);
        let base64_str = base64_cstr.to_string_lossy();
        let result = env.new_string(base64_str.as_ref()).unwrap_or_default();
        
        automerge_string_free(base64_ptr);
        result
    }

    #[no_mangle]
    pub unsafe extern "C" fn Java_expo_modules_expoautomergecrdt_ExpoAutomergeCrdtModule_nativeDocLoad(
        mut env: JNIEnv,
        _class: JClass,
        base64_data: JString,
    ) -> jlong {
        let base64_str = match env.get_string(&base64_data) {
            Ok(s) => s.to_string_lossy().to_string(),
            Err(_) => return 0,
        };
        
        let user_id_str = "unknown";
        
        let c_base64 = match CString::new(base64_str) {
            Ok(s) => s,
            Err(_) => return 0,
        };
        
        let c_user_id = match CString::new(user_id_str) {
            Ok(s) => s,
            Err(_) => return 0,
        };
        
        let handle = automerge_doc_load(c_base64.as_ptr(), c_user_id.as_ptr());
        handle as jlong
    }

    #[no_mangle]
    pub unsafe extern "C" fn Java_expo_modules_expoautomergecrdt_ExpoAutomergeCrdtModule_nativeDocMerge(
        mut env: JNIEnv,
        _class: JClass,
        handle_a: jlong,
        handle_b: jlong,
    ) -> jboolean {
        if handle_a == 0 || handle_b == 0 {
            return 0;
        }
        
        let base64_ptr = automerge_doc_save(handle_b as *const AutomergeDocHandle);
        if base64_ptr.is_null() {
            return 0;
        }
        
        let result = automerge_doc_merge(handle_a as *mut AutomergeDocHandle, base64_ptr);
        automerge_string_free(base64_ptr);
        
        result as jboolean
    }

    #[no_mangle]
    pub unsafe extern "C" fn Java_expo_modules_expoautomergecrdt_ExpoAutomergeCrdtModule_nativeStringFree(
        _env: JNIEnv,
        _class: JClass,
        ptr: jlong,
    ) {
        if ptr != 0 {
            automerge_string_free(ptr as *mut c_char);
        }
    }
}
