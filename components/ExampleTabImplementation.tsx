'use client'

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTabDataCache, CACHE_KEYS, DashboardData, DesignLibraryData, OrdersData, ProductsData } from '@/lib/hooks/useTabDataCache'
import { useTabLifecycle } from './KeepAliveTabContent'

// Example Dashboard Component
export function EnhancedDashboard() {
  const { data, isLoading, error, preloadData } = useTabDataCache<DashboardData>(CACHE_KEYS.DASHBOARD)
  const { isActive, isMounted, mountCount } = useTabLifecycle('/dashboard')

  useEffect(() => {
    if (isActive) {
      preloadData()
    }
  }, [isActive, preloadData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Error loading dashboard: {error.message}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
            Dashboard Overview
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400">
            Welcome back! Here's what's happening with your business.
          </p>
        </div>
        <div className="text-sm text-secondary-500">
          Mounted {mountCount} times • {isMounted ? 'Active' : 'Inactive'}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data?.metrics && Object.entries(data.metrics).map(([key, value]) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * Object.keys(data.metrics).indexOf(key) }}
            className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-soft border border-secondary-200 dark:border-secondary-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                  {typeof value === 'number' ? value.toLocaleString() : String(value)}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 text-xl">
                  {key === 'totalRevenue' ? '💰' : 
                   key === 'totalOrders' ? '📦' : 
                   key === 'totalProducts' ? '🏷️' : '👥'}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      {data?.recentActivity && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-soft border border-secondary-200 dark:border-secondary-700"
        >
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {data.recentActivity.map((activity: any, index: number) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center space-x-3 p-3 rounded-lg bg-secondary-50 dark:bg-secondary-700/50"
              >
                <div className="w-2 h-2 bg-primary-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm text-secondary-900 dark:text-secondary-100">
                    {activity.message}
                  </p>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">
                    {activity.time}
                  </p>
                </div>
                <div className="text-xs text-secondary-400">
                  {activity.type === 'order' ? '📦' : 
                   activity.type === 'product' ? '🏷️' : '👤'}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// Example Design Library Component
export function EnhancedDesignLibrary() {
  const { data, isLoading, error, preloadData } = useTabDataCache<DesignLibraryData>(CACHE_KEYS.DESIGN_LIBRARY)
  const { isActive, isMounted, mountCount } = useTabLifecycle('/design-library/designs')

  useEffect(() => {
    if (isActive) {
      preloadData()
    }
  }, [isActive, preloadData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Error loading designs: {error.message}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
            Design Library
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400">
            Manage and organize your design assets
          </p>
        </div>
        <div className="text-sm text-secondary-500">
          {data?.totalCount || 0} designs • Mounted {mountCount} times
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-soft border border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 dark:text-purple-400 text-2xl">🎨</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                {data?.totalCount || 0}
              </p>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">Total Designs</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-soft border border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 text-2xl">📁</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                {data?.categories?.length || 0}
              </p>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">Categories</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-soft border border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 text-2xl">✅</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                {data?.designs?.filter((d: any) => d.status === 'completed').length || 0}
              </p>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Designs Grid */}
      {data?.designs && (
        <div className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-soft border border-secondary-200 dark:border-secondary-700">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
            Recent Designs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.designs.slice(0, 6).map((design: any, index: number) => (
              <motion.div
                key={design.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className="p-4 rounded-lg border border-secondary-200 dark:border-secondary-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-700 rounded-lg flex items-center justify-center">
                    <span className="text-secondary-600 dark:text-secondary-400 text-xl">
                      {design.type === 'logo' ? '🔤' : 
                       design.type === 'banner' ? '🖼️' : '✏️'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-secondary-900 dark:text-secondary-100">
                      {design.name}
                    </p>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400 capitalize">
                      {design.type}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    design.status === 'completed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : design.status === 'in_progress'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                  }`}>
                    {design.status.replace('_', ' ')}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

// Example Orders Component
export function EnhancedOrders() {
  const { data, isLoading, error, preloadData } = useTabDataCache<OrdersData>(CACHE_KEYS.ORDERS)
  const { isActive, isMounted, mountCount } = useTabLifecycle('/apps/shopify/orders')

  useEffect(() => {
    if (isActive) {
      preloadData()
    }
  }, [isActive, preloadData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Error loading orders: {error.message}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
            Orders Management
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400">
            Track and manage your Shopify orders
          </p>
        </div>
        <div className="text-sm text-secondary-500">
          {data?.totalCount || 0} orders • Mounted {mountCount} times
        </div>
      </div>

      {/* Orders Table */}
      {data?.orders && (
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-soft border border-secondary-200 dark:border-secondary-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-secondary-200 dark:border-secondary-700">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              Recent Orders
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50 dark:bg-secondary-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
                {data.orders.slice(0, 10).map((order: any, index: number) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="hover:bg-secondary-50 dark:hover:bg-secondary-700/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900 dark:text-secondary-100">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-secondary-100">
                      {order.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        order.status === 'delivered' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : order.status === 'shipped'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                          : order.status === 'processing'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-secondary-100">
                      ${order.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  )
}

// Example Products Component
export function EnhancedProducts() {
  const { data, isLoading, error, preloadData } = useTabDataCache<ProductsData>(CACHE_KEYS.PRODUCTS)
  const { isActive, isMounted, mountCount } = useTabLifecycle('/apps/shopify/products')

  useEffect(() => {
    if (isActive) {
      preloadData()
    }
  }, [isActive, preloadData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Error loading products: {error.message}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
            Product Catalog
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400">
            Manage your Shopify product inventory
          </p>
        </div>
        <div className="text-sm text-secondary-500">
          {data?.totalCount || 0} products • Mounted {mountCount} times
        </div>
      </div>

      {/* Products Grid */}
      {data?.products && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.products.slice(0, 12).map((product: any, index: number) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * index }}
              className="bg-white dark:bg-secondary-800 rounded-xl shadow-soft border border-secondary-200 dark:border-secondary-700 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-700 rounded-lg flex items-center justify-center">
                    <span className="text-secondary-600 dark:text-secondary-400 text-xl">🏷️</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : product.status === 'draft'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                  }`}>
                    {product.status}
                  </span>
                </div>
                
                <h3 className="font-medium text-secondary-900 dark:text-secondary-100 mb-2 line-clamp-2">
                  {product.title}
                </h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary-600 dark:text-secondary-400">Price:</span>
                    <span className="font-medium text-secondary-900 dark:text-secondary-100">
                      ${product.price}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600 dark:text-secondary-400">Stock:</span>
                    <span className="font-medium text-secondary-900 dark:text-secondary-100">
                      {product.inventoryQuantity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600 dark:text-secondary-400">Type:</span>
                    <span className="font-medium text-secondary-900 dark:text-secondary-100">
                      {product.productType}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

