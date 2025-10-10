# 🎨 JSON Column Customization - UI Guide

## Visual Walkthrough of All UI Elements

---

## 📍 Main Toolbar Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Selection: 0/69911] [Import] [Print] [Bulk Edit] [Export] [Delete] [Columns] │
│                      ┌──────────────────────────────────────────────────────┐│
│                      │ [Columns ▼] [✓ JSON paths] [Reset Columns] [Settings] ││
│                      └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘

[Columns] button - Purple, left side, opens full Column Manager
[Columns ▼] dropdown - Quick toggle for fast on/off (hidden on mobile)
[✓ JSON paths] - Checkbox to show/hide paths in headers (hidden on mobile)
[Reset Columns] - Reset to 7 default columns (hidden on mobile)
[Settings] - Existing settings modal (unchanged)
```

---

## 🎯 Button Styles

### Columns Button (Main)
```
┌─────────────────┐
│ 🔲 Columns      │  ← Purple border, hover: purple gradient
└─────────────────┘
  Color: text-purple-700
  Border: border-purple-400
  Hover: from-purple-50 to-purple-100
```

### Quick Toggle Dropdown
```
┌──────────────────┐
│ 🔲 Columns (7) ▼│  ← Shows count, chevron rotates on open
└──────────────────┘
```

### JSON Paths Checkbox
```
┌────────────────┐
│ ☑ JSON paths   │  ← Simple checkbox with label
└────────────────┘
```

### Reset Button
```
┌─────────────────┐
│ Reset Columns   │  ← Gray border, simple style
└─────────────────┘
```

---

## 🎨 Column Manager Modal

```
┌─────────────────────────────────────────────────────────────────┐
│  🔲 Customize Columns                                     ✕     │
│  Selected: 7 of 50+ fields                                      │
├─────────────────────────────────────────────────────────────────┤
│  🔍 [Search fields by name or JSON path.....................] │
│                                                                 │
│  [Select All]  [Deselect All]  [Reset to Default]  [✓ Show JSON paths] │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ ▼ Core Fields (4/6)                                       │ │
│  │   ┌────────────────────────────────────────────────────┐ │ │
│  │   │ ☑ Order Number                      string sortable│ │ │
│  │   │   orderNumber                               [copy] │ │ │
│  │   │   Custom label: [________________]                 │ │ │
│  │   │                                                     │ │ │
│  │   │ ☐ Order ID                          string sortable│ │ │
│  │   │   id                                        [copy] │ │ │
│  │   │                                                     │ │ │
│  │   │ ☑ Customer Name                     string sortable│ │ │
│  │   │   customerName                              [copy] │ │ │
│  │   │   Custom label: [________________]                 │ │ │
│  │   └────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │ ▼ Financial Fields (3/5)                                 │ │
│  │ ▶ Status Fields (2/3)                                    │ │
│  │ ▶ Date Fields (1/2)                                      │ │
│  │ ▶ Customer Fields (0/3)                                  │ │
│  │ ▼ Shipping Address (1/10)                                │ │
│  │   ┌────────────────────────────────────────────────────┐ │ │
│  │   │ ☐ Shipping City                     string         │ │ │
│  │   │   shipping_address.city                     [copy] │ │ │
│  │   │                                                     │ │ │
│  │   │ ☐ Shipping Country                  string         │ │ │
│  │   │   shipping_address.country                  [copy] │ │ │
│  │   └────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │ ▶ Billing Address (0/7)                                  │ │
│  │ ▶ Items & Line Items (0/6)                               │ │
│  │ ▶ Other Fields (1/8)                                     │ │
│  └──────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  [↓ Export]  [↑ Import]          [Cancel]  [Save Changes]     │
└─────────────────────────────────────────────────────────────────┘

Features shown:
- Expandable/collapsible categories with ▼/▶ indicators
- Selected count per category (4/6)
- Type badges (string, number, array, etc.) with colors
- "sortable" indicator for sortable columns
- Copy button for JSON path
- Custom label input (only shown when field is selected)
- Export/Import buttons at bottom
```

---

## 🔻 Quick Toggle Dropdown

```
Clicking [Columns ▼] opens:

┌──────────────────────────────────┐
│ Quick Toggle        7 selected   │
├──────────────────────────────────┤
│ ☑ Order Number                   │
│   orderNumber        string      │
│                                  │
│ ☑ Customer Name                  │
│   customerName       string      │
│                                  │
│ ☑ Fulfillment Status             │
│   fulfillment_status string      │
│                                  │
│ ☑ Total                          │
│   total              number      │
│                                  │
│ ☑ Created At                     │
│   created_at         date        │
│                                  │
│ ☑ Channel                        │
│   channel            string      │
│                                  │
│ ☑ Financial Status               │
│   financial_status   string      │
├──────────────────────────────────┤
│ [⚙ Customize All Columns]       │
└──────────────────────────────────┘

