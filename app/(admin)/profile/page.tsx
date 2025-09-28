'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Building, 
  Edit3, 
  Save, 
  X,
  Camera,
  Shield,
  Key,
  Bell,
  CheckCircle,
  AlertCircle,
  Upload,
  Settings,
  Activity,
  Award,
  Clock,
  Globe
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://brmh.in'

interface UserProfile {
  id: string
  username: string
  email: string
  phoneNumber?: string
  firstName?: string
  lastName?: string
  avatar?: string
  company?: string
  location?: string
  bio?: string
  joinedAt?: string
  lastLogin?: string
  role?: string
  emailVerified?: boolean
  phoneVerified?: boolean
}

export default function ProfilePage() {
  const router = useRouter()
  const { currentUser, setCurrentUser, addTab } = useAppStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({})
  const [activeSection, setActiveSection] = useState('profile')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hasAddedTab = useRef(false)

  // Tab management
  useEffect(() => {
    if (!hasAddedTab.current) {
      addTab({
        title: 'Profile',
        path: '/profile',
        pinned: false,
        closable: true,
      })
      hasAddedTab.current = true
    }
  }, [addTab])

  // Use current user from store and sync with profile data
  useEffect(() => {
    if (currentUser) {
      // Convert currentUser to profile format
      const profileData: UserProfile = {
        id: currentUser.id,
        username: currentUser.name,
        email: currentUser.email,
        phoneNumber: '', // Will be populated from backend if available
        firstName: currentUser.name.split(' ')[0] || '',
        lastName: currentUser.name.split(' ').slice(1).join(' ') || '',
        avatar: currentUser.avatar,
        company: '', // Will be populated from backend if available
        location: '', // Will be populated from backend if available
        bio: '', // Will be populated from backend if available
        joinedAt: currentUser.createdAt,
        lastLogin: currentUser.lastLogin,
        role: currentUser.role === 'admin' ? 'Administrator' : currentUser.role,
        emailVerified: true, // Assume verified if user is logged in
        phoneVerified: false
      }
      
      setProfile(profileData)
      setLoading(false)
      
      // Try to fetch additional profile data from backend
      const fetchAdditionalProfileData = async () => {
        try {
          const token = localStorage.getItem('access_token')
          if (!token) return

          const response = await fetch(`${BACKEND}/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          if (response.ok) {
            const data = await response.json()
            // Update profile with additional data from backend
            const updatedProfile: UserProfile = {
              ...profileData,
              phoneNumber: data.phone_number || profileData.phoneNumber,
              firstName: data.given_name || data.first_name || profileData.firstName,
              lastName: data.family_name || data.last_name || profileData.lastName,
              company: data.company || profileData.company,
              location: data.location || profileData.location,
              bio: data.bio || profileData.bio,
              emailVerified: data.email_verified !== undefined ? data.email_verified : profileData.emailVerified,
              phoneVerified: data.phone_number_verified !== undefined ? data.phone_number_verified : profileData.phoneVerified
            }
            
            setProfile(updatedProfile)
          }
        } catch (error) {
          console.warn('Failed to fetch additional profile data:', error)
          // Keep the basic profile data from currentUser
        }
      }
      
      fetchAdditionalProfileData()
    } else {
      // No current user, redirect to auth
      router.push('/auth')
    }
  }, [currentUser, router])

  // Handle avatar upload
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle avatar click
  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditForm({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      email: profile?.email || '',
      phoneNumber: profile?.phoneNumber || '',
      company: profile?.company || '',
      location: profile?.location || '',
      bio: profile?.bio || ''
    })
    setMessage('')
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditForm({})
    setMessage('')
    setAvatarPreview(null)
  }

  const handleSave = async () => {
    if (!profile) return

    setSaving(true)
    setMessage('')

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/auth')
        return
      }

      const response = await fetch(`${BACKEND}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        const updatedData = await response.json()
        const updatedProfile = { ...profile, ...editForm }
        setProfile(updatedProfile)
        setIsEditing(false)
        setMessage('Profile updated successfully!')
        
        // Update app store with new profile data
        setCurrentUser({
          ...currentUser!,
          name: `${editForm.firstName || ''} ${editForm.lastName || ''}`.trim() || profile.username,
          email: editForm.email || profile.email,
          avatar: avatarPreview || currentUser!.avatar // Update avatar if changed
        })
        
        // Clear avatar preview after successful save
        setAvatarPreview(null)
        
        setTimeout(() => setMessage(''), 3000)
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-600 font-medium">Loading your profile...</div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <div className="text-red-600 font-semibold text-lg">Failed to load profile</div>
          <p className="text-gray-500 mt-2">Please try refreshing the page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Floating particles background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Enhanced Header */}
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8 overflow-hidden">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-indigo-600/5"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative group">
                <div className="w-28 h-28 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-3xl">
                  {avatarPreview || profile.avatar ? (
                    <img
                      src={avatarPreview || profile.avatar}
                      alt="Profile"
                      className="w-28 h-28 rounded-2xl object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-white">
                      {(profile.firstName?.[0] || profile.username?.[0] || 'U').toUpperCase()}
                    </span>
                  )}
                </div>
                <button 
                  onClick={handleAvatarClick}
                  className="absolute -bottom-2 -right-2 p-2 bg-white text-blue-600 rounded-xl shadow-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-110 border border-blue-100"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                {/* Online status indicator */}
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-lg">
                  <div className="w-full h-full bg-green-400 rounded-full animate-ping opacity-75"></div>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                    {profile.firstName && profile.lastName 
                      ? `${profile.firstName} ${profile.lastName}` 
                      : profile.username}
                  </h1>
                  <Activity className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-gray-600 font-medium mb-3">@{profile.username}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg">
                    <Shield className="w-4 h-4 mr-2" />
                    {profile.role}
                  </span>
                  {profile.emailVerified && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Email Verified
                    </span>
                  )}
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                    <Award className="w-4 h-4 mr-2" />
                    Premium User
                  </span>
                </div>
                {profile.bio && (
                  <p className="text-gray-700 mt-3 leading-relaxed">{profile.bio}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              {!isEditing ? (
                <>
                  <button
                    onClick={handleEdit}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 font-semibold"
                  >
                    <Edit3 className="w-5 h-5 mr-2" />
                    Edit Profile
                  </button>
                  <button className="inline-flex items-center px-6 py-3 bg-white text-gray-700 rounded-xl shadow-md hover:shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-300 font-medium">
                    <Settings className="w-5 h-5 mr-2" />
                    Settings
                  </button>
                </>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-xl shadow-md text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300 font-medium"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl shadow-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 font-semibold"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {message && (
            <div className={`mt-6 p-4 rounded-xl border-l-4 ${
              message.includes('success') 
                ? 'bg-green-50 text-green-800 border-green-400 shadow-lg' 
                : 'bg-red-50 text-red-800 border-red-400 shadow-lg'
            } transition-all duration-300 animate-in slide-in-from-top-2`}>
              <div className="flex items-center">
                {message.includes('success') ? (
                  <CheckCircle className="w-5 h-5 mr-3 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-3 text-red-600" />
                )}
                <span className="font-medium">{message}</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white/60 backdrop-blur-sm p-1 rounded-xl shadow-lg border border-white/20">
            {[
              { id: 'profile', label: 'Profile Information', icon: User },
              { id: 'security', label: 'Security', icon: Shield },
              { id: 'activity', label: 'Activity', icon: Activity },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeSection === id
                    ? 'bg-white text-blue-600 shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {activeSection === 'profile' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 transition-all duration-500">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">Profile Information</h2>
                  <div className="w-12 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
                </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    First Name
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <input
                        type="text"
                        value={editForm.firstName || ''}
                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                        placeholder="Enter your first name"
                      />
                      <User className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100 group-hover:bg-white/80 transition-all duration-300">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-gray-900 font-medium">{profile.firstName || 'Not set'}</span>
                    </div>
                  )}
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Last Name
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <input
                        type="text"
                        value={editForm.lastName || ''}
                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                        placeholder="Enter your last name"
                      />
                      <User className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100 group-hover:bg-white/80 transition-all duration-300">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-gray-900 font-medium">{profile.lastName || 'Not set'}</span>
                    </div>
                  )}
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Email Address
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <input
                        type="email"
                        value={editForm.email || ''}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                        placeholder="Enter your email address"
                      />
                      <Mail className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100 group-hover:bg-white/80 transition-all duration-300">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Mail className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="text-gray-900 font-medium">{profile.email}</span>
                      {profile.emailVerified && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  )}
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Phone Number
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <input
                        type="tel"
                        value={editForm.phoneNumber || ''}
                        onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                        placeholder="Enter your phone number"
                      />
                      <Phone className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100 group-hover:bg-white/80 transition-all duration-300">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Phone className="w-5 h-5 text-purple-600" />
                      </div>
                      <span className="text-gray-900 font-medium">{profile.phoneNumber || 'Not set'}</span>
                    </div>
                  )}
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Company
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <input
                        type="text"
                        value={editForm.company || ''}
                        onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                        placeholder="Enter your company name"
                      />
                      <Building className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100 group-hover:bg-white/80 transition-all duration-300">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Building className="w-5 h-5 text-orange-600" />
                      </div>
                      <span className="text-gray-900 font-medium">{profile.company || 'Not set'}</span>
                    </div>
                  )}
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Location
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <input
                        type="text"
                        value={editForm.location || ''}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                        placeholder="Enter your location"
                      />
                      <MapPin className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100 group-hover:bg-white/80 transition-all duration-300">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <MapPin className="w-5 h-5 text-red-600" />
                      </div>
                      <span className="text-gray-900 font-medium">{profile.location || 'Not set'}</span>
                    </div>
                  )}
                </div>

                <div className="mt-8 md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Bio
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <textarea
                        value={editForm.bio || ''}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm resize-none"
                        placeholder="Tell us about yourself..."
                      />
                      <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                        {(editForm.bio || '').length}/500
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:bg-white/80 transition-all duration-300">
                      <p className="text-gray-900 leading-relaxed">{profile.bio || 'No bio available'}</p>
                    </div>
                  )}
                </div>
              </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 transition-all duration-500">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-red-600 bg-clip-text text-transparent">Security Settings</h2>
                  <div className="w-12 h-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-full"></div>
                </div>
                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100">
                    <h3 className="font-semibold text-gray-900 mb-2">Two-Factor Authentication</h3>
                    <p className="text-gray-600 mb-4">Add an extra layer of security to your account</p>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                      Enable 2FA
                    </button>
                  </div>
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <h3 className="font-semibold text-gray-900 mb-2">Login Sessions</h3>
                    <p className="text-gray-600 mb-4">Manage your active login sessions</p>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      View Sessions
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'activity' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 transition-all duration-500">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-green-600 bg-clip-text text-transparent">Recent Activity</h2>
                  <div className="w-12 h-1 bg-gradient-to-r from-green-600 to-teal-600 rounded-full"></div>
                </div>
                <div className="space-y-4">
                  {[
                    { action: 'Profile updated', time: '2 hours ago', icon: User },
                    { action: 'Password changed', time: '1 day ago', icon: Key },
                    { action: 'Email verified', time: '3 days ago', icon: Mail },
                    { action: 'Account created', time: '1 week ago', icon: Shield },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:bg-white/80 transition-all duration-300">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <item.icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.action}</p>
                        <p className="text-sm text-gray-500">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-8">
            {/* Enhanced Account Status */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 transition-all duration-300 hover:shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Account Status</h3>
                <div className="w-8 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-700">Email Verified</span>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    profile.emailVerified 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  }`}>
                    {profile.emailVerified ? (
                      <><CheckCircle className="w-4 h-4 mr-1" /> Verified</>
                    ) : (
                      <><AlertCircle className="w-4 h-4 mr-1" /> Pending</>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-gray-700">Phone Verified</span>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    profile.phoneVerified 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}>
                    {profile.phoneVerified ? (
                      <><CheckCircle className="w-4 h-4 mr-1" /> Verified</>
                    ) : (
                      'Not set'
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Enhanced Account Information */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 transition-all duration-300 hover:shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Account Information</h3>
                <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="font-semibold text-gray-700">Member Since</span>
                  </div>
                  <span className="text-gray-900 font-medium ml-11">
                    {profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Unknown'}
                  </span>
                </div>
                <div className="p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl border border-green-100">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Clock className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="font-semibold text-gray-700">Last Login</span>
                  </div>
                  <span className="text-gray-900 font-medium ml-11">
                    {profile.lastLogin ? new Date(profile.lastLogin).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* Enhanced Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 transition-all duration-300 hover:shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
                <div className="w-8 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
              </div>
              <div className="space-y-4">
                <button className="w-full flex items-center space-x-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 border border-red-100 rounded-xl transition-all duration-300 transform hover:scale-105 group">
                  <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                    <Key className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="font-semibold text-gray-700 group-hover:text-gray-900">Change Password</span>
                </button>
                <button className="w-full flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-100 rounded-xl transition-all duration-300 transform hover:scale-105 group">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Bell className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-semibold text-gray-700 group-hover:text-gray-900">Notification Settings</span>
                </button>
                <button className="w-full flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border border-purple-100 rounded-xl transition-all duration-300 transform hover:scale-105 group">
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <Globe className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="font-semibold text-gray-700 group-hover:text-gray-900">Privacy Settings</span>
                </button>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4">Your Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Profile Views</span>
                  <span className="font-bold">1,234</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Projects</span>
                  <span className="font-bold">42</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Achievements</span>
                  <span className="font-bold">18</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}