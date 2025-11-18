# Real Estate Plugin - Manual Testing Guide

## Prerequisites
- Dev server running at `http://localhost:5173`
- Browser with DevTools open (F12)
- Clean browser state (or use Incognito mode for fresh test)

## Phase 2 Testing Checklist

### Test 1: Plugin Installation & CRDT Verification ✓

**Steps:**
1. Navigate to `http://localhost:5173/dashboard/settings/features`
2. Click on **Marketplace** tab
3. Find **Real Estate** plugin
4. Click **Install** button
5. Wait for installation to complete (should show "Installed")

**Verify in DevTools Console:**
```javascript
// Open Console (F12 → Console tab)

// Check if plugin is registered in store
const store = window.__PLUGIN_STORE__;
console.log('Installed plugins:', store?.getState().installedPluginIds);

// Alternative: Check CRDT data directly
const crdtDoc = await window.__CRDT_SERVICE__?.getDocument();
console.log('Plugin metadata:', crdtDoc?.plugins);
console.log('Plugin data:', crdtDoc?.plugin_data?.['real-estate']);
```

**Expected Results:**
- ✓ Install button changes to "Installed"
- ✓ Plugin appears in "Installed" tab
- ✓ Console shows plugin ID in installedPluginIds array
- ✓ CRDT contains `plugins['real-estate']` record
- ✓ CRDT contains `plugin_data['real-estate']` with 3 collections: properties, mortgages, rentals
- ✓ Sample data: 2 properties ("Main Residence", "Rental Property")

---

### Test 2: Properties Page Load & Display

**Steps:**
1. Navigate to `http://localhost:5173/real-estate` (main overview page)
2. Click **Properties** in the sidebar navigation
3. Observe the properties list

**Verify in Browser:**
- ✓ Page loads without errors
- ✓ 2 property cards displayed:
  - **Main Residence** (123 Main St)
  - **Rental Property** (456 Oak Ave)
- ✓ Each card shows:
  - Property image
  - Name and address
  - Property type badge
  - Bedrooms, bathrooms, square feet
  - Purchase and current value
  - Mortgage info (if applicable)
  - Rental info (for rental properties)

**Verify in DevTools Console:**
```javascript
// Check loaded data
const reStore = window.__REAL_ESTATE_STORE__;
console.log('Properties:', reStore?.getState().properties);
console.log('Total Value:', reStore?.getState().totalValue);
console.log('Total Equity:', reStore?.getState().totalEquity);
```

**Expected Results:**
- ✓ No console errors
- ✓ 2 properties displayed
- ✓ Total value: $670,000 ($425k + $245k)
- ✓ Total debt: $456,000 ($280k + $176k)
- ✓ Total equity: $214,000
- ✓ Rental income: $1,800/month

---

### Test 3: Add Property Functionality

**Steps:**
1. Navigate to `http://localhost:5173/real-estate/properties`
2. Click **Add Property** button (top right)
3. Fill in the form:

**Property Details Tab:**
- Name: "Beach House"
- Type: Primary Residence
- Address: "789 Ocean Dr, Miami, FL"
- Property Type: Single Family
- Purchase Date: 2023-01-15
- Bedrooms: 4
- Bathrooms: 3
- Square Feet: 2500

**Financial Details Tab:**
- Purchase Price: 550000
- Current Value: 600000
- Loan Amount: 440000
- Interest Rate: 4.5
- Loan Term: 30

4. Click **Add Property**

**Verify in Browser:**
- ✓ Dialog closes
- ✓ New "Beach House" property card appears
- ✓ Property details display correctly
- ✓ Mortgage payment calculated correctly (~$2,229/month)

**Verify in DevTools Console:**
```javascript
// Check CRDT was updated
const crdtDoc = await window.__CRDT_SERVICE__?.getDocument();
const properties = crdtDoc?.plugin_data?.['real-estate']?.properties;
console.log('Properties count:', Object.keys(properties || {}).length); // Should be 3
console.log('Beach House:', Object.values(properties || {}).find(p => p.name === 'Beach House'));

// Check IndexedDB persistence
const db = await indexedDB.databases();
console.log('IndexedDB databases:', db);
```

