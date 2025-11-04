'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  EyeOff,
  Filter,
  Download,
  Upload,
  RefreshCw,
  UserPlus,
  Settings,
  Database,
  Activity,
  Palette,
  Package, 
  ImageIcon,
  BookOpen,
  ShoppingCart, 
  Clock,
  BarChart3,
  FileText,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AuditLog from '@/components/common/AuditLog';
import RoleTemplate from '@/components/common/RoleTemplate';

const PERMISSIONS = [
  {
    label: 'Shopify',
    icon: Package,
    children: [
      { label: 'Orders', icon: ShoppingCart },
      { label: 'Products', icon: Package },
      { label: 'Create', icon: Plus },
      { label: 'Edit', icon: Edit },
      { label: 'View', icon: Eye },
      { label: 'Delete', icon: Trash2 },
    ],
  },
  {
    label: 'Pinterest',
    icon: ImageIcon,
    children: [
      { label: 'Pins', icon: ImageIcon },
      { label: 'Boards', icon: BookOpen },
    ],
  },
  {
    label: 'Design Library',
    icon: Palette,
    children: [
      { label: 'Designs', icon: Palette },
      { label: 'Upload', icon: Upload },
      { label: 'Edit', icon: Edit },
      { label: 'Delete', icon: Trash2 },
    ],
  },
  {
    label: 'User Management',
    icon: Users,
    children: [
      { label: 'Register User', icon: UserPlus },
      { label: 'Existing User', icon: Users },
      { label: 'Access Control', icon: Shield },
    ],
  },
  {
    label: 'Settings',
    icon: Settings,
    children: [
      { label: 'General', icon: Settings },
      { label: 'Health Check', icon: Activity },
      { label: 'Caching', icon: Database },
    ],
  },
];

type Permission = {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: Permission[];
};

type User = {
  id: string;
  username: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: string;
  permissions: string[];
  avatar?: string;
};

type Role = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isDefault: boolean;
};

const DEFAULT_ROLES: Role[] = [
  {
    id: 'super-admin',
    name: 'Super Admin',
    description: 'Full system access and control',
    permissions: [],
    userCount: 1,
    isDefault: false,
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Administrative access with limited system control',
    permissions: [],
    userCount: 3,
    isDefault: false,
  },
  {
    id: 'designer',
    name: 'Designer',
    description: 'Access to design library and related features',
    permissions: [],
    userCount: 5,
    isDefault: true,
  },
  {
    id: 'developer',
    name: 'Developer',
    description: 'Technical access for development tasks',
    permissions: [],
    userCount: 2,
    isDefault: false,
  },
];

