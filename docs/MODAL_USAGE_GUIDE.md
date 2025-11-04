# Enhanced Detail Modal - Usage Guide

## Overview

The `EnhancedDetailModal` is a **universal, reusable modal component** that works across all pages in the Inkhub Admin panel. This eliminates code duplication and ensures consistent UX.

## Key Features

✅ **Single Component for All Pages** - No more separate modals for different pages  
✅ **Configurable Size** - 7 preset sizes from small to full-width  
✅ **Auto-Configuration** - Automatically configures fields based on `itemType`  
✅ **Built-in Actions** - Edit, Delete, Save, View JSON  
✅ **Keyboard Shortcuts** - Esc (close), J (toggle JSON), C (copy JSON)  
✅ **Image Optimization** - Automatic S3 URL optimization  
✅ **Proper Z-Index** - Always appears above navbar (z-index: 9999)  

---

## Modal Size Options

| Size | Class | Width | Best For |
|------|-------|-------|----------|
| `sm` | `max-w-sm` | 384px | Simple confirmations |
| `md` | `max-w-md` | 448px | Basic forms |
| `lg` | `max-w-lg` | 512px | Standard content |
| `xl` | `max-w-xl` | 576px | Rich content |
| **`2xl`** | `max-w-2xl` | 672px | **ALL PAGES** ✅ (Pins, Boards, Designs, Content, Products, Orders) |
| `4xl` | `max-w-4xl` | 896px | Legacy large modal (default for backward compatibility) |
| `full` | `max-w-[95vw]` | 95% width | Full-screen content |

**Note:** All pages now use `2xl` (672px) for consistent modal sizing across the entire admin panel.

---

## Usage Examples

### 1. Products Page (Large Modal)

```tsx
<EnhancedDetailModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  item={product}
  itemType="product"
  size="4xl"  // Large modal for detailed product info
  onEdit={handleEdit}
  onDelete={handleDelete}
  onSave={handleSave}
/>
```

### 2. Orders Page (Large Modal)

```tsx
<EnhancedDetailModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  item={order}
  itemType="order"
  size="4xl"  // Large modal for detailed order info
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

### 3. Pins Page (Medium Modal)

```tsx
<EnhancedDetailModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  item={pin}
  itemType="pin"
  size="2xl"  // Medium modal for pin details
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

### 4. Boards Page (Medium Modal)

```tsx
<EnhancedDetailModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  item={board}
  itemType="board"
  size="2xl"  // Medium modal for board details
/>
```

### 5. Designs Page (Medium Modal)

```tsx
<EnhancedDetailModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  item={design}
  itemType="design"
  size="2xl"  // Medium modal for design details
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

### 6. Content Library (Medium Modal)

```tsx
<EnhancedDetailModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  item={content}
  itemType="content"
  size="2xl"  // Medium modal for content details
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

### 7. Custom Title Override

```tsx
<EnhancedDetailModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  item={item}
  itemType="product"
  customTitle="My Custom Title"  // Override default title
  size="xl"
/>
```

---

## Using with UnifiedTable

`UnifiedTable` automatically uses `EnhancedDetailModal`. Just pass the `modalSize` prop:

```tsx
<UnifiedTable
  data={products}
  columns={columns}
  itemTypeName="Product"
  modalSize="4xl"  // Control modal size
  // ... other props
/>
```

---

## Using with PageTemplate

`PageTemplate` also supports the `modalSize` prop:

```tsx
<PageTemplate
  config={config}
  data={pins}
  modalSize="2xl"  // Control modal size
  // ... other props
/>
```

---

## Supported Item Types

| Item Type | Auto-Generated Title | Configured Fields |
|-----------|---------------------|-------------------|
| `product` | "Product Details" | title, description, price, status, inventory, SKU, tags, etc. |
| `order` | "Order Details" | orderNumber, customer, status, fulfillment, payment, total, etc. |
| `pin` | "Pin Details" | title, description, board, owner, type, status, likes, repins, etc. |
| `board` | "Board Details" | name, description, owner, category, privacy, status, followers, etc. |
| `design` | "Design Details" | name, description, type, category, status, price, size, views, etc. |
| `content` | "Content Details" | title, description, type, status, category, author, format, views, etc. |

