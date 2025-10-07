'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { 
  Plus, 
  X, 
  Search, 
  Filter, 
  Download, 
  Settings, 
  Users, 
  TrendingUp, 
  BarChart3, 
  Eye, 
  Edit, 
  Trash, 
  MoreVertical,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Target,
  Heart,
  Share2,
  MessageCircle,
  Bookmark,
  Pin,
  Hash,
  Tag,
  Globe,
  Calendar,
  Activity,
  BookOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PinterestAccount {
  id: string
  email: string
  accountName: string
  tag?: string
  active?: boolean
  followers?: number
  following?: number
  pins?: number
  boards?: number
  engagement?: number
  reach?: number
  impressions?: number
  clicks?: number
  lastActive?: string
  createdAt: string
  updatedAt: string
  avatar?: string
  bio?: string
  website?: string
  location?: string
  verified?: boolean
  businessAccount?: boolean
  category?: string
  status: 'active' | 'inactive' | 'pending' | 'suspended'
}

interface PinterestDashboardProps {
  initialData?: {
    accounts: PinterestAccount[]
    stats: any
  }
}

// Generate sample Pinterest accounts data
const generatePinterestAccounts = (count: number): PinterestAccount[] => {
  const categories = ['Fashion', 'Food', 'Travel', 'Home & Garden', 'Beauty', 'Fitness', 'Technology', 'Art', 'Business', 'Education']
  const statuses: PinterestAccount['status'][] = ['active', 'inactive', 'pending', 'suspended']
  
  return Array.from({ length: count }, (_, i) => {
    const seed = i + 1
    const followers = Math.floor(Math.random() * 50000) + 100
    const following = Math.floor(Math.random() * 1000) + 50
    const pins = Math.floor(Math.random() * 500) + 10
    const boards = Math.floor(Math.random() * 20) + 2
    const engagement = (Math.random() * 5 + 1).toFixed(2)
    const reach = Math.floor(Math.random() * 100000) + 1000
    const impressions = Math.floor(Math.random() * 500000) + 5000
    const clicks = Math.floor(Math.random() * 5000) + 50
    
    return {
      id: `account-${i + 1}`,
      email: `pinterest${i + 1}@example.com`,
      accountName: `Pinterest Account ${i + 1}`,
      tag: Math.random() > 0.5 ? `tag${i + 1}` : undefined,
      active: Math.random() > 0.2,
      followers,
      following,
      pins,
      boards,
      engagement: parseFloat(engagement),
      reach,
      impressions,
      clicks,
      lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - (seed * 24 * 60 * 60 * 1000)).toISOString(),
      updatedAt: new Date(Date.now() - (seed * 7 * 24 * 60 * 60 * 1000)).toISOString(),
      avatar: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 99)}.jpg`,
      bio: `Creative content creator sharing amazing ideas and inspiration.`,
      website: Math.random() > 0.5 ? `https://example${i + 1}.com` : undefined,
      location: Math.random() > 0.5 ? ['New York', 'Los Angeles', 'London', 'Paris', 'Tokyo'][Math.floor(Math.random() * 5)] : undefined,
      verified: Math.random() > 0.7,
      businessAccount: Math.random() > 0.6,
      category: categories[Math.floor(Math.random() * categories.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)]
    }
  })
}

const accounts = generatePinterestAccounts(12) // Generate 12 sample accounts

