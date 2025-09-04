# 🚀 Enhanced Tab System with Instant Switching

A comprehensive tab management system for React admin panels featuring instant navigation, data caching, keep-alive components, and smooth animations.

## ✨ Features

- **⚡ Instant Tab Switching** - No loading delays or skeleton screens
- **🧠 Keep-Alive Components** - Tabs stay mounted in memory for instant access
- **💾 Smart Data Caching** - React Query powered caching with background preloading
- **🎨 Smooth Animations** - Framer Motion powered transitions between tabs
- **🔍 Tab Search & Management** - Advanced tab operations with keyboard shortcuts
- **📱 Responsive Design** - Mobile-friendly tab navigation
- **🎯 Performance Monitoring** - Built-in performance tracking and optimization

## 🏗️ Architecture

```
EnhancedLayout (Root)
├── QueryClientProvider (React Query)
├── KeepAliveProvider (Tab Lifecycle)
├── EnhancedTabs (Navigation)
├── KeepAliveTabContent (Content Wrapper)
└── Tab Content Components
```

## 📦 Installation

### 1. Install Dependencies

```bash
npm install @tanstack/react-query framer-motion lucide-react
```

### 2. Import Components

```tsx
import { EnhancedLayout } from '@/components/EnhancedLayout'
import { EnhancedTabs } from '@/components/EnhancedTabs'
import { KeepAliveProvider, KeepAliveTabContent } from '@/components/KeepAliveTabContent'
```

## 🚀 Quick Start

### 1. Wrap Your App with EnhancedLayout

```tsx
// app/layout.tsx
import { EnhancedLayout } from '@/components/EnhancedLayout'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <EnhancedLayout>
          {children}
        </EnhancedLayout>
      </body>
    </html>
  )
}
```

### 2. Create Tab Content Components

```tsx
// components/Dashboard.tsx
import { useTabDataCache, CACHE_KEYS } from '@/lib/hooks/useTabDataCache'
import { useTabLifecycle } from '@/components/KeepAliveTabContent'

export function Dashboard() {
  const { data, isLoading, error } = useTabDataCache(CACHE_KEYS.DASHBOARD)
  const { isActive, isMounted, mountCount } = useTabLifecycle('/dashboard')

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Mounted {mountCount} times • {isMounted ? 'Active' : 'Inactive'}</p>
      {/* Your dashboard content */}
    </div>
  )
}
```

### 3. Use in Your Pages

```tsx
// app/dashboard/page.tsx
import { Dashboard } from '@/components/Dashboard'

export default function DashboardPage() {
  return <Dashboard />
}
```

## 🎯 Advanced Usage

### Custom Data Fetching

```tsx
import { useTabDataCache } from '@/lib/hooks/useTabDataCache'

export function CustomComponent() {
  const { 
    data, 
    isLoading, 
    error, 
    preloadData, 
    invalidateCache, 
    refreshData 
  } = useTabDataCache('custom-cache-key', {
    // Custom React Query options
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000,    // 20 minutes
  })

  const handleRefresh = () => {
    refreshData()
  }

  const handleInvalidate = () => {
    invalidateCache()
  }

  return (
    <div>
      <button onClick={handleRefresh}>Refresh</button>
      <button onClick={handleInvalidate}>Clear Cache</button>
      {/* Your component content */}
    </div>
  )
}
```

### Tab Lifecycle Management

```tsx
import { useTabLifecycle } from '@/components/KeepAliveTabContent'

export function LifecycleAwareComponent() {
  const { 
    isActive, 
    isMounted, 
    lastActive, 
    mountCount,
    activate,
    deactivate 
  } = useTabLifecycle('/your-path')

  useEffect(() => {
    if (isActive) {
      console.log('Tab activated!')
      // Perform activation tasks
    } else {
      console.log('Tab deactivated!')
      // Perform cleanup tasks
    }
  }, [isActive])

  return (
    <div>
      <p>Active: {isActive ? 'Yes' : 'No'}</p>
      <p>Mounted: {isMounted ? 'Yes' : 'No'}</p>
      <p>Mount Count: {mountCount}</p>
      <p>Last Active: {new Date(lastActive).toLocaleString()}</p>
    </div>
  )
}
```

### Performance Monitoring

```tsx
import { useTabPerformance } from '@/components/KeepAliveTabContent'

export function PerformanceMonitoredComponent() {
  const { mountTime, renderTime, memoryUsage } = useTabPerformance('/your-path')

  return (
    <div>
      <p>Mount Time: {mountTime}ms</p>
      <p>Render Time: {renderTime}ms</p>
      <p>Memory Usage: {Math.round(memoryUsage / 1024 / 1024)}MB</p>
    </div>
  )
}
```

