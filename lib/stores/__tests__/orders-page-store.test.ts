import { renderHook, act } from '@testing-library/react';
import { useOrdersPageStore } from '../orders-page-store';

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

describe('useOrdersPageStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useOrdersPageStore.getState().reset();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useOrdersPageStore());
      
      expect(result.current.pageIndex).toBe(0);
      expect(result.current.pageSize).toBe(20);
      expect(result.current.sorting).toEqual([]);
      expect(result.current.columnFilters).toEqual({});
      expect(result.current.globalFilter).toBe('');
      expect(result.current.moreActionsOpen).toBe(false);
      expect(result.current.selectedRowIds).toEqual([]);
      expect(result.current.scrollY).toBe(0);
    });
  });

  describe('Setters', () => {
    it('should update pageIndex', () => {
      const { result } = renderHook(() => useOrdersPageStore());
      
      act(() => {
        result.current.setPageIndex(2);
      });
      
      expect(result.current.pageIndex).toBe(2);
    });

    it('should update pageSize', () => {
      const { result } = renderHook(() => useOrdersPageStore());
      
      act(() => {
        result.current.setPageSize(50);
      });
      
      expect(result.current.pageSize).toBe(50);
    });

    it('should update sorting', () => {
      const { result } = renderHook(() => useOrdersPageStore());
      const sorting = [{ id: 'name', desc: true }];
      
      act(() => {
        result.current.setSorting(sorting);
      });
      
      expect(result.current.sorting).toEqual(sorting);
    });

    it('should update columnFilters', () => {
      const { result } = renderHook(() => useOrdersPageStore());
      const filters = { status: ['active', 'pending'] };
      
      act(() => {
        result.current.setColumnFilters(filters);
      });
      
      expect(result.current.columnFilters).toEqual(filters);
    });

    it('should update globalFilter', () => {
      const { result } = renderHook(() => useOrdersPageStore());
      
      act(() => {
        result.current.setGlobalFilter('test search');
      });
      
      expect(result.current.globalFilter).toBe('test search');
    });

    it('should update moreActionsOpen', () => {
      const { result } = renderHook(() => useOrdersPageStore());
      
      act(() => {
        result.current.setMoreActionsOpen(true);
      });
      
      expect(result.current.moreActionsOpen).toBe(true);
    });

    it('should update selectedRowIds', () => {
      const { result } = renderHook(() => useOrdersPageStore());
      const ids = ['1', '2', '3'];
      
      act(() => {
        result.current.setSelectedRowIds(ids);
      });
      
      expect(result.current.selectedRowIds).toEqual(ids);
    });

    it('should update scrollY', () => {
      const { result } = renderHook(() => useOrdersPageStore());
      
      act(() => {
        result.current.setScrollY(500);
      });
      
      expect(result.current.scrollY).toBe(500);
    });
  });

  describe('Reset Function', () => {
    it('should reset all state to initial values', () => {
      const { result } = renderHook(() => useOrdersPageStore());
      
      // Set some values
      act(() => {
        result.current.setPageIndex(5);
        result.current.setPageSize(100);
        result.current.setSorting([{ id: 'name', desc: true }]);
        result.current.setColumnFilters({ status: ['active'] });
        result.current.setGlobalFilter('search');
        result.current.setMoreActionsOpen(true);
        result.current.setSelectedRowIds(['1', '2']);
        result.current.setScrollY(1000);
      });
      
      // Reset
      act(() => {
        result.current.reset();
      });
      
      // Verify reset
      expect(result.current.pageIndex).toBe(0);
      expect(result.current.pageSize).toBe(20);
      expect(result.current.sorting).toEqual([]);
      expect(result.current.columnFilters).toEqual({});
      expect(result.current.globalFilter).toBe('');
      expect(result.current.moreActionsOpen).toBe(false);
      expect(result.current.selectedRowIds).toEqual([]);
      expect(result.current.scrollY).toBe(0);
    });
  });

  describe('Multiple Updates', () => {
    it('should handle multiple updates correctly', () => {
      const { result } = renderHook(() => useOrdersPageStore());
      
      act(() => {
        result.current.setPageIndex(3);
        result.current.setPageSize(50);
        result.current.setGlobalFilter('test');
        result.current.setSelectedRowIds(['1', '2', '3']);
      });
      
      expect(result.current.pageIndex).toBe(3);
      expect(result.current.pageSize).toBe(50);
      expect(result.current.globalFilter).toBe('test');
      expect(result.current.selectedRowIds).toEqual(['1', '2', '3']);
    });
  });
});
