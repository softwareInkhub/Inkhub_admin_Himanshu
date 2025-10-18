'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Grid } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CardsPerRowDropdownProps {
  value: number
  onChange: (count: number) => void
  className?: string
}

export default function CardsPerRowDropdown({
  value,
  onChange,
  className
}: CardsPerRowDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const options = [2, 3, 4, 5, 6, 7, 8]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleOptionClick = (option: number) => {
    onChange(option)
    setIsOpen(false)
  }

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Grid className="h-4 w-4" />
        <span className="text-sm font-medium">{value} per row</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => handleOptionClick(option)}
                className={cn(
                  'flex items-center space-x-3 w-full px-4 py-2 text-sm hover:bg-gray-50',
                  value === option && 'bg-blue-50 text-blue-700'
                )}
              >
                <Grid className="h-4 w-4" />
                <span>{option} per row</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
