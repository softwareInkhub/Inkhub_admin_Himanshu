import { useState } from 'react';
import { format } from 'date-fns';
import { Eye, Edit, Trash, MoreHorizontal } from 'lucide-react';
import { Design } from '../types';
import { DesignImage } from './DesignImage';
import { getStatusBadge } from '../utils';
import { ColumnHeader } from './ColumnHeader';

interface DesignTableProps {
  designs: Design[];
  selectedDesigns: string[];
  onDesignSelect: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onDesignClick: (design: Design, event: React.MouseEvent) => void;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  onSort: (column: string) => void;
  columnFilters: Record<string, any>;
  onColumnFilterChange: (column: string, value: any) => void;
}

export const DesignTable = ({
  designs,
  selectedDesigns,
  onDesignSelect,
  onSelectAll,
  onDesignClick,
  sortColumn,
  sortDirection,
  onSort,
  columnFilters,
  onColumnFilterChange
}: DesignTableProps) => {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const columns = [
    {
      key: 'image',
      label: 'Image',
      sortable: false,
      filterable: false,
      width: 'w-24'
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      filterable: true,
      filterType: 'text' as const,
      width: 'w-48'
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      filterType: 'select' as const,
      width: 'w-32'
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      filterable: true,
      filterType: 'select' as const,
      width: 'w-32'
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      filterable: true,
      filterType: 'select' as const,
      width: 'w-32'
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      filterable: true,
      filterType: 'text' as const,
      width: 'w-24'
    },
    {
      key: 'size',
      label: 'Size',
      sortable: true,
      filterable: true,
      filterType: 'text' as const,
      width: 'w-32'
    },
    {
      key: 'client',
      label: 'Client',
      sortable: true,
      filterable: true,
      filterType: 'text' as const,
      width: 'w-32'
    },
    {
      key: 'designer',
      label: 'Designer',
      sortable: true,
      filterable: true,
      filterType: 'text' as const,
      width: 'w-32'
    },
    {
      key: 'views',
      label: 'Views',
      sortable: true,
      filterable: true,
      filterType: 'text' as const,
      width: 'w-20'
    },
    {
      key: 'downloads',
      label: 'Downloads',
      sortable: true,
      filterable: true,
      filterType: 'text' as const,
      width: 'w-24'
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      filterable: true,
      filterType: 'date' as const,
      width: 'w-32'
    }
  ];

  const renderCell = (design: Design, column: any) => {
    switch (column.key) {
      case 'image':
        return (
          <DesignImage
            src={design.image}
            alt={design.name}
            size="sm"
            className="rounded"
          />
        );
      
      case 'name':
        return (
          <div>
            <div className="font-medium text-gray-900">{design.name}</div>
          </div>
        );
      
      case 'status':
        const statusBadge = getStatusBadge(design.status, 'status');
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusBadge.className}`}>
            {statusBadge.text}
          </span>
        );
      
      case 'type':
        const typeBadge = getStatusBadge(design.type, 'type');
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${typeBadge.className}`}>
            {typeBadge.text}
          </span>
        );
      
      case 'category':
        return (
          <span className="text-purple-600 capitalize">{design.category}</span>
        );
      
      case 'price':
        return (
          <span className="text-green-600 font-medium">${design.price}</span>
        );
      
      case 'size':
        return (
          <span className="text-gray-600 text-sm">{design.size}</span>
        );
      
      case 'client':
        return (
          <span className="text-gray-700">{design.client}</span>
        );
      
      case 'designer':
        return (
          <span className="text-indigo-600">{design.designer}</span>
        );
      
      case 'views':
        return (
          <span className="text-gray-500">{design.views}</span>
        );
      
      case 'downloads':
        return (
          <span className="text-gray-500">{design.downloads}</span>
        );
      
      case 'createdAt':
        return (
          <span className="text-gray-500">{format(new Date(design.createdAt), 'MMM dd, yyyy')}</span>
        );
      
      default:
        return <span className="text-gray-900">{String(design[column.key as keyof Design])}</span>;
    }
  };

  const allSelected = designs.length > 0 && selectedDesigns.length === designs.length;
  const someSelected = selectedDesigns.length > 0 && selectedDesigns.length < designs.length;

  return (
    <div className="overflow-visible">
      <table className="w-full">
        <thead className="relative">
          <tr>
            <th className="relative px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected;
                }}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </th>
            {columns.map((column) => (
              <ColumnHeader
                key={column.key}
                column={column}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={onSort}
                filterValue={columnFilters[column.key]}
                onFilterChange={(value) => onColumnFilterChange(column.key, value)}
              />
            ))}
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {designs.map((design) => (
            <tr
              key={design.id}
              className={`border-b hover:bg-gray-50 transition-colors ${
                hoveredRow === design.id ? 'bg-gray-50' : ''
              }`}
              onMouseEnter={() => setHoveredRow(design.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedDesigns.includes(design.id)}
                  onChange={(e) => onDesignSelect(design.id, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </td>
              {columns.map((column) => (
                <td key={column.key} className={`px-4 py-3 ${column.width}`}>
                  {renderCell(design, column)}
                </td>
              ))}
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => onDesignClick(design, e)}
                    className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                    title="View design details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                    title="Edit design"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                    title="Delete design"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                  <button
                    className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
                    title="More options"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