function PermissionTree({ permissions, checked, onCheck, parentKey = '', level = 0 }: {
  permissions: Permission[];
  checked: string[];
  onCheck: (key: string) => void;
  parentKey?: string;
  level?: number;
}) {
  return (
    <div className={cn("space-y-1", level > 0 && "ml-6")}>
      {permissions.map((perm: Permission) => {
        const key = parentKey ? `${parentKey}.${perm.label}` : perm.label;
        const isChecked = checked.includes(key);
        const hasChildren = perm.children && perm.children.length > 0;
        const Icon = perm.icon;

        return (
          <div key={key} className="space-y-1">
            <label className={cn(
              "flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors",
              isChecked && "bg-blue-50 border border-blue-200"
            )}>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onCheck(key)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {Icon && <Icon className="h-4 w-4 text-gray-500" />}
              <span className={cn(
                "text-sm",
                hasChildren ? "font-semibold text-gray-900" : "text-gray-700"
              )}>
                {perm.label}
              </span>
            </label>
            {hasChildren && (
              <PermissionTree
                permissions={perm.children!}
                checked={checked}
                onCheck={onCheck}
                parentKey={key}
                level={level + 1}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AccessControlPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [checked, setChecked] = useState<string[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions' | 'templates' | 'audit'>('users');
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Add tab for this page
  useEffect(() => {
    const path = window.location.pathname;
    const { addTab } = require('@/lib/store').useAppStore.getState();
    addTab({
      title: 'Access Control',
      path,
      pinned: false,
      closable: true,
    });
  }, []);

  // Mock users data
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: '1',
        username: 'john.doe',
        email: 'john.doe@example.com',
        role: 'super admin',
        status: 'active',
        lastLogin: '2024-01-15T10:30:00Z',
        permissions: ['Shopify.Orders', 'Shopify.Products', 'Pinterest.Pins'],
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
      },
      {
        id: '2',
        username: 'jane.smith',
        email: 'jane.smith@example.com',
        role: 'admin',
        status: 'active',
        lastLogin: '2024-01-14T15:45:00Z',
        permissions: ['Design Library.Designs', 'User Management.Register User'],
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
      },
      {
        id: '3',
        username: 'mike.wilson',
        email: 'mike.wilson@example.com',
        role: 'designer',
        status: 'active',
        lastLogin: '2024-01-13T09:20:00Z',
        permissions: ['Design Library.Designs', 'Design Library.Upload'],
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
      },
    ];
    setUsers(mockUsers);

    // Mock audit events
    const mockAuditEvents = [
      {
        id: '1',
        timestamp: '2024-01-15T14:30:00Z',
        user: 'john.doe',
        action: 'permission_granted',
        resource: 'Shopify.Orders',
        details: 'Granted view and edit permissions',
        severity: 'medium',
      },
      {
        id: '2',
        timestamp: '2024-01-15T13:45:00Z',
        user: 'jane.smith',
        action: 'role_assigned',
        resource: 'Designer Role',
        details: 'Assigned designer role with design library access',
        severity: 'low',
      },
      {
        id: '3',
        timestamp: '2024-01-15T12:20:00Z',
        user: 'admin',
        action: 'user_created',
        resource: 'New User',
        details: 'Created new user account for mike.wilson',
        severity: 'low',
      },
      {
        id: '4',
        timestamp: '2024-01-15T11:15:00Z',
        user: 'john.doe',
        action: 'login',
        resource: 'System Access',
        details: 'User logged in from IP 192.168.1.100',
        severity: 'low',
      },
      {
        id: '5',
        timestamp: '2024-01-15T10:30:00Z',
        user: 'jane.smith',
        action: 'permission_revoked',
        resource: 'Settings.Caching',
        details: 'Removed caching settings access due to security policy',
        severity: 'high',
      },
    ];
    setAuditEvents(mockAuditEvents);
  }, []);

  // When a user is selected, populate the form
  useEffect(() => {
    if (!selectedUser) return;
    const user = users.find((u: User) => u.id === selectedUser);
    if (user) {
      setName(user.username);
      setRole(user.role);
      setChecked(user.permissions);
    }
  }, [selectedUser, users]);

  const handleCheck = (key: string) => {
    setChecked((prev: string[]) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectAll = () => {
    if (checked.length === getAllKeys(PERMISSIONS).length) {
      setChecked([]);
    } else {
      setChecked(getAllKeys(PERMISSIONS));
    }
  };

  function getAllKeys(perms: Permission[], parentKey = ''): string[] {
    let keys: string[] = [];
    for (const perm of perms) {
      const key = parentKey ? `${parentKey}.${perm.label}` : perm.label;
      keys.push(key);
      if (perm.children) {
        keys = keys.concat(getAllKeys(perm.children, key));
      }
    }
    return keys;
  }

  // Filter permissions by search
  function filterPermissions(perms: Permission[], query: string): Permission[] {
    if (!query) return perms;
    return perms
      .map((perm: Permission) => {
        if (perm.label.toLowerCase().includes(query.toLowerCase())) return perm;
        if (perm.children) {
          const filteredChildren = filterPermissions(perm.children, query);
          if (filteredChildren.length > 0) return { ...perm, children: filteredChildren };
        }
        return null;
      })
      .filter((p): p is Permission => Boolean(p));
  }

  const filteredPermissions = filterPermissions(PERMISSIONS, search);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Permissions saved successfully!');
      setSelectedUser('');
      setName('');
      setRole('');
      setChecked([]);
      setSearch('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole.name.trim()) return;
    
    const role: Role = {
      id: `role-${Date.now()}`,
      name: newRole.name,
      description: newRole.description,
      permissions: [],
      userCount: 0,
      isDefault: false,
    };
    
    setRoles(prev => [...prev, role]);
    setNewRole({ name: '', description: '' });
    setShowCreateRole(false);
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template.id);
    setChecked(template.permissions);
    setRole(template.name);
    setActiveTab('permissions');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 w-full min-h-screen bg-gray-50 animate-fade-in">
      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold gradient-text">Access Control</h1>
      </div>
        <p className="text-gray-600">Manage user permissions and role-based access control</p>
          </div>
          
      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-green-700">{success}</span>
          </div>
              </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'users', name: 'Users', icon: Users },
              { id: 'roles', name: 'Roles', icon: Shield },
              { id: 'permissions', name: 'Permissions', icon: Settings },
              { id: 'templates', name: 'Templates', icon: FileText },
              { id: 'audit', name: 'Audit Log', icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-all duration-200 hover-lift',
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
        </div>

      {/* Tab Content */}
      <div className="card animate-fade-in">
        {activeTab === 'users' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold gradient-text">User Management</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover-lift transition-all">
                <UserPlus className="h-4 w-4" />
                Add User
              </button>
          </div>
            {/* User List */}
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover-lift transition-all">
                  <div className="flex items-center gap-4">
                    <img 
                      src={user.avatar} 
                      alt={user.username}
                      className="w-10 h-10 rounded-full"
                    />
                  <div>
                      <h3 className="font-semibold text-gray-900">{user.username}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusColor(user.status))}>
                      {user.status}
                    </span>
                    <span className="text-sm text-gray-500">{user.role}</span>
                  <button
                      onClick={() => setSelectedUser(user.id)}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover-lift"
                  >
                      <Edit className="h-4 w-4" />
                      Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {activeTab === 'roles' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold gradient-text">Role Management</h2>
            <button
                onClick={() => setShowCreateRole(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover-lift transition-all"
              >
                <Plus className="h-4 w-4" />
                Create Role
                </button>
              </div>
            {/* Role Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles.map((role) => (
                <div key={role.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover-lift transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{role.name}</h3>
                    {role.isDefault && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Default</span>
            )}
          </div>
                  <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{role.userCount} users</span>
                    <button className="text-blue-600 hover:text-blue-700 hover-lift">Edit</button>
        </div>
      </div>
              ))}
                    </div>
                  </div>
        )}

        {activeTab === 'permissions' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold gradient-text mb-6">Permission Management</h2>
            <form className="space-y-6" onSubmit={handleSave}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedUser}
                    onChange={e => setSelectedUser(e.target.value)}
                  >
                    <option value="">Choose a user</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.username} ({user.email})
                      </option>
                    ))}
                  </select>
                        </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                  >
                    <option value="">Select a role</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  </div>
                </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="mb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search permissions..."
                    />
                    </div>
                  </div>
                <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-auto bg-gray-50">
                  <label className="flex items-center gap-2 mb-4 p-2 bg-white rounded border">
                        <input
                          type="checkbox"
                      checked={checked.length === getAllKeys(filteredPermissions).length && checked.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium">Select All</span>
                      </label>
                  <PermissionTree permissions={filteredPermissions} checked={checked} onCheck={handleCheck} />
                  </div>
                </div>
              <div className="flex justify-end gap-4">
                      <button
                  type="button" 
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 hover-lift transition-all"
                  onClick={() => {
                    setSelectedUser('');
                    setName('');
                    setRole('');
                    setChecked([]);
                    setSearch('');
                  }}
                >
                  Cancel
                      </button>
                      <button
                  type="submit" 
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 hover-lift transition-all disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Permissions
                    </>
                  )}
                      </button>
                    </div>
            </form>
                  </div>
        )}

        {activeTab === 'templates' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold gradient-text">Role Templates</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Quick setup with predefined roles</span>
                  </div>
                </div>
            <RoleTemplate 
              onSelectTemplate={handleTemplateSelect}
              selectedTemplate={selectedTemplate}
            />
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold gradient-text">Audit Log</h2>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover-lift">
                  <Download className="h-4 w-4" />
                  Export
                      </button>
                <button className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover-lift">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                      </button>
                    </div>
                  </div>
            <AuditLog events={auditEvents} />
                        </div>
        )}
            </div>

      {/* Create Role Modal */}
      {showCreateRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] animate-fade-in">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-lg animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold gradient-text">Create New Role</h3>
              <button onClick={() => setShowCreateRole(false)} className="hover-lift">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreateRole} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter role name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter role description"
                  rows={3}
                />
                  </div>
              <div className="flex justify-end gap-3">
                    <button
                  type="button"
                  onClick={() => setShowCreateRole(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 hover-lift"
                    >
                  Cancel
                    </button>
                    <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 hover-lift"
                    >
                  Create Role
                    </button>
                  </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 