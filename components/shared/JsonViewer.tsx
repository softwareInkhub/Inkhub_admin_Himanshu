'use client'

import React, { useState } from 'react'
import { ChevronRight, ChevronDown, Copy, Check } from 'lucide-react'

interface JsonViewerProps {
  data: any
  name?: string
  collapsed?: number
  level?: number
}

const JsonViewer: React.FC<JsonViewerProps> = ({ 
  data, 
  name, 
  collapsed = 2, 
  level = 0 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(level >= collapsed)
  const [copied, setCopied] = useState(false)

  const handleCopy = async (value: any) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(value, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const getValueType = (value: any): string => {
    if (value === null) return 'null'
    if (Array.isArray(value)) return 'array'
    return typeof value
  }

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'string': return 'text-green-600'
      case 'number': return 'text-blue-600'
      case 'boolean': return 'text-purple-600'
      case 'null': return 'text-gray-500'
      case 'undefined': return 'text-gray-500'
      default: return 'text-gray-800'
    }
  }

  const renderValue = (value: any, key?: string | number, currentLevel: number = level): React.ReactNode => {
    const valueType = getValueType(value)
    const indent = currentLevel * 16

    if (value === null) {
      return (
        <span className="text-gray-500 italic">null</span>
      )
    }

    if (valueType === 'string') {
      return (
        <span className={getTypeColor(valueType)}>
          "{value}"
        </span>
      )
    }

    if (valueType === 'number' || valueType === 'boolean') {
      return (
        <span className={getTypeColor(valueType)}>
          {String(value)}
        </span>
      )
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-600">[]</span>
      }

      return (
        <div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center text-gray-600 hover:text-gray-800 text-sm"
            >
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              <span className="text-gray-600">[{value.length}]</span>
            </button>
            <button
              onClick={() => handleCopy(value)}
              className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Copy array"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
          {!isCollapsed && (
            <div className="ml-4 border-l border-gray-200 pl-2">
              {value.map((item, index) => (
                <div key={index} className="py-1">
                  <span className="text-gray-500 text-sm mr-2">{index}:</span>
                  <JsonViewer
                    data={item}
                    collapsed={collapsed}
                    level={currentLevel + 1}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    if (valueType === 'object') {
      const keys = Object.keys(value)
      if (keys.length === 0) {
        return <span className="text-gray-600">{'{}'}</span>
      }

      return (
        <div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center text-gray-600 hover:text-gray-800 text-sm"
            >
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              <span className="text-gray-600">{`{${keys.length}}`}</span>
            </button>
            <button
              onClick={() => handleCopy(value)}
              className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Copy object"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
          {!isCollapsed && (
            <div className="ml-4 border-l border-gray-200 pl-2">
              {keys.map((objKey) => (
                <div key={objKey} className="py-1">
                  <span className="text-blue-800 font-medium mr-2">"{objKey}":</span>
                  <JsonViewer
                    data={value[objKey]}
                    collapsed={collapsed}
                    level={currentLevel + 1}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    return (
      <span className={getTypeColor(valueType)}>
        {String(value)}
      </span>
    )
  }

  return (
    <div className="font-mono text-sm">
      {name && (
        <div className="text-blue-800 font-medium mb-1">"{name}":</div>
      )}
      {renderValue(data)}
    </div>
  )
}

export default JsonViewer