Features:
- Shows only currently selected fields
- Fast checkbox toggle
- Shows field type badge
- Shows JSON path
- Link to full Column Manager at bottom
```

---

## 📊 Table with JSON Paths

### Without JSON Paths (default):
```
┌──────┬─────────┬───────────┬──────────────┬────────┐
│ S.NO │ Order   │ Customer  │ Fulfillment  │ Total  │
├──────┼─────────┼───────────┼──────────────┼────────┤
│ #1   │ #1001   │ John Doe  │ ● Fulfilled  │ ₹1,234 │
│ #2   │ #1002   │ Jane Smith│ ● Partial    │ ₹567   │
└──────┴─────────┴───────────┴──────────────┴────────┘
```

### With JSON Paths enabled:
```
┌──────┬─────────────────────────────┬─────────────────────────┐
│ S.NO │ Order · (orderNumber) [📋] │ Customer · (customerName) [📋] │
├──────┼─────────────────────────────┼─────────────────────────┤
│ #1   │ #1001                       │ John Doe                │
│ #2   │ #1002                       │ Jane Smith              │
└──────┴─────────────────────────────┴─────────────────────────┘

JSON path display:
- Monospace font: font-mono
- Small size: text-[11px]
- Gray color: text-gray-500
- Light background: bg-gray-100
- Rounded: rounded
- Padding: px-1.5 py-0.5
- Copy icon appears on hover
```

---

## 🎨 Color Scheme

### Type Badges
```
string  → bg-green-100 text-green-800   [Green]
number  → bg-blue-100 text-blue-800     [Blue]
boolean → bg-purple-100 text-purple-800 [Purple]
array   → bg-orange-100 text-orange-800 [Orange]
object  → bg-gray-100 text-gray-800     [Gray]
date    → bg-indigo-100 text-indigo-800 [Indigo]
```

### Status Badges (in table cells)
```
Fulfillment Status:
- Fulfilled   → bg-green-100 text-green-800   [Green]
- Unfulfilled → bg-red-100 text-red-800       [Red]
- Partial     → bg-yellow-100 text-yellow-800 [Yellow]

Financial Status:
- Paid     → bg-green-100 text-green-800      [Green]
- Pending  → bg-yellow-100 text-yellow-800    [Yellow]
- Refunded → bg-red-100 text-red-800          [Red]

Delivery Status:
- Delivered   → bg-green-100 text-green-800   [Green]
- Shipped     → bg-blue-100 text-blue-800     [Blue]
- Processing  → bg-yellow-100 text-yellow-800 [Yellow]
- Pending     → bg-gray-100 text-gray-800     [Gray]
```

### Button Colors
```
Columns (main)   → text-purple-700 border-purple-400
Import           → text-blue-700 border-blue-400
Print            → text-indigo-700 border-indigo-400
Bulk Edit        → text-blue-700 border-blue-500
Export           → text-green-700 border-green-400
Delete           → text-red-700 border-red-500
Reset Columns    → text-gray-600 border-gray-300
Settings         → text-gray-700 border-gray-300
```

---

## 📱 Responsive Behavior

### Desktop (≥768px)
```
[Columns] [Columns ▼] [✓ JSON paths] [Reset Columns] [Settings]
All controls visible
```

### Tablet/Mobile (<768px)
```
[Columns] [Settings]
Quick Toggle, JSON checkbox, and Reset button hidden
Use main "Columns" button to access all features in modal
```

### Mobile Recommendation
```
Add a "More" menu:

[Columns] [...More]

Clicking [More]:
  - Customize Columns
  - Toggle JSON paths
  - Reset Columns
  - Settings
```

---

## 🎯 Interactive States

### Buttons
```
Default:  bg-white shadow-sm
Hover:    shadow-md (gradient for some)
Active:   Slight press effect
Disabled: opacity-50 cursor-not-allowed
```

### Checkboxes
```
Unchecked: border-gray-300
Checked:   bg-purple-600 (for JSON paths checkbox)
           bg-blue-600 (for field selections)
