'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Grid, 
  Plus, 
  ChevronRight, 
  ChevronDown,
  Package,
  ShoppingCart,
  ImageIcon,
  BookOpen,
  Settings,
  Users,
  UserPlus,
  Shield,
  Activity,
  Database,
  Palette
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Logo } from './Logo'

interface SidebarItem {
  title: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  children?: SidebarItem[]
  isApp?: boolean
  iconColor?: string
}

// Custom app icons with official brand colors
const ShopifyIcon = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center justify-center transition-all duration-300 group-hover:scale-110", className)}>
    <svg className="h-4 w-4 transition-all duration-300 group-hover:rotate-12" viewBox="0 0 24 24">
      {/* Green background circle */}
      <circle cx="12" cy="12" r="10" fill="#95BF47"/>
      {/* White shopping bag with handles */}
      <path d="M8 6h8v2H8V6zm0 2h8v10H8V8z" fill="white"/>
      <path d="M7 6h2v2H7V6zm8 0h2v2h-2V6z" fill="white"/>
      {/* Green S inside */}
      <path d="M10 10h4v1h-4v-1zm0 2h4v1h-4v-1zm0 2h4v1h-4v-1z" fill="#95BF47"/>
    </svg>
  </div>
)

const PinterestIcon = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center justify-center transition-all duration-300 group-hover:scale-110", className)}>
    <svg className="h-4 w-4 transition-all duration-300 group-hover:rotate-12" viewBox="0 0 24 24">
      {/* Red circle background */}
      <circle cx="12" cy="12" r="10" fill="#E60023"/>
      {/* White P letter */}
      <path d="M10 8h4v8h-4V8zm0 2h2v4h-2v-4z" fill="white"/>
    </svg>
  </div>
)

const sidebarItems: SidebarItem[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    iconColor: 'text-blue-600',
  },
  {
    title: 'Apps',
    path: '/apps',
    icon: Grid,
    iconColor: 'text-purple-600',
    children: [
      {
        title: 'Shopify',
        path: '/apps/shopify',
        icon: ShopifyIcon,
        isApp: true,
        iconColor: 'text-green-600',
        children: [
          { title: 'Orders', path: '/apps/shopify/orders', icon: ShoppingCart, iconColor: 'text-orange-600' },
          { title: 'Products', path: '/apps/shopify/products', icon: Package, iconColor: 'text-indigo-600' },
        ],
      },
      {
        title: 'Pinterest',
        path: '/apps/pinterest',
        icon: PinterestIcon,
        isApp: true,
        iconColor: 'text-red-600',
        children: [
          { title: 'Dashboard', path: '/apps/pinterest/dashboard', icon: LayoutDashboard, iconColor: 'text-blue-500' },
          { title: 'Pins', path: '/apps/pinterest/pins', icon: ImageIcon, iconColor: 'text-pink-600' },
          { title: 'Boards', path: '/apps/pinterest/boards', icon: BookOpen, iconColor: 'text-teal-600' },
        ],
      },
    ],
  },
  {
    title: 'Design Library',
    path: '/design-library',
    icon: Palette,
    iconColor: 'text-pink-600',
    children: [
      { title: 'Designs', path: '/design-library/designs', icon: ImageIcon, iconColor: 'text-cyan-600' },
    ],
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: Settings,
    iconColor: 'text-gray-600',
    children: [
      { title: 'General', path: '/settings/general', icon: Settings, iconColor: 'text-gray-500' },
      { title: 'Health Check', path: '/settings/health', icon: Activity, iconColor: 'text-green-500' },
      { title: 'Caching', path: '/settings/caching', icon: Database, iconColor: 'text-blue-500' },
      { title: 'Indexing', path: '/settings/indexing', icon: Database, iconColor: 'text-purple-500' },
    ],
  },
  {
    title: 'User Management',
    path: '/user-management',
    icon: Users,
    iconColor: 'text-indigo-600',
    children: [
      { title: 'Register User', path: '/user-management/register-user', icon: UserPlus, iconColor: 'text-green-500' },
      { title: 'Registered Users', path: '/user-management/registered-users', icon: Users, iconColor: 'text-blue-500' },
      { title: 'Access Control', path: '/user-management/access-control', icon: Shield, iconColor: 'text-red-500' },
    ],
  },
]

