# Enhanced Detail Modal Component

A comprehensive modal component for displaying and editing item details with a modern, responsive design.

## 🎯 Features

### ✅ **Smaller Modal Container**
- **Max-width**: 800px (4xl)
- **Centered**: Automatically centered on screen
- **Rounded corners**: `rounded-2xl`
- **Shadow**: `shadow-xl`
- **Padding**: `p-6`
- **Responsive**: Works on all screen sizes

### ✅ **Side-by-Side Layout**
- **Left side**: Image display with upload functionality
- **Right side**: All data details in organized sections
- **Grid layout**: `grid-cols-1 lg:grid-cols-2 gap-6`
- **Responsive**: Stacks on mobile devices

### ✅ **Editable Data**
- **Edit mode**: Toggle between view and edit modes
- **All fields editable**: Text, numbers, selects, textareas, tags, dates
- **Image upload**: Change images with file picker
- **Real-time updates**: Changes apply immediately
- **Save functionality**: Persist changes to backend

### ✅ **Delete Functionality**
- **Delete button**: Red delete button with confirmation
- **Confirmation modal**: Prevents accidental deletions
- **API integration**: DELETE request to backend

### ✅ **API Integration**
- **Edit**: PATCH/PUT requests for updates
- **Delete**: DELETE requests for removal
- **Save**: Persist changes and refresh data
- **Error handling**: Proper error handling and user feedback

## 🚀 Usage

### Basic Implementation

```tsx
import { EnhancedDetailModal } from '@/components/shared'

function MyPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  const handleItemClick = (item) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handleEdit = async (id: string, data: any) => {
    // Implement your edit logic here
    console.log('Edit item:', id, data)
  }

  const handleDelete = async (id: string) => {
    // Implement your delete logic here
    console.log('Delete item:', id)
  }

  const handleSave = async (id: string, data: any) => {
    // Implement your save logic here
    console.log('Save item:', id, data)
  }

  return (
    <div>
      {/* Your page content */}
      
      <EnhancedDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedItem}
        itemType="pin" // or 'board', 'design', 'product', 'order'
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSave={handleSave}
      />
    </div>
  )
}
```

### With PageTemplate Integration

The `PageTemplate` component automatically uses the `EnhancedDetailModal` when you click on items:

```tsx
import { PageTemplate } from '@/components/shared'

function PinsPage() {
  const pageConfig = {
    title: 'Pinterest Pins',
    // ... other config
  }

  return (
    <PageTemplate
      config={pageConfig}
      data={pinsData}
      // ... other props
    />
  )
}
```

## 📋 Supported Item Types

### 1. **Pins** (`itemType="pin"`)
**Fields:**
- Title (text)
- Description (textarea)
- Board (text)
- Owner (text)
- Type (select: image, video, article)
- Status (select: active, archived)
- Likes (number)
- Comments (number)
- Repins (number)
- Tags (tags array)

### 2. **Boards** (`itemType="board"`)
**Fields:**
- Name (text)
- Description (textarea)
- Owner (text)
- Category (text)
- Privacy (select: public, private)
- Status (select: active, archived)
- Pin Count (number)
- Followers (number)
- Tags (tags array)

### 3. **Designs** (`itemType="design"`)
**Fields:**
- Name (text)
- Description (textarea)
- Type (select: logo, banner, social_media, print, web, illustration)
- Category (text)
- Status (select: completed, in_progress, pending, approved, rejected)
- Price (number)
- Size (text)
- Views (number)
- Downloads (number)
- Tags (tags array)

### 4. **Products** (`itemType="product"`)
**Fields:**
- Title (text)
- Description (textarea)
- Price (number)
- Status (select: active, draft, archived)
- Category (text)
- Vendor (text)
- Inventory (number)
- Tags (tags array)