Focus:     ring-2 ring-blue-500
```

### Modal
```
Background: bg-black bg-opacity-50 (overlay)
Modal:      bg-white rounded-lg shadow-2xl
Animation:  Fade in/out
```

### Dropdown (Quick Toggle)
```
Closed:  ChevronDown
Open:    ChevronDown rotate-180
Max height: 400px with scroll
```

---

## 📐 Spacing & Sizing

### Toolbar
```
Padding: px-0 py-1 (compact)
Gap between buttons: gap-2
Button padding: px-3 py-1
Font size: text-xs sm:text-sm (responsive)
```

### Modal
```
Max width: max-w-5xl
Max height: max-h-[90vh]
Padding: p-4 (content), p-6 (header/footer)
Border radius: rounded-lg
```

### Category Sections
```
Category header: p-3
Fields container: pl-4 (indented)
Field item: p-3
Gap between fields: space-y-1
```

### Quick Toggle
```
Width: w-72
Max height: max-h-[400px]
Dropdown offset: mt-2
```

---

## 🔍 Search UX

### Search Input
```
┌────────────────────────────────────────────┐
│ 🔍 Search fields by name or JSON path...   │
└────────────────────────────────────────────┘

Features:
- Placeholder text guides user
- Magnifying glass icon on left
- Full width
- Filters as you type (instant)
- Highlights matching text
- Shows matching categories only
```

### No Results State
```
┌────────────────────────────────────────────┐
│                                            │
│              🔍                            │
│                                            │
│     No fields match your search            │
│                                            │
└────────────────────────────────────────────┘
```

---

## ✨ Animation Details

### Modal Open/Close
```
Open:  Fade in (300ms) + scale up slightly
Close: Fade out (200ms) + scale down
```

### Dropdown Open/Close
```
Open:  Slide down (150ms)
Close: Slide up (100ms)
```

### Checkbox Toggle
```
Change: Smooth color transition (150ms)
```

### Button Hover
```
Hover: Scale up 1.02 + shadow increase (200ms)
```

### Category Expand/Collapse
```
Expand:   Rotate chevron + slide down content (200ms)
Collapse: Rotate chevron + slide up content (200ms)
```

---

## 🎭 Empty States

### Zero Columns Selected
```
┌────────────────────────────────────────────┐
│                                            │
│              📊                            │
│                                            │
│     No columns selected                    │
│                                            │
│  [Customize columns] to get started        │
│                                            │
└────────────────────────────────────────────┘
```

### Import Error
```
┌────────────────────────────────────────────┐
│ ⚠ Failed to parse configuration file       │
│ Please check that the file is valid JSON.  │
└────────────────────────────────────────────┘
Red background: bg-red-50
Red border: border-red-200
Red text: text-red-700
```

---

## 📊 Data Display in Cells

### Text (truncated)
```
"This is a very long customer nam..." ← hover shows full text
```

### Number
```
1,234.56 ← localized formatting
```

### Currency
```
₹1,234.56 ← rupee symbol + formatted
```

### Boolean
```
✓ Yes  or  ✗ No (in colored badges)
```

### Array
```
[3 items] ← hover shows full JSON
```

### Object
```
[Object] ← hover shows full JSON
```

### Date
```
Oct 10, 2024 ← formatted, readable
```

### Tags
```
[Priority] [VIP] +3 ← max 2 shown + count
```

### Null/Undefined
```
N/A ← muted gray, italic
```

---

## 🖱️ Cursor & Hover States

### Buttons
```
cursor-pointer hover:shadow-md
```

### Checkboxes
```
cursor-pointer
```

### Labels (with checkbox)
```
cursor-pointer hover:bg-gray-50
```

### Disabled Elements
```
cursor-not-allowed opacity-50
```

### Copy Buttons
```
cursor-pointer text-gray-400 hover:text-gray-600
```

### Category Headers
```
cursor-pointer hover:bg-gray-200
```

---

## 🎯 Focus States

All interactive elements have visible focus states:

### Inputs & Checkboxes
```
focus:ring-2 focus:ring-blue-500 focus:border-transparent
```

### Buttons
```
focus:outline-none focus:ring-2 focus:ring-offset-2
```

### Keyboard Navigation
```
Tab: Move between elements
Enter: Activate button/checkbox
Escape: Close modal/dropdown
```

---

## 📏 Iconography

All icons from lucide-react:

- **Columns**: Column layout icon
- **Search**: Magnifying glass
- **X**: Close button
- **ChevronDown**: Dropdown indicator
- **ChevronRight**: Collapsed category
- **Copy**: Copy to clipboard
- **Check**: Copied confirmation
- **Download**: Export
- **Upload**: Import

Icon sizes:
- Buttons: h-4 w-4
- Modal header: h-5 w-5
- Small icons: h-3 w-3

---

## 🎨 Summary

The UI is designed to be:
- ✅ **Intuitive**: Clear labels, logical grouping
- ✅ **Fast**: Quick toggle for common actions
- ✅ **Responsive**: Adapts to all screen sizes
- ✅ **Accessible**: Keyboard nav, focus states
- ✅ **Beautiful**: Modern colors, smooth animations
- ✅ **Professional**: Consistent with existing design

---

**Last Updated**: October 10, 2025  
**Version**: 1.0.0  
**Design System**: Tailwind CSS 3+