---

## Auto-Configured Fields by Type

Each `itemType` has pre-configured fields that automatically render in the modal:

### Product Fields
- title, description, price, status, productType, category, vendor
- inventoryQuantity, SKU, createdAt, updatedAt, tags

### Order Fields
- orderNumber, customerName, customerEmail, status, fulfillmentStatus
- financialStatus, total, items, channel, deliveryMethod, dates, tags

### Pin Fields
- title, description, board, owner, type, status
- likes, comments, repins, tags

### Board Fields
- name, description, owner, category, privacy, status
- pinCount, followers, tags

### Design Fields
- name, description, type, category, status, price
- size, views, downloads, tags

### Content Fields
- title, description, type, status, category, author
- size, format, views, downloads, dates, tags

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Esc` | Close modal |
| `J` | Toggle JSON view |
| `C` | Copy JSON to clipboard |

---

## Z-Index Hierarchy

The modal system uses a proper z-index hierarchy:

```
Layer 9999:  Modals (EnhancedDetailModal)
Layer 200:   Full-Screen Mode
Layer 100:   Navbar
Layer 1-50:  Base Content
```

This ensures modals always appear on top, even above the navbar.

---

## Migration Guide

### Before (Separate Modals)

```tsx
// Products page had its own modal
<ProductDetailModal item={product} ... />

// Orders page had its own modal  
<OrderDetailModal item={order} ... />

// Pins page had its own modal
<PinDetailModal item={pin} ... />
```

### After (Single Generic Modal)

```tsx
// All pages use the same modal with different sizes
<EnhancedDetailModal 
  item={item} 
  itemType="product" 
  size="4xl"  // Only difference
/>

<EnhancedDetailModal 
  item={item} 
  itemType="order" 
  size="4xl"
/>

<EnhancedDetailModal 
  item={item} 
  itemType="pin" 
  size="2xl"  // Smaller for pins
/>
```

---

## Benefits of This Approach

1. **Code Reusability** - One modal component instead of 6+ separate ones
2. **Consistent UX** - Same behavior, styling, and shortcuts everywhere
3. **Easy Maintenance** - Fix once, works everywhere
4. **Flexible Sizing** - Control size per page without code duplication
5. **Type Safety** - Full TypeScript support with auto-completion
6. **Future-Proof** - Easy to add new item types

---

## Best Practices

1. **Use appropriate sizes**:
   - `4xl` for data-heavy items (Products, Orders)
   - `2xl` for visual items (Pins, Boards, Designs)
   - `xl` or `lg` for simple items

2. **Always provide `onClose`** - Required for proper cleanup

3. **Use `customTitle`** sparingly - Let auto-configuration work

4. **Implement callbacks** - Provide `onEdit`, `onDelete`, `onSave` for full functionality

5. **Let the modal auto-configure** - It knows the right fields for each `itemType`

---

## Troubleshooting

### Modal appears behind navbar
- ✅ Fixed! Modal now uses `z-[9999]` to always appear on top

### Modal size not changing
- Check that you're passing the `size` prop correctly
- Verify the size value is one of the 7 valid options

### Fields not showing
- Ensure `item` object has the expected field names
- Check `itemType` is spelled correctly

### Image not loading
- Modal automatically optimizes S3 URLs
- Check image URL is valid and accessible

---

## Summary

**Old Approach**: Different modals for different pages → Code duplication  
**New Approach**: One generic modal with configurable size → DRY principle ✅

Now you can use the same modal everywhere with just 2 changes:
1. Set the `itemType` (product, order, pin, board, design, content)
2. Set the `size` (4xl for large, 2xl for medium)

That's it! 🎉

