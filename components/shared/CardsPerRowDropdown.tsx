'use client'

import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const options = [2, 3, 4, 5, 6, 7, 8]

  // Update dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right + window.scrollX - 192, // 192px = w-48 (12rem)
        width: rect.width
      })
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
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

  const dropdownMenu = isOpen ? (
    <div 
      ref={dropdownRef}
      className="fixed w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999]"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
      }}
    >
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
  ) : null

  return (
    <>
      <div className={cn('relative', className)}>
        <button 
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Grid className="h-4 w-4" />
          <span className="text-sm font-medium">{value} per row</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </button>
      </div>
      
      {typeof document !== 'undefined' && dropdownMenu && createPortal(
        dropdownMenu,
        document.body
      )}
    </>
  )
}