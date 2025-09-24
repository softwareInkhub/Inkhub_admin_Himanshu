import React from 'react';
import { Order } from '../types';
import { Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrdersListProps {
  orders: Order[];
  selectedOrders: string[];
  onSelectOrder: (orderId: string) => void;
  onOrderClick: (order: Order, event?: React.MouseEvent) => void;
  getStatusBadge: (status: string) => React.ReactNode;
  // Filter props
  activeColumnFilter: string | null;
  columnFilters: any;
  onFilterClick: (column: string) => void;
  onColumnFilterChange: (column: string, value: any) => void;
  onClearFilter: (column: string, filterType: string) => void;
  getUniqueValues: (field: string) => string[];
  getUniqueTags: () => string[];
}

const OrdersList: React.FC<OrdersListProps> = ({
  orders,
  selectedOrders,
  onSelectOrder,
  onOrderClick,
  getStatusBadge,
  activeColumnFilter,
  columnFilters,
  onFilterClick,
  onColumnFilterChange,
  onClearFilter,
  getUniqueValues,
  getUniqueTags
}) => {
  const ColumnHeader = ({ 
    title, 
    column, 
    hasFilter = false, 
    filterType = 'text',
    options = [],
    colSpan = 1
  }: {
    title: string
    column: string
    hasFilter?: boolean
    filterType?: 'text' | 'select' | 'multi-select' | 'date'
    options?: string[]
    colSpan?: number
  }) => {
    const [dropdownPosition, setDropdownPosition] = React.useState<'left' | 'right'>('right')
    
    const handleFilterClick = () => {
      const isLastColumn = column === 'paymentStatus' || column === 'deliveryMethod'
      setDropdownPosition(isLastColumn ? 'left' : 'right')
      onFilterClick(column)
    }

    return (
      <div className={`col-span-${colSpan} flex items-center justify-between text-sm font-medium text-gray-700`}>
        <span>{title}</span>
        {hasFilter && (
          <div className="relative">
            <button
              onClick={handleFilterClick}
              className={cn(
                "ml-1 p-0.5 rounded hover:bg-gray-100 transition-colors",
                activeColumnFilter === column ? "bg-blue-50 text-blue-600" : "text-gray-400",
                columnFilters[column] && 
                (typeof columnFilters[column] === 'string' ? 
                  (columnFilters[column] as string) : 
                  Array.isArray(columnFilters[column]) ?
                    (columnFilters[column] as string[])?.length > 0 :
                    (columnFilters[column] as any)?.min || (columnFilters[column] as any)?.max || (columnFilters[column] as any)?.start || (columnFilters[column] as any)?.end
                ) ? "text-blue-600" : "text-gray-400"
              )}
            >
              <Filter className="h-2.5 w-2.5" />
            </button>
            
            {/* Filter Dropdown */}
            {activeColumnFilter === column && (
              <div className={cn(
                "absolute top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-[100] column-filter-dropdown",
                dropdownPosition === 'right' ? 'right-0' : 'left-0'
              )}
              style={{
                position: 'absolute',
                zIndex: 1000,
                maxHeight: '300px',
                overflowY: 'auto',
                transform: 'translateZ(0)'
              }}>
                <div className="p-2">
                  {filterType === 'text' && (
                    <input
                      type="text"
                      placeholder={`Filter ${title.toLowerCase()}...`}
                      value={columnFilters[column] as string || ''}
                      onChange={(e) => onColumnFilterChange(column, e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                  )}
                  
                  {filterType === 'select' && (
                    <select
                      value={columnFilters[column] as string || ''}
                      onChange={(e) => onColumnFilterChange(column, e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All {title}</option>
                      {options.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  )}
                  
                  {filterType === 'multi-select' && (
                    <select
                      multiple
                      value={columnFilters[column] as string[] || []}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value)
                        onColumnFilterChange(column, selected)
                      }}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {options.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  )}
                  
                  {filterType === 'date' && (
                    <input
                      type="date"
                      value={columnFilters[column] as string || ''}
                      onChange={(e) => onColumnFilterChange(column, e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                  
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => onClearFilter(column, filterType)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* List Header */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
          <div className="col-span-1">
            <input
              type="checkbox"
              checked={selectedOrders.length === orders.length && orders.length > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  orders.forEach(order => onSelectOrder(order.id));
                } else {
                  selectedOrders.forEach(orderId => onSelectOrder(orderId));
                }
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <ColumnHeader title="Order" column="orderNumber" hasFilter={true} filterType="text" colSpan={2} />
          <ColumnHeader title="Customer" column="customer" hasFilter={true} filterType="text" colSpan={2} />
          <ColumnHeader title="Status" column="fulfillmentStatus" hasFilter={true} filterType="multi-select" options={['unfulfilled', 'fulfilled', 'partial']} colSpan={1} />
          <ColumnHeader title="Total" column="total" hasFilter={true} filterType="text" colSpan={1} />
          <ColumnHeader title="Date" column="date" hasFilter={true} filterType="date" colSpan={1} />
          <ColumnHeader title="Items" column="items" hasFilter={true} filterType="text" colSpan={1} />
          <ColumnHeader title="Payment" column="paymentStatus" hasFilter={true} filterType="multi-select" options={['paid', 'pending', 'refunded']} colSpan={1} />
          <ColumnHeader title="Tags" column="tags" hasFilter={true} filterType="multi-select" options={getUniqueTags()} colSpan={2} />
        </div>
      </div>

      {/* List Body */}
      <div className="divide-y divide-gray-100">
        {orders.map((order, index) => (
          <div
            key={`${order.id}-${index}`}
            className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
            onClick={(e) => onOrderClick(order, e)}
          >
            <div className="grid grid-cols-12 gap-4 items-center text-sm">
              {/* Checkbox */}
              <div className="col-span-1">
                <input
                  type="checkbox"
                  checked={selectedOrders.includes(order.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    onSelectOrder(order.id);
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              {/* Order Number */}
              <div className="col-span-2">
                <span className="font-medium text-gray-900">#{order.orderNumber}</span>
              </div>

              {/* Customer */}
              <div className="col-span-2">
                <span className="text-gray-900">{order.customerName}</span>
              </div>

              {/* Status */}
              <div className="col-span-1">
                {getStatusBadge(order.fulfillmentStatus)}
              </div>

              {/* Total */}
              <div className="col-span-1">
                <span className="font-medium text-gray-900">${order.total}</span>
              </div>

              {/* Date */}
              <div className="col-span-1">
                <span className="text-gray-600">{order.createdAt}</span>
              </div>

              {/* Items */}
              <div className="col-span-1">
                <span className="text-gray-600">{order.items.length} items</span>
              </div>

              {/* Payment Status */}
              <div className="col-span-1">
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                  order.financialStatus === 'paid' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.financialStatus}
                </span>
              </div>

              {/* Tags */}
              <div className="col-span-2">
                {order.tags && order.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {order.tags.slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {order.tags.length > 2 && (
                      <span className="text-xs text-gray-500">
                        +{order.tags.length - 2}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400 text-xs">No tags</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersList;