interface SidebarItemProps {
  item: SidebarItem
  level: number
  isCollapsed: boolean
}

function SidebarItemComponent({ item, level, isCollapsed }: SidebarItemProps) {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(() => {
    // Auto-expand if current path matches this item or its children
    if (item.children) {
      return item.children.some(child => 
        pathname === child.path || pathname.startsWith(child.path + '/') ||
        (child.children && child.children.some(grandChild => 
          pathname === grandChild.path || pathname.startsWith(grandChild.path + '/')
        ))
      )
    }
    return false
  })
  
  const hasChildren = item.children && item.children.length > 0
  const isActive = pathname === item.path || pathname.startsWith(item.path + '/')
  const isChildActive = hasChildren && item.children?.some(child => 
    pathname === child.path || pathname.startsWith(child.path + '/') ||
    (child.children && child.children.some(grandChild => 
      pathname === grandChild.path || pathname.startsWith(grandChild.path + '/')
    ))
  )

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded)
    }
  }

  if (isCollapsed && level > 0) return null

  return (
    <div className="animate-fade-in">
      <Link
        href={hasChildren ? '#' : item.path}
        onClick={handleClick}
        className={cn(
          'sidebar-item group hover-lift transition-all duration-300 ease-out',
          'hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-white/5',
          'transform hover:-translate-y-0.5',
          (isActive || isChildActive) && 'active shadow-soft',
          level > 0 && 'ml-4',
          level > 1 && 'ml-8',
          isCollapsed && 'justify-center'
        )}
      >
        <div className={cn(
          "flex items-center justify-center transition-all duration-300",
          "group-hover:scale-110 group-hover:rotate-3",
          item.iconColor || "text-secondary-600",
          (isActive || isChildActive) && "text-white scale-110"
        )}>
          <item.icon className="h-4 w-4 transition-all duration-300" />
        </div>
        {!isCollapsed && (
          <>
            <span className="ml-3 flex-1 transition-all duration-300 group-hover:translate-x-1">{item.title}</span>
            {hasChildren && (
              <div className="transition-all duration-300 group-hover:scale-110">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 transition-transform duration-300" />
                ) : (
                  <ChevronRight className="h-4 w-4 transition-transform duration-300" />
                )}
              </div>
            )}
            {item.title === 'Apps' && (
              <button className="ml-auto rounded-full bg-primary-100 p-1 text-primary-600 hover:bg-primary-200 hover-lift dark:bg-primary-900 dark:text-primary-300 transition-all duration-300 hover:scale-110 hover:rotate-12">
                <Plus className="h-3 w-3" />
              </button>
            )}
          </>
        )}
      </Link>

      {hasChildren && isExpanded && !isCollapsed && (
        <div className="mt-1 space-y-1 animate-slide-up">
          {item.children?.map((child) => (
            <SidebarItemComponent
              key={child.path}
              item={child}
              level={level + 1}
              isCollapsed={isCollapsed}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore()

  return (
    <div className={cn(
      "flex h-full w-64 flex-col border-r border-secondary-200 bg-white/80 backdrop-blur-sm dark:border-secondary-700 dark:bg-secondary-800/80 transition-all duration-300",
      sidebarCollapsed && "w-16"
    )}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-secondary-200 px-4 dark:border-secondary-700">
        {!sidebarCollapsed ? (
          <Logo size="md" />
        ) : (
          <div className="flex h-8 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 text-white font-bold shadow-lg transition-all duration-300 hover:scale-110 hover:rotate-3 border border-white/100">
            <span className="text-sm font-bold tracking-tight text-white drop-shadow-sm">I</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1 text-secondary-800 hover:bg-secondary-100 hover-lift dark:text-secondary-400 dark:hover:bg-secondary-700 transition-all duration-300 hover:scale-110 hover:rotate-180 ml-4"
        >
          <ChevronRight className={cn(
            "h-5 w-5 transition-transform duration-300",
            sidebarCollapsed && "rotate-180"
          )} />
        </button>
      </div>

      {/* Navigation (scrollable when content exceeds viewport) */}
      <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden space-y-1 p-4">
        {sidebarItems.map((item) => (
          <SidebarItemComponent
            key={item.path}
            item={item}
            level={0}
            isCollapsed={sidebarCollapsed}
          />
        ))}
      </nav>
    </div>
  )
} 