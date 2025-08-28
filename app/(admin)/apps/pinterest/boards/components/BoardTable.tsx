'use client'

import { format } from 'date-fns'
import { Eye, Edit, Trash } from 'lucide-react'
import { cn } from '@/lib/utils'
import ColumnHeader from './ColumnHeader'
import BoardImage from './BoardImage'
import { useImagePreloader } from '../hooks'

interface Board {
  id: string
  name: string
  description: string
  owner: string
  privacy: 'public' | 'private'
  pinCount: number
  followers: number
  image: string
  createdAt: string
  updatedAt: string
  tags: string[]
  isStarred: boolean
  selected?: boolean
  category?: string
  status?: 'active' | 'archived'
}

interface BoardTableProps {
  currentBoards: Board[]
  selectedBoards: string[]
  onSelectBoard: (boardId: string) => void
  onSelectAll: () => void
  onBoardClick: (board: Board, event: React.MouseEvent) => void
  getStatusBadge: (status: string, type: 'status' | 'privacy') => { className: string; text: string }
  activeColumnFilter: string | null
  columnFilters: Record<string, any>
  onFilterClick: (column: string) => void
  onColumnFilterChange: (column: string, value: any) => void
  getUniqueValues: (field: string) => string[]
}

export default function BoardTable({
  currentBoards,
  selectedBoards,
  onSelectBoard,
  onSelectAll,
  onBoardClick,
  getStatusBadge,
  activeColumnFilter,
  columnFilters,
  onFilterClick,
  onColumnFilterChange,
  getUniqueValues
}: BoardTableProps) {
  // Preload first 10 images for better perceived performance
  const firstImages = currentBoards.slice(0, 10).map(b => b.image).filter(Boolean) as string[]
  useImagePreloader(firstImages)

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-visible">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 relative">
          <tr>
            <th className="px-2 py-1.5 text-left relative">
              <input
                type="checkbox"
                checked={selectedBoards.length === currentBoards.length && currentBoards.length > 0}
                onChange={onSelectAll}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
            </th>
            <ColumnHeader 
              title="Board" 
              column="name" 
              hasFilter={true} 
              filterType="text"
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
              title="Privacy" 
              column="privacy" 
              hasFilter={true} 
              filterType="select"
              options={['public', 'private']}
              columnFilters={columnFilters}
              activeColumnFilter={activeColumnFilter}
              onFilterClick={onFilterClick}
              onColumnFilterChange={onColumnFilterChange}
            />
            <ColumnHeader 
              title="Pins" 
              column="pinCount" 
              hasFilter={true} 
              filterType="text"
              columnFilters={columnFilters}
              activeColumnFilter={activeColumnFilter}
              onFilterClick={onFilterClick}
              onColumnFilterChange={onColumnFilterChange}
            />
            <ColumnHeader 
              title="Followers" 
              column="followers" 
              hasFilter={true} 
              filterType="text"
              columnFilters={columnFilters}
              activeColumnFilter={activeColumnFilter}
              onFilterClick={onFilterClick}
              onColumnFilterChange={onColumnFilterChange}
            />
            <ColumnHeader 
              title="Category" 
              column="category" 
              hasFilter={true} 
              filterType="select"
              options={getUniqueValues('category')}
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
          {currentBoards.map((board) => (
            <tr 
              key={board.id} 
              className={cn(
                "hover:bg-gray-50 cursor-pointer transition-colors",
                selectedBoards.includes(board.id) && "bg-red-50"
              )}
              onClick={(e) => onBoardClick(board, e)}
            >
              <td className="px-2 py-1.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedBoards.includes(board.id)}
                  onChange={() => onSelectBoard(board.id)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap">
                <div className="flex items-center space-x-3">
                  <BoardImage src={board.image} alt={board.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {board.name}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                {board.owner}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap">
                {(() => {
                  const badge = getStatusBadge(board.privacy, 'privacy')
                  return <span className={badge.className}>{badge.text}</span>
                })()}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                {board.pinCount?.toLocaleString() || '0'}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                {board.followers?.toLocaleString() || '0'}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                {board.category || 'Uncategorized'}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-500">
                {format(new Date(board.createdAt), 'MMM dd, yyyy')}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-500" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => onBoardClick(board, e)}
                    className="text-blue-600 hover:text-blue-900 transition-colors"
                    title="View board details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                    title="Edit board"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-900 transition-colors"
                    title="Delete board"
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
