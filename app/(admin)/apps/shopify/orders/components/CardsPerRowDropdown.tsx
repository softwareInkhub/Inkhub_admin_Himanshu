'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Grid } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CardsPerRowDropdownProps {
  value: number
  onChange: (value: number) => void
  className?: string
}

export default function CardsPerRowDropdown({ value, onChange, className }: CardsPerRowDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const options = [3, 4, 5, 6, 7, 8]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOptionClick = (option: number) => {
    onChange(option)
    setIsOpen(false)
  }

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-700',
          'bg-white border border-gray-300 rounded-md hover:bg-gray-50',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'transition-colors duration-200'
        )}
        aria-label="Select cards per row"
      >
        <Grid className="h-4 w-4 text-gray-500" />
        <span>{value} per row</span>
        <ChevronDown className={cn(
          'h-4 w-4 text-gray-400 transition-transform duration-200',
          isOpen ? 'rotate-180' : ''
        )} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-[10000]">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => handleOptionClick(option)}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors',
                  'focus:outline-none focus:bg-gray-100',
                  value === option ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                )}
              >
                {option} per row
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