## 🔧 Configuration

### Tab Configuration

```tsx
// components/EnhancedTabs.tsx
const TAB_CONFIG = {
  '/dashboard': {
    title: 'Dashboard',
    icon: BarChart3,
    color: 'blue',
    description: 'Overview and analytics'
  },
  '/design-library': {
    title: 'Design Library',
    icon: Palette,
    color: 'purple',
    description: 'Manage design assets'
  },
  // Add more tabs...
}
```

### Keep-Alive Settings

```tsx
// components/EnhancedLayout.tsx
<KeepAliveProvider maxTabs={15}> {/* Maximum tabs to keep in memory */}
  {/* Your content */}
</KeepAliveProvider>
```

### React Query Configuration

```tsx
// components/EnhancedLayout.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 minutes
      gcTime: 10 * 60 * 1000,      // 10 minutes
      refetchOnWindowFocus: false,  // Disable refetch on focus
      retry: 1,                     // Retry failed requests once
    },
  },
})
```

## 🎨 Customization

### Custom Tab Styles

```tsx
// Override tab styles in EnhancedTabs.tsx
<motion.div
  className={cn(
    'custom-tab-classes',
    tab.isActive ? 'active-tab-classes' : 'inactive-tab-classes'
  )}
>
  {/* Tab content */}
</motion.div>
```

### Custom Animations

```tsx
// Custom animation variants
const customVariants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 50 }
}

<motion.div
  variants={customVariants}
  transition={{ duration: 0.5, ease: "easeInOut" }}
>
  {/* Content */}
</motion.div>
```

## 📊 Performance Tips

### 1. Optimize Data Fetching

```tsx
// Use selective preloading
useEffect(() => {
  if (isActive && !data) {
    preloadData() // Only preload when needed
  }
}, [isActive, data, preloadData])
```

### 2. Implement Virtual Scrolling

```tsx
// For large data sets
import { FixedSizeList as List } from 'react-window'

export function VirtualizedList({ items }) {
  return (
    <List
      height={400}
      itemCount={items.length}
      itemSize={50}
      itemData={items}
    >
      {({ index, style, data }) => (
        <div style={style}>
          {data[index].name}
        </div>
      )}
    </List>
  )
}
```

### 3. Use React.memo for Expensive Components

```tsx
export const ExpensiveComponent = React.memo(({ data }) => {
  // Expensive rendering logic
  return <div>{/* Component content */}</div>
})
```

## 🐛 Troubleshooting

### Common Issues

1. **Tabs not switching instantly**
   - Ensure `KeepAliveProvider` wraps your content
   - Check that `useTabLifecycle` is used correctly
   - Verify data caching is working

2. **Memory leaks**
   - Monitor tab count with `maxTabs` prop
   - Use `useTabPerformance` to track memory usage
   - Implement proper cleanup in `onDeactivate`

3. **Animation glitches**
   - Check Framer Motion version compatibility
   - Ensure proper `key` props on animated elements
   - Use `AnimatePresence` for exit animations

### Debug Mode

```tsx
// Enable debug logging
import { TabPerformanceMonitor } from '@/components/EnhancedLayout'

export function App() {
  return (
    <EnhancedLayout>
      {/* Your content */}
      <TabPerformanceMonitor /> {/* Shows in development only */}
    </EnhancedLayout>
  )
}
```

## 🔄 Migration from Existing Tabs

### 1. Replace TabBar Component

```tsx
// Before
import { TabBar } from '@/components/tabbar'

// After
import { EnhancedTabs } from '@/components/EnhancedTabs'
```

### 2. Update Layout Structure

```tsx
// Before
<div>
  <TabBar />
  <main>{children}</main>
</div>

// After
<EnhancedLayout>
  {children}
</EnhancedLayout>
```

### 3. Add Data Caching

```tsx
// Before
const [data, setData] = useState([])
useEffect(() => {
  fetchData().then(setData)
}, [])

// After
const { data, isLoading, error } = useTabDataCache('your-cache-key')
```

## 📚 API Reference

### Hooks

- `useTabDataCache(cacheKey, options)` - Data caching and fetching
- `useTabLifecycle(path)` - Tab lifecycle management
- `useTabPerformance(path)` - Performance monitoring
- `usePreloadAllTabData()` - Bulk data preloading

### Components

- `EnhancedLayout` - Root layout wrapper
- `EnhancedTabs` - Tab navigation component
- `KeepAliveProvider` - Tab lifecycle provider
- `KeepAliveTabContent` - Content wrapper with keep-alive

### Utilities

- `CACHE_KEYS` - Predefined cache key constants
- `useTabDataOperations` - CRUD operations on cached data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API reference

---

**Built with ❤️ for smooth admin experiences**