### 5. **Orders** (`itemType="order"`)
**Fields:**
- Order Number (text)
- Customer (text)
- Status (select: pending, processing, shipped, delivered, cancelled)
- Total (number)
- Items (number)
- Shipping Address (textarea)
- Payment Method (text)
- Created At (date)

## 🔧 API Integration Examples

### Edit Function
```tsx
const handleEdit = async (id: string, data: any) => {
  try {
    const response = await fetch(`/api/pins/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('Failed to update item')
    }
    
    const updatedItem = await response.json()
    // Update your local state here
    console.log('Item updated successfully:', updatedItem)
  } catch (error) {
    console.error('Error updating item:', error)
    throw error
  }
}
```

### Delete Function
```tsx
const handleDelete = async (id: string) => {
  try {
    const response = await fetch(`/api/pins/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete item')
    }
    
    // Remove from your local state here
    console.log('Item deleted successfully')
  } catch (error) {
    console.error('Error deleting item:', error)
    throw error
  }
}
```

### Save Function
```tsx
const handleSave = async (id: string, data: any) => {
  try {
    const response = await fetch(`/api/pins/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('Failed to save item')
    }
    
    const savedItem = await response.json()
    // Update your local state here
    console.log('Item saved successfully:', savedItem)
  } catch (error) {
    console.error('Error saving item:', error)
    throw error
  }
}
```

## 🎨 Design Features

### **Visual Design**
- **Clean layout**: Modern, professional appearance
- **Consistent styling**: Matches your design system
- **Dark mode support**: Works with dark/light themes
- **Responsive design**: Adapts to all screen sizes
- **Smooth animations**: Professional transitions

### **User Experience**
- **Intuitive interface**: Easy to understand and use
- **Keyboard navigation**: Escape key to close
- **Click outside to close**: User-friendly interaction
- **Loading states**: Visual feedback during operations
- **Error handling**: Clear error messages

### **Accessibility**
- **Screen reader support**: Proper ARIA labels
- **Keyboard navigation**: Full keyboard support
- **Focus management**: Proper focus handling
- **High contrast**: Accessible color schemes

## 🔄 State Management

The modal manages several internal states:

- `isEditing`: Toggle between view and edit modes
- `isDeleting`: Loading state for delete operations
- `isSaving`: Loading state for save operations
- `editedData`: Local copy of item data for editing
- `showDeleteConfirm`: Controls delete confirmation modal

## 📱 Responsive Behavior

- **Desktop**: Side-by-side layout with full functionality
- **Tablet**: Responsive grid that adapts to screen size
- **Mobile**: Stacked layout for better mobile experience
- **Touch-friendly**: Large touch targets for mobile devices

## 🎯 Best Practices

1. **Always provide API functions**: Even if they're just console.log for now
2. **Handle errors gracefully**: Show user-friendly error messages
3. **Update local state**: Keep your page data in sync with API responses
4. **Validate data**: Ensure data integrity before saving
5. **Provide feedback**: Show loading states and success messages

## 🚀 Getting Started

1. **Import the component**:
   ```tsx
   import { EnhancedDetailModal } from '@/components/shared'
   ```

2. **Set up state management**:
   ```tsx
   const [isModalOpen, setIsModalOpen] = useState(false)
   const [selectedItem, setSelectedItem] = useState(null)
   ```

3. **Implement API functions**:
   ```tsx
   const handleEdit = async (id, data) => { /* your logic */ }
   const handleDelete = async (id) => { /* your logic */ }
   const handleSave = async (id, data) => { /* your logic */ }
   ```

4. **Add the modal to your JSX**:
   ```tsx
   <EnhancedDetailModal
     isOpen={isModalOpen}
     onClose={() => setIsModalOpen(false)}
     item={selectedItem}
     itemType="pin"
     onEdit={handleEdit}
     onDelete={handleDelete}
     onSave={handleSave}
   />
   ```

That's it! Your enhanced modal is ready to use with full CRUD functionality, responsive design, and professional user experience.
