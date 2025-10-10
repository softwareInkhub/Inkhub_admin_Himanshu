/**
 * Saved Searches Dropdown Component
 * UI for managing and applying saved search views
 */

'use client';

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

export interface SearchState {
  searchQuery: string;
  searchConditions: any[];
  columnFilters: Record<string, any>;
  customFilters: any[];
  advancedFilters: any;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  viewMode: 'table' | 'grid' | 'card';
  itemsPerPage: number;
}

export interface SavedView {
  id: string;
  viewName: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  searchQuery: string;
  searchConditions: any[];
  columnFilters: Record<string, any>;
  customFilters: any[];
  advancedFilters: any;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  viewMode: 'table' | 'grid' | 'card';
  itemsPerPage: number;
}

export interface SavedSearchesDropdownProps {
  tableName: string;
  currentSearchState: SearchState;
  onApplyView: (view: SearchState) => void;
  className?: string;
}

export interface SavedSearchesDropdownRef {
  triggerSave: () => void;
}

export const SavedSearchesDropdown = forwardRef<SavedSearchesDropdownRef, SavedSearchesDropdownProps>(({
  tableName,
  currentSearchState,
  onApplyView,
  className = '',
}, ref) => {
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [currentView, setCurrentView] = useState<SavedView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [viewName, setViewName] = useState('');
  const [viewDescription, setViewDescription] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    triggerSave: () => {
      console.log('💾 SavedSearchesDropdown: triggerSave called via ref');
      setShowSaveModal(true);
      // Auto-fill the view name with the current search query
      if (currentSearchState.searchQuery.trim()) {
        setViewName(currentSearchState.searchQuery.trim());
      }
    }
  }), [currentSearchState.searchQuery]);

  // Load saved views from backend
  const loadViews = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔧 Component: loadViews called for table:', tableName);
      
      const response = await fetch(`/api/crud?tableName=${tableName}&operation=listViews`);
      console.log('🔧 Component: loadViews response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Component: loadViews error response:', errorText);
        throw new Error(`Failed to load views: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('🔧 Component: loadViews response data:', data);
      
      setSavedViews(data.views || []);
      
      // Set current view if there's a default
      const defaultView = data.views?.find((v: SavedView) => v.isDefault);
      if (defaultView) {
        setCurrentView(defaultView);
      }
    } catch (err) {
      console.log('❌ Component: loadViews error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load views');
    } finally {
      setLoading(false);
    }
  };

  // Save current search state as a view
  const saveView = async (name: string, state: SearchState, description?: string) => {
    try {
      console.log('🔧 Component: saveView called with:', { name, state, description, tableName });
      
      const response = await fetch('/api/crud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName,
          operation: 'saveView',
          viewName: name,
          description,
          searchState: state,
        }),
      });

      console.log('🔧 Component: API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Component: API error response:', errorText);
        throw new Error(`Failed to save view: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log('🔧 Component: API response data:', result);
      
      if (result.success) {
        await loadViews(); // Reload views
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.log('❌ Component: saveView error:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to save view' };
    }
  };

  // Load a specific view
  const loadView = async (name: string): Promise<SearchState | null> => {
    const view = savedViews.find(v => v.viewName === name);
    if (!view) return null;

    setCurrentView(view);
    return {
      searchQuery: view.searchQuery,
      searchConditions: view.searchConditions,
      columnFilters: view.columnFilters,
      customFilters: view.customFilters,
      advancedFilters: view.advancedFilters,
      sortColumn: view.sortColumn,
      sortDirection: view.sortDirection,
      viewMode: view.viewMode,
      itemsPerPage: view.itemsPerPage,
    };
  };

  // Delete a view
  const deleteView = async (name: string) => {
    try {
      const response = await fetch('/api/crud', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName,
          operation: 'deleteView',
          viewName: name,
        }),
      });

      if (!response.ok) throw new Error('Failed to delete view');
      
      const result = await response.json();
      if (result.success) {
        await loadViews(); // Reload views
        if (currentView?.viewName === name) {
          setCurrentView(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete view:', err);
    }
  };

  // Set default view
  const setDefaultView = async (name: string) => {
    try {
      const response = await fetch('/api/crud', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName,
          operation: 'setDefaultView',
          viewName: name,
        }),
      });

      if (!response.ok) throw new Error('Failed to set default view');
      
      const result = await response.json();
      if (result.success) {
        await loadViews(); // Reload views
      }
    } catch (err) {
      console.error('Failed to set default view:', err);
    }
  };

  // Load views on mount
  useEffect(() => {
    loadViews();
  }, [tableName]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveView = async () => {
    if (!viewName.trim()) {
      setSaveError('View name is required');
      return;
    }

    setSaveError(null);
    console.log('💾 Saving view:', {
      viewName: viewName.trim(),
      description: viewDescription.trim(),
      currentSearchState,
      tableName
    });
    
    const result = await saveView(viewName.trim(), currentSearchState, viewDescription.trim());
    console.log('💾 Save result:', result);

    if (result.success) {
      setShowSaveModal(false);
      setViewName('');
      setViewDescription('');
    } else {
      setSaveError(result.error || 'Failed to save view');
    }
  };

  const handleLoadView = async (name: string) => {
    const view = await loadView(name);
    if (view) {
      onApplyView(view);
      setIsOpen(false);
    }
  };

  const handleDeleteView = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      await deleteView(name);
    }
  };

  const handleSetDefault = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await setDefaultView(name);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        title="Saved Searches"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        <span>Saved Views</span>
        {savedViews.length > 0 && (
          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
            {savedViews.length}
          </span>
        )}
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Saved Search Views</h3>
              <button
                onClick={() => setShowSaveModal(true)}
                className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
              >
                + Save Current
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="px-4 py-2 bg-red-50 border-b border-red-100">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* Views List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center">
                <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-2 text-sm text-gray-500">Loading views...</p>
              </div>
            ) : savedViews.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <svg className="mx-auto w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">No saved views yet</p>
                <p className="mt-1 text-xs text-gray-400">Save your current search to quickly access it later</p>
              </div>
            ) : (
              <div className="py-2">
                {savedViews.map((view) => (
                  <div
                    key={view.id}
                    className="group px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                    onClick={() => handleLoadView(view.viewName)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {view.viewName}
                          </h4>
                          {view.isDefault && (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                              Default
                            </span>
                          )}
                          {currentView?.id === view.id && (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                              Active
                            </span>
                          )}
                        </div>
                        {view.description && (
                          <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                            {view.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                          <span>Updated {new Date(view.updatedAt).toLocaleDateString()}</span>
                          {view.searchQuery && (
                            <span className="inline-flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                              Query
                            </span>
                          )}
                          {view.columnFilters && Object.keys(view.columnFilters).length > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                              </svg>
                              Filters
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!view.isDefault && (
                          <button
                            onClick={(e) => handleSetDefault(view.viewName, e)}
                            className="p-1 text-gray-400 hover:text-green-600 rounded hover:bg-green-50"
                            title="Set as default"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDeleteView(view.viewName, e)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                          title="Delete view"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Save Search View</h3>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  View Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={viewName}
                  onChange={(e) => setViewName(e.target.value)}
                  placeholder="e.g., High Priority Orders"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={viewDescription}
                  onChange={(e) => setViewDescription(e.target.value)}
                  placeholder="Describe what this view shows..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {saveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{saveError}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setViewName('');
                  setViewDescription('');
                  setSaveError(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveView}
                disabled={loading || !viewName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : 'Save View'}
              </button>
            </div>
          </div>
        </div>
      )}
     </div>
   );
 });
 
 SavedSearchesDropdown.displayName = 'SavedSearchesDropdown';
 
 export default SavedSearchesDropdown;