**Expected Results:**
- ✓ 3 properties now visible
- ✓ CRDT document updated with new property
- ✓ Total value increased by $600,000
- ✓ Total debt increased by $440,000
- ✓ No console errors during save

---

### Test 4: Update Property Functionality

**⚠️ Note:** Edit functionality is not yet implemented in the UI. You can test updates via DevTools console:

**Steps (Manual Console Test):**
1. Open DevTools Console
2. Execute this code to update a property:

```javascript
// Get the Real Estate store
const store = window.__REAL_ESTATE_STORE__;

// Update Beach House value
await store.getState().updateProperty('beach-house-id', {
  currentValue: 625000  // Increased from 600000
});

// Verify update
const crdtDoc = await window.__CRDT_SERVICE__?.getDocument();
const properties = crdtDoc?.plugin_data?.['real-estate']?.properties;
console.log('Updated property:', properties['beach-house-id']);
```

**Alternative:** Skip this test for now and proceed to Test 5 (Delete)

**Expected Results:**
- ✓ CRDT persists the change
- ✓ Change survives page refresh (Test 6 will verify)
- ✓ Total values recalculate correctly

---

### Test 5: Delete Property Functionality

**Steps:**
1. Find any property card (e.g., "Main Residence" or one you created)
2. Click the **ChevronRight** (→) button to open property details dialog
3. Scroll down to the bottom of the dialog
4. Click **Delete Property** button
5. Confirm deletion in the confirmation dialog

**Verify in Browser:**
- ✓ Property details dialog closes
- ✓ Property card disappears from the properties list
- ✓ Total value on Overview page decreases
- ✓ Total debt decreases
- ✓ Total equity updates correctly

**Verify in DevTools Console:**
```javascript
// Check CRDT deletion
const crdtDoc = await window.__CRDT_SERVICE__?.getDocument();
const properties = crdtDoc?.plugin_data?.['real-estate']?.properties;
const mortgages = crdtDoc?.plugin_data?.['real-estate']?.mortgages;
const rentals = crdtDoc?.plugin_data?.['real-estate']?.rentals;

console.log('Properties count:', Object.keys(properties || {}).length);
console.log('Deleted property still exists:', properties['<property-id>']); // Should be undefined

// Verify associated data also deleted
console.log('Mortgage still exists:', mortgages['<property-id>']); // Should be undefined
console.log('Rental still exists:', rentals['<property-id>']); // Should be undefined
```

**Expected Results:**
- ✓ Property count decreases by 1
- ✓ CRDT record deleted
- ✓ Associated mortgage/rental records also deleted
- ✓ No orphaned data in CRDT

---

### Test 6: Data Persistence Across Refresh

**Steps:**
1. Note the current state:
   - Number of properties
   - Total values displayed
   - Any custom properties you added
2. Press **F5** or **Ctrl+R** to hard refresh the page
3. Navigate back to `http://localhost:5173/real-estate/properties`

**Verify in Browser:**
- ✓ All properties still visible
- ✓ All values match pre-refresh state
- ✓ No data loss

**Verify in DevTools:**
```javascript
// Check data loaded from IndexedDB
const crdtDoc = await window.__CRDT_SERVICE__?.getDocument();
console.log('Properties after refresh:', 
  Object.keys(crdtDoc?.plugin_data?.['real-estate']?.properties || {}).length);
```

**Expected Results:**
- ✓ Data persists correctly
- ✓ No re-initialization or data loss
- ✓ CRDT loaded from IndexedDB successfully

---

### Test 7: Plugin Uninstall & Cleanup

**⚠️ WARNING:** This will delete all Real Estate plugin data!

**Steps:**
1. Navigate to `http://localhost:5173/dashboard/settings/features`
2. Go to **Installed** tab
3. Find **Real Estate** plugin card
4. Click **X** (delete) button
5. Confirm uninstallation

