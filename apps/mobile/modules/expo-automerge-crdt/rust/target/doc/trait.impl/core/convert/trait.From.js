(function () {
  var implementors = Object.fromEntries([
    [
      'automerge',
      [
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;&amp;<a class="enum" href="automerge/hydrate/enum.Value.html" title="enum automerge::hydrate::Value">Value</a>&gt; for <a class="enum" href="automerge/enum.Value.html" title="enum automerge::Value">Value</a>&lt;\'_&gt;',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;&amp;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.str.html">str</a>&gt; for <a class="enum" href="automerge/enum.Prop.html" title="enum automerge::Prop">Prop</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;&amp;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.str.html">str</a>&gt; for <a class="enum" href="automerge/enum.ScalarValue.html" title="enum automerge::ScalarValue">ScalarValue</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;&amp;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.str.html">str</a>&gt; for <a class="enum" href="automerge/enum.Value.html" title="enum automerge::Value">Value</a>&lt;\'static&gt;',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;&amp;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.usize.html">usize</a>&gt; for <a class="enum" href="automerge/enum.Prop.html" title="enum automerge::Prop">Prop</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;&amp;<a class="struct" href="automerge/hydrate/struct.Text.html" title="struct automerge::hydrate::Text">Text</a>&gt; for <a class="struct" href="https://doc.rust-lang.org/1.91.0/alloc/string/struct.String.html" title="struct alloc::string::String">String</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;&amp;<a class="struct" href="automerge/struct.Change.html" title="struct automerge::Change">Change</a>&gt; for <a class="struct" href="automerge/struct.ExpandedChange.html" title="struct automerge::ExpandedChange">ExpandedChange</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;&amp;<a class="struct" href="https://doc.rust-lang.org/1.91.0/alloc/string/struct.String.html" title="struct alloc::string::String">String</a>&gt; for <a class="enum" href="automerge/enum.Prop.html" title="enum automerge::Prop">Prop</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;&amp;<a class="struct" href="https://doc.rust-lang.org/1.91.0/alloc/string/struct.String.html" title="struct alloc::string::String">String</a>&gt; for <a class="enum" href="automerge/enum.ScalarValue.html" title="enum automerge::ScalarValue">ScalarValue</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;&amp;<a class="struct" href="https://doc.rust-lang.org/1.91.0/alloc/vec/struct.Vec.html" title="struct alloc::vec::Vec">Vec</a>&lt;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.u8.html">u8</a>&gt;&gt; for <a class="struct" href="automerge/struct.ActorId.html" title="struct automerge::ActorId">ActorId</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;&amp;[<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.u8.html">u8</a>]&gt; for <a class="struct" href="automerge/struct.ActorId.html" title="struct automerge::ActorId">ActorId</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="enum" href="automerge/enum.LoadChangeError.html" title="enum automerge::LoadChangeError">LoadError</a>&gt; for <a class="enum" href="automerge/error/enum.AutomergeError.html" title="enum automerge::error::AutomergeError">AutomergeError</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="enum" href="automerge/enum.ObjType.html" title="enum automerge::ObjType">ObjType</a>&gt; for <a class="enum" href="automerge/enum.OpType.html" title="enum automerge::OpType">OpType</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="enum" href="automerge/enum.ScalarValue.html" title="enum automerge::ScalarValue">ScalarValue</a>&gt; for <a class="enum" href="automerge/enum.OpType.html" title="enum automerge::OpType">OpType</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="enum" href="automerge/enum.Value.html" title="enum automerge::Value">Value</a>&lt;\'_&gt;&gt; for <a class="enum" href="automerge/hydrate/enum.Value.html" title="enum automerge::hydrate::Value">Value</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="enum" href="automerge/error/enum.AutomergeError.html" title="enum automerge::error::AutomergeError">AutomergeError</a>&gt; for <a class="enum" href="automerge/error/enum.UpdateObjectError.html" title="enum automerge::error::UpdateObjectError">UpdateObjectError</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="enum" href="automerge/error/enum.HydrateError.html" title="enum automerge::error::HydrateError">HydrateError</a>&gt; for <a class="enum" href="automerge/error/enum.AutomergeError.html" title="enum automerge::error::AutomergeError">AutomergeError</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="enum" href="automerge/hydrate/enum.Value.html" title="enum automerge::hydrate::Value">Value</a>&gt; for <a class="enum" href="automerge/enum.Value.html" title="enum automerge::Value">Value</a>&lt;\'_&gt;',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="enum" href="https://docs.rs/hex/0.4.3/hex/error/enum.FromHexError.html" title="enum hex::error::FromHexError">FromHexError</a>&gt; for <a class="enum" href="automerge/enum.ParseChangeHashError.html" title="enum automerge::ParseChangeHashError">ParseChangeHashError</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.bool.html">bool</a>&gt; for <a class="enum" href="automerge/enum.ScalarValue.html" title="enum automerge::ScalarValue">ScalarValue</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.char.html">char</a>&gt; for <a class="enum" href="automerge/enum.ScalarValue.html" title="enum automerge::ScalarValue">ScalarValue</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.f64.html">f64</a>&gt; for <a class="enum" href="automerge/enum.Prop.html" title="enum automerge::Prop">Prop</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.f64.html">f64</a>&gt; for <a class="enum" href="automerge/enum.ScalarValue.html" title="enum automerge::ScalarValue">ScalarValue</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.i32.html">i32</a>&gt; for <a class="enum" href="automerge/enum.ScalarValue.html" title="enum automerge::ScalarValue">ScalarValue</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.i64.html">i64</a>&gt; for <a class="enum" href="automerge/enum.ScalarValue.html" title="enum automerge::ScalarValue">ScalarValue</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.u32.html">u32</a>&gt; for <a class="enum" href="automerge/enum.ScalarValue.html" title="enum automerge::ScalarValue">ScalarValue</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.u64.html">u64</a>&gt; for <a class="enum" href="automerge/enum.ScalarValue.html" title="enum automerge::ScalarValue">ScalarValue</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.unit.html">()</a>&gt; for <a class="enum" href="automerge/enum.ScalarValue.html" title="enum automerge::ScalarValue">ScalarValue</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.usize.html">usize</a>&gt; for <a class="enum" href="automerge/enum.Prop.html" title="enum automerge::Prop">Prop</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="struct" href="automerge/error/struct.InvalidChangeHashSlice.html" title="struct automerge::error::InvalidChangeHashSlice">InvalidChangeHashSlice</a>&gt; for <a class="enum" href="automerge/error/enum.AutomergeError.html" title="enum automerge::error::AutomergeError">AutomergeError</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="struct" href="automerge/hydrate/struct.List.html" title="struct automerge::hydrate::List">List</a>&gt; for <a class="enum" href="automerge/hydrate/enum.Value.html" title="enum automerge::hydrate::Value">Value</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="struct" href="automerge/hydrate/struct.Map.html" title="struct automerge::hydrate::Map">Map</a>&gt; for <a class="enum" href="automerge/hydrate/enum.Value.html" title="enum automerge::hydrate::Value">Value</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="struct" href="automerge/hydrate/struct.Text.html" title="struct automerge::hydrate::Text">Text</a>&gt; for <a class="enum" href="automerge/hydrate/enum.Value.html" title="enum automerge::hydrate::Value">Value</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="struct" href="automerge/struct.ExpandedChange.html" title="struct automerge::ExpandedChange">Change</a>&gt; for <a class="struct" href="automerge/struct.Change.html" title="struct automerge::Change">Change</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="struct" href="https://doc.rust-lang.org/1.91.0/alloc/string/struct.String.html" title="struct alloc::string::String">String</a>&gt; for <a class="enum" href="automerge/enum.Prop.html" title="enum automerge::Prop">Prop</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="struct" href="https://doc.rust-lang.org/1.91.0/alloc/string/struct.String.html" title="struct alloc::string::String">String</a>&gt; for <a class="enum" href="automerge/enum.ScalarValue.html" title="enum automerge::ScalarValue">ScalarValue</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="struct" href="https://doc.rust-lang.org/1.91.0/alloc/string/struct.String.html" title="struct alloc::string::String">String</a>&gt; for <a class="struct" href="automerge/hydrate/struct.Text.html" title="struct automerge::hydrate::Text">Text</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="struct" href="https://doc.rust-lang.org/1.91.0/alloc/vec/struct.Vec.html" title="struct alloc::vec::Vec">Vec</a>&lt;<a class="enum" href="automerge/hydrate/enum.Value.html" title="enum automerge::hydrate::Value">Value</a>&gt;&gt; for <a class="enum" href="automerge/hydrate/enum.Value.html" title="enum automerge::hydrate::Value">Value</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="struct" href="https://doc.rust-lang.org/1.91.0/alloc/vec/struct.Vec.html" title="struct alloc::vec::Vec">Vec</a>&lt;<a class="enum" href="automerge/hydrate/enum.Value.html" title="enum automerge::hydrate::Value">Value</a>&gt;&gt; for <a class="struct" href="automerge/hydrate/struct.List.html" title="struct automerge::hydrate::List">List</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="struct" href="https://doc.rust-lang.org/1.91.0/alloc/vec/struct.Vec.html" title="struct alloc::vec::Vec">Vec</a>&lt;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.u8.html">u8</a>&gt;&gt; for <a class="enum" href="automerge/enum.ScalarValue.html" title="enum automerge::ScalarValue">ScalarValue</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="struct" href="https://doc.rust-lang.org/1.91.0/alloc/vec/struct.Vec.html" title="struct alloc::vec::Vec">Vec</a>&lt;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.u8.html">u8</a>&gt;&gt; for <a class="struct" href="automerge/struct.ActorId.html" title="struct automerge::ActorId">ActorId</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="struct" href="https://doc.rust-lang.org/1.91.0/alloc/vec/struct.Vec.html" title="struct alloc::vec::Vec">Vec</a>&lt;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.u8.html">u8</a>&gt;&gt; for <a class="struct" href="automerge/sync/struct.ChunkList.html" title="struct automerge::sync::ChunkList">ChunkList</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="struct" href="https://doc.rust-lang.org/1.91.0/alloc/vec/struct.Vec.html" title="struct alloc::vec::Vec">Vec</a>&lt;<a class="struct" href="https://doc.rust-lang.org/1.91.0/alloc/vec/struct.Vec.html" title="struct alloc::vec::Vec">Vec</a>&lt;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.u8.html">u8</a>&gt;&gt;&gt; for <a class="struct" href="automerge/sync/struct.ChunkList.html" title="struct automerge::sync::ChunkList">ChunkList</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="struct" href="https://doc.rust-lang.org/1.91.0/std/collections/hash/map/struct.HashMap.html" title="struct std::collections::hash::map::HashMap">HashMap</a>&lt;&amp;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.str.html">str</a>, <a class="enum" href="automerge/hydrate/enum.Value.html" title="enum automerge::hydrate::Value">Value</a>&gt;&gt; for <a class="enum" href="automerge/hydrate/enum.Value.html" title="enum automerge::hydrate::Value">Value</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="struct" href="https://doc.rust-lang.org/1.91.0/std/collections/hash/map/struct.HashMap.html" title="struct std::collections::hash::map::HashMap">HashMap</a>&lt;&amp;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.str.html">str</a>, <a class="enum" href="automerge/hydrate/enum.Value.html" title="enum automerge::hydrate::Value">Value</a>&gt;&gt; for <a class="struct" href="automerge/hydrate/struct.Map.html" title="struct automerge::hydrate::Map">Map</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="struct" href="https://doc.rust-lang.org/1.91.0/std/collections/hash/map/struct.HashMap.html" title="struct std::collections::hash::map::HashMap">HashMap</a>&lt;<a class="struct" href="https://doc.rust-lang.org/1.91.0/alloc/string/struct.String.html" title="struct alloc::string::String">String</a>, <a class="enum" href="automerge/hydrate/enum.Value.html" title="enum automerge::hydrate::Value">Value</a>&gt;&gt; for <a class="struct" href="automerge/hydrate/struct.Map.html" title="struct automerge::hydrate::Map">Map</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="struct" href="https://docs.rs/uuid/1.18.1/uuid/struct.Uuid.html" title="struct uuid::Uuid">Uuid</a>&gt; for <a class="struct" href="automerge/struct.ActorId.html" title="struct automerge::ActorId">ActorId</a>',
        ],
        [
          'impl&lt;\'a&gt; <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;&amp;\'a <a class="enum" href="automerge/enum.ScalarValue.html" title="enum automerge::ScalarValue">ScalarValue</a>&gt; for <a class="enum" href="automerge/enum.Value.html" title="enum automerge::Value">Value</a>&lt;\'a&gt;',
        ],
        [
          'impl&lt;\'a&gt; <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;&amp;\'a <a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.str.html">str</a>&gt; for <a class="struct" href="automerge/hydrate/struct.Text.html" title="struct automerge::hydrate::Text">Text</a>',
        ],
        [
          'impl&lt;\'a&gt; <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;&amp;<a class="struct" href="https://doc.rust-lang.org/1.91.0/alloc/string/struct.String.html" title="struct alloc::string::String">String</a>&gt; for <a class="enum" href="automerge/enum.Value.html" title="enum automerge::Value">Value</a>&lt;\'a&gt;',
        ],
        [
          'impl&lt;\'a&gt; <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="enum" href="automerge/enum.ObjType.html" title="enum automerge::ObjType">ObjType</a>&gt; for <a class="enum" href="automerge/enum.Value.html" title="enum automerge::Value">Value</a>&lt;\'a&gt;',
        ],
        [
          'impl&lt;\'a&gt; <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="enum" href="automerge/enum.ScalarValue.html" title="enum automerge::ScalarValue">ScalarValue</a>&gt; for <a class="enum" href="automerge/enum.Value.html" title="enum automerge::Value">Value</a>&lt;\'a&gt;',
        ],
        [
          'impl&lt;\'a&gt; <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.bool.html">bool</a>&gt; for <a class="enum" href="automerge/enum.Value.html" title="enum automerge::Value">Value</a>&lt;\'a&gt;',
        ],
        [
          'impl&lt;\'a&gt; <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.char.html">char</a>&gt; for <a class="enum" href="automerge/enum.Value.html" title="enum automerge::Value">Value</a>&lt;\'a&gt;',
        ],
        [
          'impl&lt;\'a&gt; <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.f64.html">f64</a>&gt; for <a class="enum" href="automerge/enum.Value.html" title="enum automerge::Value">Value</a>&lt;\'a&gt;',
        ],
        [
          'impl&lt;\'a&gt; <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.i32.html">i32</a>&gt; for <a class="enum" href="automerge/enum.Value.html" title="enum automerge::Value">Value</a>&lt;\'a&gt;',
        ],
        [
          'impl&lt;\'a&gt; <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.i64.html">i64</a>&gt; for <a class="enum" href="automerge/enum.Value.html" title="enum automerge::Value">Value</a>&lt;\'a&gt;',
        ],
        [
          'impl&lt;\'a&gt; <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.u32.html">u32</a>&gt; for <a class="enum" href="automerge/enum.Value.html" title="enum automerge::Value">Value</a>&lt;\'a&gt;',
        ],
        [
          'impl&lt;\'a&gt; <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.u64.html">u64</a>&gt; for <a class="enum" href="automerge/enum.Value.html" title="enum automerge::Value">Value</a>&lt;\'a&gt;',
        ],
        [
          'impl&lt;\'a&gt; <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.unit.html">()</a>&gt; for <a class="enum" href="automerge/enum.Value.html" title="enum automerge::Value">Value</a>&lt;\'a&gt;',
        ],
        [
          'impl&lt;\'a&gt; <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="struct" href="https://doc.rust-lang.org/1.91.0/alloc/string/struct.String.html" title="struct alloc::string::String">String</a>&gt; for <a class="enum" href="automerge/enum.Value.html" title="enum automerge::Value">Value</a>&lt;\'a&gt;',
        ],
        [
          'impl&lt;\'a&gt; <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="struct" href="https://doc.rust-lang.org/1.91.0/alloc/vec/struct.Vec.html" title="struct alloc::vec::Vec">Vec</a>&lt;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.u8.html">u8</a>&gt;&gt; for <a class="enum" href="automerge/enum.Value.html" title="enum automerge::Value">Value</a>&lt;\'a&gt;',
        ],
        [
          'impl&lt;\'a&gt; <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;SmolStr&gt; for <a class="enum" href="automerge/enum.Value.html" title="enum automerge::Value">Value</a>&lt;\'a&gt;',
        ],
        [
          'impl&lt;\'a, R: <a class="trait" href="automerge/trait.ReadDoc.html" title="trait automerge::ReadDoc">ReadDoc</a>&gt; <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.reference.html">&amp;\'a R</a>&gt; for <a class="struct" href="automerge/struct.AutoSerde.html" title="struct automerge::AutoSerde">AutoSerde</a>&lt;\'a, R&gt;',
        ],
        [
          'impl&lt;T: <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.Into.html" title="trait core::convert::Into">Into</a>&lt;<a class="enum" href="automerge/enum.ScalarValue.html" title="enum automerge::ScalarValue">ScalarValue</a>&gt;&gt; <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;T&gt; for <a class="enum" href="automerge/hydrate/enum.Value.html" title="enum automerge::hydrate::Value">Value</a>',
        ],
        [
          'impl&lt;const N: <a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.usize.html">usize</a>&gt; <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;&amp;[<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.u8.html">u8</a>; <a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.array.html">N</a>]&gt; for <a class="struct" href="automerge/struct.ActorId.html" title="struct automerge::ActorId">ActorId</a>',
        ],
        [
          'impl&lt;const N: <a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.usize.html">usize</a>&gt; <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/convert/trait.From.html" title="trait core::convert::From">From</a>&lt;[<a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.u8.html">u8</a>; <a class="primitive" href="https://doc.rust-lang.org/1.91.0/std/primitive.array.html">N</a>]&gt; for <a class="struct" href="automerge/struct.ActorId.html" title="struct automerge::ActorId">ActorId</a>',
        ],
      ],
    ],
  ]);
  if (window.register_implementors) {
    window.register_implementors(implementors);
  } else {
    window.pending_implementors = implementors;
  }
})();
//{"start":57,"fragment_lengths":[28116]}
