import { renderHook, act } from '@testing-library/react';
import { useProductsPageStore } from '../products-page-store';

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

describe('useProductsPageStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useProductsPageStore.getState().reset();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useProductsPageStore());
      
      expect(result.current.pageIndex).toBe(0);
      expect(result.current.pageSize).toBe(25);
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
      const { result } = renderHook(() => useProductsPageStore());
      
      act(() => {
        result.current.setPageIndex(3);
      });
      
      expect(result.current.pageIndex).toBe(3);
    });

    it('should update pageSize', () => {
      const { result } = renderHook(() => useProductsPageStore());
      
      act(() => {
        result.current.setPageSize(100);
      });
      
      expect(result.current.pageSize).toBe(100);
    });

    it('should update globalFilter', () => {
      const { result } = renderHook(() => useProductsPageStore());
      
      act(() => {
        result.current.setGlobalFilter('product search');
      });
      
      expect(result.current.globalFilter).toBe('product search');
    });
  });

  describe('Reset Function', () => {
    it('should reset all state to initial values', () => {
      const { result } = renderHook(() => useProductsPageStore());
      
      // Set some values
      act(() => {
        result.current.setPageIndex(10);
        result.current.setPageSize(100);
        result.current.setGlobalFilter('search');
        result.current.setMoreActionsOpen(true);
      });
      
      // Reset
      act(() => {
        result.current.reset();
      });
      
      // Verify reset
      expect(result.current.pageIndex).toBe(0);
      expect(result.current.pageSize).toBe(25);
      expect(result.current.globalFilter).toBe('');
      expect(result.current.moreActionsOpen).toBe(false);
    });
  });
});