**Verify in Browser:**
- ✓ Plugin removed from Installed tab
- ✓ Plugin available again in Marketplace
- ✓ `/real-estate` route no longer accessible (404 or redirect)
- ✓ Plugin navigation item removed from sidebar

**Verify in DevTools Console:**
```javascript
// Check CRDT cleanup
const crdtDoc = await window.__CRDT_SERVICE__?.getDocument();
console.log('Plugin still in plugins:', crdtDoc?.plugins?.['real-estate']); // Should be undefined
console.log('Plugin data still exists:', crdtDoc?.plugin_data?.['real-estate']); // Should be undefined
console.log('Plugin migrations:', crdtDoc?.plugin_migrations?.['real-estate']); // Should be undefined

// Check SQLite tables dropped (requires DB inspection tool)
// Expect: plugin_real_estate_properties table dropped
// Expect: plugin_real_estate_mortgages table dropped
// Expect: plugin_real_estate_rentals table dropped
```

**Expected Results:**
- ✓ Plugin metadata removed from CRDT
- ✓ All plugin data removed from CRDT
- ✓ Migration records cleaned up
- ✓ SQLite tables dropped (check via DB browser or migration runner logs)
- ✓ Clean uninstall with no orphaned data

---

## Debugging Tips

### Accessing Internal Services in Console

Add these to a React component during development:

```typescript
// In App.tsx or similar initialization file
import { crdtService } from '@/core/sync/crdt';
import { usePluginStore } from '@/features/plugins/store';
import { useRealEstateStore } from '@/features/plugins/real-estate/store';

// Make available globally for debugging
if (import.meta.env.DEV) {
  (window as any).__CRDT_SERVICE__ = crdtService;
  (window as any).__PLUGIN_STORE__ = usePluginStore;
  (window as any).__REAL_ESTATE_STORE__ = useRealEstateStore;
}
```

### Inspecting IndexedDB

1. Open DevTools → Application tab → IndexedDB
2. Look for database named `nuts-crdt` or similar
3. Check `documents` object store
4. Verify document is saved as binary data

### Checking Network Activity

1. Open DevTools → Network tab
2. Filter by XHR/Fetch
3. Verify no unexpected API calls during offline operations
4. Plugin operations should be purely local

### Console Logging

Add these to track CRDT operations:

```javascript
// Watch for CRDT changes
const doc = await window.__CRDT_SERVICE__?.getDocument();
console.log('Full CRDT doc:', JSON.stringify(doc, null, 2));

// Watch for plugin data specifically
const pluginData = doc?.plugin_data?.['real-estate'];
console.log('Properties:', Object.keys(pluginData?.properties || {}).length);
console.log('Mortgages:', Object.keys(pluginData?.mortgages || {}).length);
console.log('Rentals:', Object.keys(pluginData?.rentals || {}).length);
```

---

## Known Issues / Expected Behaviors

1. **First Load Delay:** First plugin load may be slow due to dynamic imports
2. **Hot Reload:** During development, HMR may cause plugin routes to temporarily break
3. **Migration Logs:** Installation logs appear in console - this is expected
4. **Sample Data:** Plugin creates 2 sample properties on first install

---

## Success Criteria

Phase 2 is complete when:
- ✓ Plugin installs without errors
- ✓ Sample data loads and displays correctly
- ✓ CRUD operations work (Create, Read, Update, Delete)
- ✓ Data persists across page refresh
- ✓ Uninstallation cleanly removes all plugin data
- ✓ No memory leaks or orphaned records
- ✓ CRDT storage works offline-first

---

## Next Steps After Phase 2

Once all tests pass, proceed to:

**Option A:** Phase 1 End-to-End Testing (Plan.md lines 740-876)
- Test error scenarios
- Test double installation prevention
- Test CRDT sync between "devices" (tabs)

**Option B:** Phase 3 Ideas Implementation
- Financial calculation hooks
- Dashboard chart injection
- Account type extensions
- Transaction enrichment