export default function PinterestDashboardPage() {
  const { addTab, tabs } = useAppStore()
  const hasAddedTab = useRef(false)
  const [accountData, setAccountData] = useState<PinterestAccount[]>(accounts)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<PinterestAccount | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'grid'>('cards')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Form state
  const [email, setEmail] = useState('')
  const [accountName, setAccountName] = useState('')
  const [tag, setTag] = useState('')
  const [category, setCategory] = useState('')
  const [website, setWebsite] = useState('')
  const [location, setLocation] = useState('')
  const [bio, setBio] = useState('')

  // Tab management
  useEffect(() => {
    // Only add the tab once
    if (!hasAddedTab.current) {
      addTab({
        title: 'Pinterest Dashboard',
        path: '/apps/pinterest/dashboard',
        pinned: false,
        closable: true,
      })
      hasAddedTab.current = true
    }
  }, []) // Remove addTab from dependencies

  // Fetch accounts from API
  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/pinterest/accounts')
      const data = await res.json()
      setAccountData(data.accounts || accounts)
    } catch (err) {
      setError('Failed to fetch accounts')
      setAccountData(accounts) // Fallback to sample data
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  // Filtered and sorted accounts
  const filteredAccounts = accountData.filter(account => {
    const matchesSearch = searchQuery === '' || 
      account.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.tag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.category?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = filterStatus === 'all' || account.status === filterStatus
    const matchesCategory = filterCategory === 'all' || account.category === filterCategory

    return matchesSearch && matchesStatus && matchesCategory
  })

  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    let aValue: any, bValue: any

    switch (sortBy) {
      case 'name':
        aValue = a.accountName.toLowerCase()
        bValue = b.accountName.toLowerCase()
        break
      case 'followers':
        aValue = a.followers || 0
        bValue = b.followers || 0
        break
      case 'engagement':
        aValue = a.engagement || 0
        bValue = b.engagement || 0
        break
      case 'pins':
        aValue = a.pins || 0
        bValue = b.pins || 0
        break
      case 'created':
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        break
      default:
        aValue = a.accountName.toLowerCase()
        bValue = b.accountName.toLowerCase()
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !accountName.trim()) return

    const newAccount: Partial<PinterestAccount> = {
      email,
      accountName,
      tag: tag || undefined,
      category: category || undefined,
      website: website || undefined,
      location: location || undefined,
      bio: bio || undefined,
      active: true,
      status: 'active',
      followers: 0,
      following: 0,
      pins: 0,
      boards: 0,
      engagement: 0,
      reach: 0,
      impressions: 0,
      clicks: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      avatar: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 99)}.jpg`,
      verified: false,
      businessAccount: false
    }

    try {
      const res = await fetch('/api/pinterest/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccount),
      })
      
      if (!res.ok) {
        throw new Error('Failed to create account')
      }

      // Reset form
      setEmail('')
      setAccountName('')
      setTag('')
      setCategory('')
      setWebsite('')
      setLocation('')
      setBio('')
      setModalOpen(false)
      
      // Refresh accounts
      fetchAccounts()
    } catch (err) {
      alert('Failed to create account. Please try again.')
    }
  }

  // Handle account operations
  const handleDelete = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return

    try {
      await fetch('/api/pinterest/accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: accountId }),
      })
      fetchAccounts()
    } catch (err) {
      alert('Failed to delete account')
    }
  }

  const handleToggleActive = async (accountId: string, currentActive: boolean) => {
    try {
      await fetch('/api/pinterest/accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: accountId, active: !currentActive }),
      })
      fetchAccounts()
    } catch (err) {
      alert('Failed to update account status')
    }
  }

  // Calculate dashboard stats
  const stats = {
    totalAccounts: accountData.length,
    activeAccounts: accountData.filter(acc => acc.active).length,
    totalFollowers: accountData.reduce((sum, acc) => sum + (acc.followers || 0), 0),
    totalEngagement: accountData.reduce((sum, acc) => sum + (acc.engagement || 0), 0),
    totalPins: accountData.reduce((sum, acc) => sum + (acc.pins || 0), 0),
    totalReach: accountData.reduce((sum, acc) => sum + (acc.reach || 0), 0),
    totalImpressions: accountData.reduce((sum, acc) => sum + (acc.impressions || 0), 0),
    totalClicks: accountData.reduce((sum, acc) => sum + (acc.clicks || 0), 0)
  }

  if (loading && accountData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading Pinterest accounts...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Accounts</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button 
            onClick={() => setError(null)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 w-full min-h-screen bg-gray-50 animate-fade-in">
      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold gradient-text">Pinterest Dashboard</h1>
        </div>
        <p className="text-gray-600">Monitor and analyze your Pinterest performance and engagement</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Total Pins', value: stats.totalPins, icon: Pin, color: 'text-red-600', bgColor: 'bg-red-50', change: '+12%' },
          { title: 'Total Boards', value: stats.totalPins, icon: BookOpen, color: 'text-blue-600', bgColor: 'bg-blue-50', change: '+8%' },
          { title: 'Total Followers', value: stats.totalFollowers, icon: Users, color: 'text-green-600', bgColor: 'bg-green-50', change: '+15%' },
          { title: 'Total Likes', value: stats.totalPins, icon: Heart, color: 'text-pink-600', bgColor: 'bg-pink-50', change: '+23%' }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className={`card p-6 hover-lift animate-fade-in`} style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                  <p className="text-sm text-green-600 font-medium">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Engagement Chart */}
        <div className="card p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold gradient-text">Engagement Over Time</h3>
            <select className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Engagement chart will be displayed here</p>
            </div>
          </div>
        </div>

        {/* Top Performing Pins */}
        <div className="card p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold gradient-text">Top Performing Pins</h3>
            <button className="text-sm text-red-600 hover:text-red-700 hover-lift transition-all">View All</button>
          </div>
          <div className="space-y-4">
            {accountData.map((account, index) => (
              <div key={account.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 hover-lift transition-all">
                <img src={account.avatar} alt={account.accountName} className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 line-clamp-1">{account.accountName}</p>
                  <p className="text-sm text-gray-500">{account.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{account.followers?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">followers</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-6 mb-8 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold gradient-text">Recent Activity</h3>
          <button className="text-sm text-red-600 hover:text-red-700 hover-lift transition-all">View All</button>
        </div>
        <div className="space-y-4">
          {accountData.map((account, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 hover-lift transition-all">
              <div className={`p-2 rounded-full ${account.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {account.active ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{account.accountName}</p>
                <p className="text-xs text-gray-500">{account.email}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${account.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {account.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {accountData.map((account, index) => {
          const Icon = account.active ? CheckCircle : X;
          return (
            <div key={account.id} className={`card p-6 text-center hover-lift animate-fade-in cursor-pointer`} style={{ animationDelay: `${index * 0.1}s` }}>
              <div className={`p-3 rounded-full ${account.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} mx-auto mb-4`}>
                <Icon className={`h-6 w-6 ${account.active ? 'text-green-800' : 'text-red-800'}`} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{account.accountName}</h3>
              <p className="text-sm text-gray-600">{account.email}</p>
            </div>
          );
        })}
      </div>

      {/* Create Account Modal */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create Pinterest Account</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter account name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tag (Optional)</label>
                <input
                  type="text"
                  value={tag}
                  onChange={e => setTag(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter tag"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select category</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Food">Food</option>
                  <option value="Travel">Travel</option>
                  <option value="Home & Garden">Home & Garden</option>
                  <option value="Beauty">Beauty</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Technology">Technology</option>
                  <option value="Art">Art</option>
                  <option value="Business">Business</option>
                  <option value="Education">Education</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website (Optional)</label>
                <input
                  type="url"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location (Optional)</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio (Optional)</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter bio"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
