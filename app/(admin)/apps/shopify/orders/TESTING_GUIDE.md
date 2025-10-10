# 🧪 JSON Column Customization - Testing Guide

## Quick Verification (5 minutes)

### Test 1: Open the Column Manager
```
1. Navigate to /apps/shopify/orders
2. Look for purple "Columns" button in toolbar
3. Click it
4. Modal should open with 9 categories
5. You should see "83 fields" in the header
✅ PASS if modal opens and shows all fields
```

### Test 2: Verify Real Data Display
```
1. Expand "Core Fields" category
2. Select "Order Name" (name)
3. Select "Email" (email)
4. Click "Save Changes"
5. Table should show:
   - Order names like "#INK5253"
   - Real customer emails
✅ PASS if real data displays (not "N/A")
```

### Test 3: Test Nested Fields
```
1. Open Column Manager again
2. Expand "Shipping Address"
3. Select "Shipping City" (shipping_address.city)
4. Select "Shipping Country" (shipping_address.country)
5. Click "Save Changes"
6. Table should show:
   - Real cities like "Dholka", "JAMMU"
   - Real countries like "India"
✅ PASS if nested data displays correctly
```

### Test 4: Test Array Fields
```
1. Open Column Manager
2. Select "Line Items" (line_items)
3. Select "Shipping Method" (shipping_lines.0.title)
4. Click "Save Changes"
5. Table should show:
   - Line Items: "[3 items]" or similar
   - Shipping Method: "Prepaid / Online", "Standard Shipping"
✅ PASS if arrays display with item counts
```

### Test 5: Test Persistence
```
1. Customize columns (select 5-10 fields)
2. Refresh the page (F5)
3. Your selected columns should still be visible
✅ PASS if columns persist across refresh
```

---

## Detailed Testing Checklist

### UI Components

#### Column Manager Modal
- [ ] Opens when clicking "Columns" button
- [ ] Shows "Customize Columns" header
- [ ] Shows field count (e.g., "7 of 83 fields selected")
- [ ] Close button (X) works
- [ ] Search input appears at top
- [ ] Quick action buttons appear (Select All, Deselect All, Reset)
- [ ] "Show JSON paths" checkbox appears
- [ ] All 9 categories appear
- [ ] Categories expand/collapse on click
- [ ] Selected count shows per category
- [ ] Export/Import buttons at bottom
- [ ] Cancel/Save buttons at bottom

#### Field Display
- [ ] Each field shows checkbox
- [ ] Field name displays
- [ ] Type badge displays (green for string, blue for number, etc.)
- [ ] "sortable" indicator shows for sortable fields
- [ ] JSON path shows in monospace font
- [ ] Copy button appears next to path
- [ ] Custom label input appears when field is selected
- [ ] Hovering shows visual feedback

#### Quick Toggle Dropdown
- [ ] "Columns (N)" button shows count
- [ ] Clicking opens dropdown
- [ ] Shows currently selected fields only
- [ ] Each field has checkbox (all checked)
- [ ] Field type badge displays
- [ ] JSON path displays
- [ ] "Customize All Columns" button at bottom
- [ ] Closes when clicking outside
- [ ] Closes when pressing Escape

#### Toolbar Controls
- [ ] "Columns" button (purple) appears
- [ ] Quick Toggle dropdown appears (desktop only)
- [ ] "JSON paths" checkbox appears (desktop only)
- [ ] "Reset Columns" button appears (desktop only)
- [ ] "Settings" button still works

---

### Data Display

#### Core Fields
- [ ] `name` → Shows "#INK5253" format
- [ ] `email` → Shows real email addresses
- [ ] `phone` → Shows "+918128872211" format
- [ ] `contact_email` → Shows contact emails
- [ ] `number` → Shows order numbers like 4253
- [ ] `order_number` → Shows order numbers like 5253
- [ ] `confirmation_number` → Shows codes like "NK1FWGKYA"

#### Financial Fields
- [ ] `total_price` → Shows "997.00" or similar
- [ ] `current_total_price` → Displays correctly
- [ ] `subtotal_price` → Shows subtotal
- [ ] `currency` → Shows "INR"
- [ ] `financial_status` → Shows "Paid" badge (green)
- [ ] `total_tax` → Shows tax amount
- [ ] `total_discounts` → Shows discount amount
- [ ] All currency fields show ₹ symbol

