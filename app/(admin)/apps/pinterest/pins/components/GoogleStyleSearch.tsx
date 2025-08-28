'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Clock, TrendingUp, Package, Building, Folder, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SearchSuggestion, SearchHistory } from '../utils/searchSuggestions'

interface GoogleStyleSearchProps {
  value: string
  onChange: (value: string) => void
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
  suggestions: SearchSuggestion[]
  isLoading?: boolean
  showSuggestions?: boolean
  onSuggestionClick?: (suggestion: SearchSuggestion) => void
  onClearHistory?: () => void
}

const getSuggestionIcon = (type: SearchSuggestion['type']) => {
  switch (type) {
    case 'pin':
      return <Package className="h-4 w-4" />
    case 'board':
      return <Building className="h-4 w-4" />
    case 'owner':
      return <Folder className="h-4 w-4" />
    case 'tag':
      return <Tag className="h-4 w-4" />
    case 'history':
      return <Clock className="h-4 w-4" />
    default:
      return <Search className="h-4 w-4" />
  }
}

const getSuggestionText = (suggestion: SearchSuggestion) => {
  switch (suggestion.type) {
    case 'pin':
      return 'Pin'
    case 'board':
      return 'Board'
    case 'owner':
      return 'Owner'
    case 'tag':
      return 'Tag'
    case 'history':
      return suggestion.count ? `${suggestion.count} results` : 'Recent search'
    default:
      return ''
  }
}

export default function GoogleStyleSearch({
  value,
  onChange,
  onSearch,
  placeholder = "Search pins...",
  className = "",
  suggestions,
  isLoading = false,
  showSuggestions = false,
  onSuggestionClick,
  onClearHistory
}: GoogleStyleSearchProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          onSuggestionClick?.(suggestions[selectedIndex])
        } else {
          onSearch(value)
        }
        break
      case 'Escape':
        setIsFocused(false)
        setSelectedIndex(-1)
        break
    }
  }, [showSuggestions, suggestions, selectedIndex, onSuggestionClick, onSearch, value])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setSelectedIndex(-1)
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onChange(suggestion.text)
    onSuggestionClick?.(suggestion)
    setIsFocused(false)
    setSelectedIndex(-1)
  }

  // Handle clear
  const handleClear = () => {
    onChange('')
    setIsFocused(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1)
  }, [suggestions])

  // Auto-focus input when component mounts
  useEffect(() => {
    if (isFocused) {
      inputRef.current?.focus()
    }
  }, [isFocused])

  return (
    <div className={cn("relative w-full", className)}>
      {/* Search Input */}
      <div className={cn(
        "relative flex items-center w-full h-10",
        "border border-gray-300 rounded-md",
        "bg-white shadow-sm",
        "transition-all duration-200",
        isFocused && "border-blue-500 shadow-md ring-2 ring-blue-100",
        isLoading && "border-purple-500"
      )}>
        {/* Search Icon */}
        <div className="pl-3 pr-2">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay to allow suggestion clicks
            setTimeout(() => setIsFocused(false), 200)
          }}
          placeholder={placeholder}
          className={cn(
            "flex-1 py-2 px-2 text-gray-900 text-sm",
            "placeholder-gray-500",
            "focus:outline-none",
            "bg-transparent"
          )}
        />

        {/* Clear Button */}
        {value && (
          <button
            onClick={handleClear}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Search Button */}
        <button
          onClick={() => onSearch(value)}
          className={cn(
            "px-4 py-2 text-white font-medium text-sm",
            "bg-blue-500 hover:bg-blue-600",
            "rounded-r-md transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            "h-full"
          )}
        >
          Search
        </button>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && isFocused && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className={cn(
            "absolute top-full left-0 right-0 mt-1",
            "bg-white border border-gray-200 rounded-lg shadow-lg",
            "max-h-96 overflow-y-auto z-50"
          )}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className={cn(
                "flex items-center px-4 py-3 cursor-pointer",
                "hover:bg-gray-50 transition-colors",
                selectedIndex === index && "bg-blue-50 border-l-4 border-blue-500"
              )}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mr-3 text-gray-400">
                {getSuggestionIcon(suggestion.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="text-gray-900 font-medium truncate">
                  {suggestion.text}
                </div>
                <div className="text-sm text-gray-500 flex items-center">
                  {getSuggestionText(suggestion)}
                  {suggestion.count && (
                    <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                      {suggestion.count}
                    </span>
                  )}
                </div>
              </div>

              {/* Type indicator */}
              {suggestion.type === 'history' && (
                <div className="flex-shrink-0 ml-2">
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                </div>
              )}
            </div>
          ))}

          {/* Clear History Button */}
          {suggestions.some(s => s.type === 'history') && onClearHistory && (
            <div className="border-t border-gray-200 px-4 py-2">
              <button
                onClick={onClearHistory}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear search history
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
