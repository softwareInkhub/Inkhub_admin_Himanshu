import { NextRequest, NextResponse } from 'next/server';

// This would integrate with your backend CRUD service
// For now, we'll create a mock implementation that stores in localStorage-like fashion
// In production, this should call your actual backend service

interface SavedView {
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

// Mock storage - in production this should use your DynamoDB backend
const mockStorage = new Map<string, SavedView[]>();

function getStorageKey(tableName: string): string {
  return `saved_views_${tableName}`;
}

function getViews(tableName: string): SavedView[] {
  const key = getStorageKey(tableName);
  const stored = mockStorage.get(key);
  return stored || [];
}

function saveViews(tableName: string, views: SavedView[]): void {
  const key = getStorageKey(tableName);
  mockStorage.set(key, views);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tableName = searchParams.get('tableName');
  const operation = searchParams.get('operation');

  console.log('🔧 API GET called with:', { tableName, operation });

  if (!tableName) {
    return NextResponse.json({ error: 'tableName is required' }, { status: 400 });
  }

  try {
    switch (operation) {
      case 'listViews':
        const views = getViews(tableName);
        console.log('🔧 API: listViews called for table:', tableName, 'Found views:', views.length);
        return NextResponse.json({ 
          success: true, 
          views: views.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        });

      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in GET /api/crud:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableName, operation, viewName, description, searchState } = body;
    
    console.log('🔧 API POST called with:', { tableName, operation, viewName, hasSearchState: !!searchState });

    if (!tableName) {
      return NextResponse.json({ error: 'tableName is required' }, { status: 400 });
    }

    switch (operation) {
      case 'saveView':
        console.log('🔧 API: saveView called with:', { tableName, viewName, searchState });
        
        if (!viewName || !searchState) {
          console.log('❌ API: Missing required fields:', { viewName: !!viewName, searchState: !!searchState });
          return NextResponse.json({ error: 'viewName and searchState are required' }, { status: 400 });
        }

        const views = getViews(tableName);
        console.log('🔧 API: Current views count:', views.length);
        
        // Check if view already exists
        const existingIndex = views.findIndex(v => v.viewName === viewName);
        const now = new Date().toISOString();

        const newView: SavedView = {
          id: existingIndex >= 0 ? views[existingIndex].id : `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          viewName,
          description: description || '',
          isDefault: existingIndex >= 0 ? views[existingIndex].isDefault : false,
          createdAt: existingIndex >= 0 ? views[existingIndex].createdAt : now,
          updatedAt: now,
          searchQuery: searchState.searchQuery || '',
          searchConditions: searchState.searchConditions || [],
          columnFilters: searchState.columnFilters || {},
          customFilters: searchState.customFilters || [],
          advancedFilters: searchState.advancedFilters || {},
          sortColumn: searchState.sortColumn || '',
          sortDirection: searchState.sortDirection || 'asc',
          viewMode: searchState.viewMode || 'table',
          itemsPerPage: searchState.itemsPerPage || 50,
        };

        if (existingIndex >= 0) {
          views[existingIndex] = newView;
        } else {
          views.push(newView);
        }

        saveViews(tableName, views);

        return NextResponse.json({ 
          success: true, 
          view: newView 
        });

      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in POST /api/crud:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableName, operation, viewName } = body;

    if (!tableName || !operation || !viewName) {
      return NextResponse.json({ error: 'tableName, operation, and viewName are required' }, { status: 400 });
    }

    switch (operation) {
      case 'setDefaultView':
        const views = getViews(tableName);
        const targetView = views.find(v => v.viewName === viewName);
        
        if (!targetView) {
          return NextResponse.json({ error: 'View not found' }, { status: 404 });
        }

        // Remove default from all views
        views.forEach(view => {
          view.isDefault = false;
        });

        // Set the target view as default
        targetView.isDefault = true;
        targetView.updatedAt = new Date().toISOString();

        saveViews(tableName, views);

        return NextResponse.json({ 
          success: true, 
          view: targetView 
        });

      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in PUT /api/crud:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableName, operation, viewName } = body;

    if (!tableName || !operation || !viewName) {
      return NextResponse.json({ error: 'tableName, operation, and viewName are required' }, { status: 400 });
    }

    switch (operation) {
      case 'deleteView':
        const views = getViews(tableName);
        const filteredViews = views.filter(v => v.viewName !== viewName);
        
        if (filteredViews.length === views.length) {
          return NextResponse.json({ error: 'View not found' }, { status: 404 });
        }

        saveViews(tableName, filteredViews);

        return NextResponse.json({ 
          success: true, 
          message: 'View deleted successfully' 
        });

      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in DELETE /api/crud:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