#### Status Fields
- [ ] `fulfillment_status` → Shows "Fulfilled" badge (green)
- [ ] `confirmed` → Shows "Yes" or "No"
- [ ] `test` → Shows "Yes" or "No"

#### Date Fields
- [ ] `created_at` → Formats as "Mar 30, 2024"
- [ ] `updated_at` → Formats correctly
- [ ] `processed_at` → Displays properly
- [ ] `closed_at` → Shows date or N/A

#### Customer Nested Fields
- [ ] `customer.first_name` → Shows "Yash"
- [ ] `customer.last_name` → Shows "Patel"
- [ ] `customer.email` → Shows email
- [ ] `customer.phone` → Shows phone
- [ ] `customer.verified_email` → Shows Yes/No

#### Shipping Address (12 fields)
- [ ] `shipping_address.name` → Shows full name
- [ ] `shipping_address.city` → Shows "Dholka", "JAMMU", etc.
- [ ] `shipping_address.province` → Shows "Gujarat", "Jammu and Kashmir"
- [ ] `shipping_address.province_code` → Shows "GJ", "JK"
- [ ] `shipping_address.country` → Shows "India"
- [ ] `shipping_address.country_code` → Shows "IN"
- [ ] `shipping_address.zip` → Shows "382225", "180007"
- [ ] `shipping_address.phone` → Shows phone numbers
- [ ] `shipping_address.address1` → Shows street address
- [ ] `shipping_address.address2` → Shows N/A or second line
- [ ] `shipping_address.first_name` → Shows first name
- [ ] `shipping_address.last_name` → Shows last name

#### Billing Address (12 fields)
- [ ] All billing_address fields work similarly to shipping

#### Array Fields
- [ ] `line_items` → Shows "[3 items]"
- [ ] `shipping_lines` → Shows "[1 item]"
- [ ] `discount_codes` → Shows "[0 items]" or "[1 item]"
- [ ] `note_attributes` → Shows "[N items]"
- [ ] `fulfillments` → Shows "[1 item]"
- [ ] `refunds` → Shows "[0 items]"
- [ ] `payment_gateway_names` → Shows "[1 item]"
- [ ] Hovering shows full JSON in tooltip

#### Nested Array Access
- [ ] `shipping_lines.0.title` → Shows "Prepaid / Online", "Standard Shipping"
- [ ] `shipping_lines.0.price` → Shows "0.00", "50.00"
- [ ] `shipping_lines.0.code` → Shows "custom", "Standard Shipping"
- [ ] `fulfillments.0.tracking_number` → Shows "21813116336142"
- [ ] `fulfillments.0.tracking_company` → Shows "Delhivery FR"
- [ ] `fulfillments.0.shipment_status` → Shows "delivered"

#### Special Fields
- [ ] `tags` → Shows as chips ("Delivered", "sync") for comma-separated string
- [ ] `browser_ip` → Shows IP address
- [ ] `order_status_url` → Shows URL (truncated)
- [ ] `current_total_price_set.shop_money.amount` → Shows amount
- [ ] `buyer_accepts_marketing` → Shows Yes/No
- [ ] `tax_exempt` → Shows Yes/No
- [ ] `taxes_included` → Shows Yes/No

---

### Functionality Testing

#### Column Selection
- [ ] Clicking checkbox selects/deselects field
- [ ] Selected fields show blue background
- [ ] Deselected fields show white background
- [ ] Selection persists when scrolling
- [ ] Custom label input appears when selected
- [ ] Custom label saves and applies

#### Search & Filter
- [ ] Typing in search filters fields instantly
- [ ] Search by label works (e.g., "email")
- [ ] Search by path works (e.g., "customer.email")
- [ ] Search by partial match works
- [ ] Clearing search shows all fields
- [ ] "No fields match" shows if no results

#### Quick Actions
- [ ] "Select All" selects all 83 fields
- [ ] "Deselect All" clears all selections
- [ ] "Reset to Default" restores 7 default columns
- [ ] "Show JSON paths" toggle works in modal
- [ ] Changes apply immediately to table

#### Export/Import
- [ ] "Export" downloads JSON file
- [ ] Downloaded file is valid JSON
- [ ] "Import" opens file picker
- [ ] Selecting valid JSON applies config
- [ ] Invalid JSON shows error message
- [ ] Import preview shows field count

