import { renderHook, act } from '@testing-library/react';
import { useDesignLibraryPageStore } from '../design-library-page-store';

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  key: jest.fn(),
  length: 0,
  clear: jest.fn(),
};

// Mock the persist storage
jest.mock('../../persist-storage', () => ({
  sessionStorageSafe: mockSessionStorage,
}));

describe('useDesignLibraryPageStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useDesignLibraryPageStore.getState().reset();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useDesignLibraryPageStore());
      
      expect(result.current.pageIndex).toBe(0);
      expect(result.current.pageSize).toBe(50);
      expect(result.current.sorting).toEqual([]);
      expect(result.current.columnFilters).toEqual({});
      expect(result.current.globalFilter).toBe('');
      expect(result.current.moreActionsOpen).toBe(false);
      expect(result.current.selectedRowIds).toEqual([]);
      expect(result.current.scrollY).toBe(0);
      expect(result.current.viewMode).toBe('table');
    });
  });

  describe('Setters', () => {
    it('should update pageIndex', () => {
      const { result } = renderHook(() => useDesignLibraryPageStore());
      
      act(() => {
        result.current.setPageIndex(5);
      });
      
      expect(result.current.pageIndex).toBe(5);
    });

    it('should update pageSize', () => {
      const { result } = renderHook(() => useDesignLibraryPageStore());
      
      act(() => {
        result.current.setPageSize(100);
      });
      
      expect(result.current.pageSize).toBe(100);
    });

    it('should update viewMode', () => {
      const { result } = renderHook(() => useDesignLibraryPageStore());
      
      act(() => {
        result.current.setViewMode('grid');
      });
      
      expect(result.current.viewMode).toBe('grid');
    });

    it('should update viewMode to card', () => {
      const { result } = renderHook(() => useDesignLibraryPageStore());
      
      act(() => {
        result.current.setViewMode('card');
      });
      
      expect(result.current.viewMode).toBe('card');
    });

    it('should update globalFilter', () => {
      const { result } = renderHook(() => useDesignLibraryPageStore());
      
      act(() => {
        result.current.setGlobalFilter('design search');
      });
      
      expect(result.current.globalFilter).toBe('design search');
    });
  });

  describe('Reset Function', () => {
    it('should reset all state to initial values', () => {
      const { result } = renderHook(() => useDesignLibraryPageStore());
      
      // Set some values
      act(() => {
        result.current.setPageIndex(15);
        result.current.setPageSize(100);
        result.current.setGlobalFilter('search');
        result.current.setViewMode('grid');
        result.current.setMoreActionsOpen(true);
      });
      
      // Reset
      act(() => {
        result.current.reset();
      });
      
      // Verify reset
      expect(result.current.pageIndex).toBe(0);
      expect(result.current.pageSize).toBe(50);
      expect(result.current.globalFilter).toBe('');
      expect(result.current.viewMode).toBe('table');
      expect(result.current.moreActionsOpen).toBe(false);
    });
  });

  describe('ViewMode Transitions', () => {
    it('should handle viewMode transitions correctly', () => {
      const { result } = renderHook(() => useDesignLibraryPageStore());
      
      // Test table -> grid
      act(() => {
        result.current.setViewMode('grid');
      });
      expect(result.current.viewMode).toBe('grid');
      
      // Test grid -> card
      act(() => {
        result.current.setViewMode('card');
      });
      expect(result.current.viewMode).toBe('card');
      
      // Test card -> table
      act(() => {
        result.current.setViewMode('table');
      });
      expect(result.current.viewMode).toBe('table');
    });
  });
});
