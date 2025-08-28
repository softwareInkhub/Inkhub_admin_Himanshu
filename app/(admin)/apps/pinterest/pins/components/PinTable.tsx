'use client'

import { format } from 'date-fns'
import { Eye, Edit, Trash, Heart, MessageCircle, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import ColumnHeader from './ColumnHeader'
import PinImage from './PinImage'
import { useImagePreloader } from '../hooks'

interface Pin {
  id: string
  title: string
  description: string
  board: string
  owner: string
  image: string
  createdAt: string
  updatedAt: string
  tags: string[]
  likes: number
  comments: number
  repins: number
  saves: number
  isStarred: boolean
  selected?: boolean
  type?: 'image' | 'video' | 'article'
  status?: 'active' | 'archived'
}

interface PinTableProps {
  currentPins: Pin[]
  selectedPins: string[]
  onSelectPin: (pinId: string) => void
  onSelectAll: () => void
  onPinClick: (pin: Pin, event: React.MouseEvent) => void
  getStatusBadge: (status: string, type: 'status' | 'type') => { className: string; text: string }
  activeColumnFilter: string | null
  columnFilters: Record<string, any>
  onFilterClick: (column: string) => void
  onColumnFilterChange: (column: string, value: any) => void
  getUniqueValues: (field: string) => string[]
}

export default function PinTable({
  currentPins,
  selectedPins,
  onSelectPin,
  onSelectAll,
  onPinClick,
  getStatusBadge,
  activeColumnFilter,
  columnFilters,
  onFilterClick,
  onColumnFilterChange,
  getUniqueValues
}: PinTableProps) {
  // Preload first 10 images for better perceived performance
  const firstImages = currentPins.slice(0, 10).map(p => p.image).filter(Boolean) as string[]
  useImagePreloader(firstImages)

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-visible">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 relative">
          <tr>
            <th className="px-2 py-1.5 text-left relative">
              <input
                type="checkbox"
                checked={selectedPins.length === currentPins.length && currentPins.length > 0}
                onChange={onSelectAll}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
            </th>
            <ColumnHeader 
              title="Pin" 
              column="title" 
              hasFilter={true} 
              filterType="text"
              columnFilters={columnFilters}
              activeColumnFilter={activeColumnFilter}
              onFilterClick={onFilterClick}
              onColumnFilterChange={onColumnFilterChange}
            />
            <ColumnHeader 
              title="Board" 
              column="board" 
              hasFilter={true} 
              filterType="select"
              options={getUniqueValues('board')}
              columnFilters={columnFilters}
              activeColumnFilter={activeColumnFilter}
              onFilterClick={onFilterClick}
              onColumnFilterChange={onColumnFilterChange}
            />
            <ColumnHeader 
              title="Owner" 
              column="owner" 
              hasFilter={true} 
              filterType="select"
              options={getUniqueValues('owner')}
              columnFilters={columnFilters}
              activeColumnFilter={activeColumnFilter}
              onFilterClick={onFilterClick}
              onColumnFilterChange={onColumnFilterChange}
            />
            <ColumnHeader 
              title="Type" 
              column="type" 
              hasFilter={true} 
              filterType="select"
              options={['image', 'video', 'article']}
              columnFilters={columnFilters}
              activeColumnFilter={activeColumnFilter}
              onFilterClick={onFilterClick}
              onColumnFilterChange={onColumnFilterChange}
            />
            <ColumnHeader 
              title="Likes" 
              column="likes" 
              hasFilter={true} 
              filterType="text"
              columnFilters={columnFilters}
              activeColumnFilter={activeColumnFilter}
              onFilterClick={onFilterClick}
              onColumnFilterChange={onColumnFilterChange}
            />
            <ColumnHeader 
              title="Comments" 
              column="comments" 
              hasFilter={true} 
              filterType="text"
              columnFilters={columnFilters}
              activeColumnFilter={activeColumnFilter}
              onFilterClick={onFilterClick}
              onColumnFilterChange={onColumnFilterChange}
            />
            <ColumnHeader 
              title="Repins" 
              column="repins" 
              hasFilter={true} 
              filterType="text"
              columnFilters={columnFilters}
              activeColumnFilter={activeColumnFilter}
              onFilterClick={onFilterClick}
              onColumnFilterChange={onColumnFilterChange}
            />
            <ColumnHeader 
              title="Created" 
              column="createdAt" 
              hasFilter={true} 
              filterType="date"
              columnFilters={columnFilters}
              activeColumnFilter={activeColumnFilter}
              onFilterClick={onFilterClick}
              onColumnFilterChange={onColumnFilterChange}
            />
            <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 relative">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {currentPins.map((pin) => (
            <tr 
              key={pin.id} 
              className={cn(
                "hover:bg-gray-50 cursor-pointer transition-colors",
                selectedPins.includes(pin.id) && "bg-red-50"
              )}
              onClick={(e) => onPinClick(pin, e)}
            >
              <td className="px-2 py-1.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedPins.includes(pin.id)}
                  onChange={() => onSelectPin(pin.id)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap">
                <div className="flex items-center space-x-3">
                  <PinImage src={pin.image} alt={pin.title} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {pin.title}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                {pin.board}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                {pin.owner}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap">
                {(() => {
                  const badge = getStatusBadge(pin.type || 'image', 'type')
                  return <span className={badge.className}>{badge.text}</span>
                })()}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                <div className="flex items-center space-x-1">
                  <Heart className="h-3 w-3 text-pink-500" />
                  <span>{pin.likes?.toLocaleString() || '0'}</span>
                </div>
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                <div className="flex items-center space-x-1">
                  <MessageCircle className="h-3 w-3 text-green-500" />
                  <span>{pin.comments?.toLocaleString() || '0'}</span>
                </div>
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                <div className="flex items-center space-x-1">
                  <Share2 className="h-3 w-3 text-blue-500" />
                  <span>{pin.repins?.toLocaleString() || '0'}</span>
                </div>
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-500">
                {format(new Date(pin.createdAt), 'MMM dd, yyyy')}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-500" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => onPinClick(pin, e)}
                    className="text-blue-600 hover:text-blue-900 transition-colors"
                    title="View pin details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                    title="Edit pin"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-900 transition-colors"
                    title="Delete pin"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