#### Persistence
- [ ] Closing modal without saving doesn't apply changes
- [ ] Clicking "Save Changes" persists config
- [ ] Refreshing page loads saved config
- [ ] Different users have different configs
- [ ] localStorage keys are properly formatted

---

### Visual Testing

#### Status Badges
- [ ] Financial "paid" → Green badge
- [ ] Financial "pending" → Yellow badge
- [ ] Financial "refunded" → Red badge
- [ ] Fulfillment "fulfilled" → Green badge
- [ ] Fulfillment "unfulfilled" → Red badge
- [ ] Fulfillment "partial" → Yellow badge
- [ ] Shipment "delivered" → Green badge
- [ ] Shipment "shipped" → Blue badge

#### Type Badges
- [ ] string → Green badge
- [ ] number → Blue badge
- [ ] boolean → Purple badge
- [ ] array → Orange badge
- [ ] object → Gray badge
- [ ] date → Indigo badge

#### JSON Path Display
- [ ] When "Show JSON paths" is enabled:
  - [ ] Headers show: "Label · (json.path)"
  - [ ] Path is monospace font
  - [ ] Path is gray color (text-gray-500)
  - [ ] Path has light gray background
  - [ ] Copy icon appears
  - [ ] Clicking copy icon copies path
  - [ ] Checkmark appears after copying

#### Tooltips
- [ ] Long text shows tooltip on hover
- [ ] Arrays show full JSON in tooltip
- [ ] Objects show full JSON in tooltip
- [ ] Tooltips are readable and formatted

---

### Edge Cases

#### Missing Data
- [ ] Fields with null show "N/A"
- [ ] Fields with undefined show "N/A"
- [ ] Fields with empty string show "N/A" or empty
- [ ] Missing nested paths show "N/A"
- [ ] Missing array indices show "N/A"

#### Special Values
- [ ] Zero (0) displays as "0"
- [ ] Empty array shows "[0 items]"
- [ ] Empty object shows "[Object]"
- [ ] Empty string shows as empty cell
- [ ] Boolean false shows "No"

#### Performance
- [ ] Modal opens quickly (<100ms)
- [ ] Search filters instantly (<50ms)
- [ ] Selecting fields is responsive
- [ ] Saving config is fast (<50ms)
- [ ] Table updates smoothly after save
- [ ] No lag when scrolling in modal

---

## Real Data Verification

Based on API response from https://brmh.in/cache/data:

### Expected Values for Order #INK5253
```
name → "#INK5253"
order_number → 5253
number → 4253
email → "yashpatel9515@gmail.com"
phone → "+918128872211"
currency → "INR"
total_price → "997.00"
financial_status → "paid" (Green badge)
fulfillment_status → "fulfilled" (Green badge)
created_at → "Mar 30, 2024"
shipping_address.city → "Dholka"
shipping_address.province → "Gujarat"
shipping_address.country → "India"
shipping_lines.0.title → "Prepaid / Online"
line_items → "[3 items]"
tags → "Delivered, sync" (shows as 2 chips)
fulfillments.0.tracking_number → "21813116336142"
fulfillments.0.shipment_status → "delivered"
```

### Test Each Field
Open Column Manager and select each field one by one, verify it shows the expected value from the JSON above.

---

## Automated Testing Script (Developer Tool)

Run this in browser console to verify all fields:

```javascript
// Test field path resolution
const testOrder = {
  name: "#INK5253",
  order_number: 5253,
  email: "test@example.com",
  shipping_address: { city: "Test City" },
  line_items: [{}, {}, {}]
}

// Should return "#INK5253"
console.log(getValueFromPath(testOrder, 'name'))

// Should return "Test City"
console.log(getValueFromPath(testOrder, 'shipping_address.city'))

// Should return 3
console.log(getValueFromPath(testOrder, 'line_items.length'))
```

---

## Performance Benchmarks

Run in console to measure performance:

```javascript
// Measure column generation time
console.time('Column Generation')
const columns = generateColumns(selectedFields, { showJsonKeys: true })
console.timeEnd('Column Generation')
// Should be < 10ms

// Measure modal render time
console.time('Modal Render')
openColumnManager()
console.timeEnd('Modal Render')
// Should be < 100ms

// Measure config save time
console.time('Save Config')
saveColumnConfig(config)
console.timeEnd('Save Config')
// Should be < 20ms
```

---

## Browser Testing

Test in multiple browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

---

## Accessibility Testing

- [ ] Tab navigation works through all controls
- [ ] Enter key activates buttons
- [ ] Escape key closes modal
- [ ] Escape key closes dropdown
- [ ] Checkboxes have proper labels
- [ ] Buttons have proper aria-labels
- [ ] Focus indicators are visible
- [ ] Screen reader announces modal open/close

---

## Regression Testing

Ensure existing features still work:

- [ ] Existing search still works
- [ ] Advanced filters still work
- [ ] Sorting still works
- [ ] Pagination still works
- [ ] Bulk actions still work
- [ ] Export modal still works
- [ ] Settings modal still works
- [ ] KPI cards still update

---

## Error Scenarios

### Import Errors
- [ ] Importing non-JSON file shows error
- [ ] Importing invalid JSON shows error
- [ ] Importing empty file shows error
- [ ] Error message is user-friendly

### LocalStorage Errors
- [ ] Works when localStorage is full
- [ ] Works in incognito mode
- [ ] Works when localStorage is disabled (fallback)
- [ ] Clears old versions on quota exceeded

### Network Errors
- [ ] Works when API is slow
- [ ] Works when API returns partial data
- [ ] Shows N/A for missing fields gracefully

---

## Success Criteria

### Must Have (P0)
- ✅ All 83 fields accessible
- ✅ Real data displays (not N/A)
- ✅ Nested paths work (shipping_address.city)
- ✅ Array indices work (shipping_lines.0.title)
- ✅ Persistence works across refresh
- ✅ Export/Import works
- ✅ No linting errors
- ✅ No console errors

### Should Have (P1)
- ✅ Quick toggle dropdown works
- ✅ JSON paths display in headers
- ✅ Custom labels save and apply
- ✅ Search/filter is fast
- ✅ Mobile responsive

### Nice to Have (P2)
- [ ] Keyboard shortcuts
- [ ] Drag-and-drop reordering
- [ ] Column width persistence
- [ ] Preset configurations

---

## Known Good Configuration

Copy this JSON to test import:

```json
{
  "selectedFields": [
    { "key": "name", "label": "Order Name", "path": "name", "type": "string", "sortable": true },
    { "key": "email", "label": "Customer Email", "path": "email", "type": "string", "sortable": true },
    { "key": "currentTotalPrice", "label": "Total", "path": "current_total_price", "type": "string", "sortable": true },
    { "key": "financialStatus", "label": "Payment", "path": "financial_status", "type": "string", "sortable": true },
    { "key": "fulfillmentStatus", "label": "Fulfillment", "path": "fulfillment_status", "type": "string", "sortable": true },
    { "key": "shipping_address.city", "label": "City", "path": "shipping_address.city", "type": "string", "sortable": false },
    { "key": "createdAt", "label": "Date", "path": "created_at", "type": "date", "sortable": true }
  ],
  "showJsonKeys": false,
  "customLabels": {},
  "columnWidths": {}
}
```

Save this as `test-config.json` and import it to verify the feature works.

---

## Troubleshooting

### If columns show "N/A"
1. Open browser DevTools → Console
2. Check for errors
3. Verify API data structure matches expected paths
4. Use "Show JSON paths" to see exact paths being used
5. Compare with API response from https://brmh.in/cache/data

### If modal won't open
1. Check React DevTools for state
2. Verify `showColumnManager` is true
3. Check console for errors
4. Clear browser cache and reload

### If persistence doesn't work
1. Check localStorage in DevTools
2. Look for keys starting with `inkhub:orders:columns:v1:`
3. Verify userId is consistent
4. Try clearing localStorage and starting fresh

---

## Success Indicators

You'll know it's working when:
- ✅ Real order names appear (not "N/A")
- ✅ Real customer emails display
- ✅ Shipping cities show actual city names
- ✅ Line items show "[3 items]" with hover details
- ✅ Financial status shows colored badges
- ✅ Dates format as "Mar 30, 2024"
- ✅ Tags display as chips ("Delivered", "sync")
- ✅ Tracking numbers appear
- ✅ All 83 fields are accessible
- ✅ Config persists across page refresh

---

**Ready for testing!** 🚀

Start with Test 1-5 above, then work through the detailed checklist.

**Estimated Testing Time**: 30-60 minutes for thorough testing

---

**Last Updated**: October 10, 2025  
**Status**: Ready for QA  
**Priority**: High - Verifies real data integration

