'use client'

import React from 'react'
import dynamic from 'next/dynamic'
const ReactJson = dynamic(() => import('react-json-view'), { ssr: false })
import { X, Clipboard } from 'lucide-react'

interface JsonViewerModalProps {
  isOpen: boolean
  title: string
  data: any
  onClose: () => void
}

export default function JsonViewerModal({ isOpen, title, data, onClose }: JsonViewerModalProps) {
  if (!isOpen) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      // Optional: toast or temporary visual feedback could be added here
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-[95vw] md:w-[80vw] lg:w-[70vw] max-h-[85vh] rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm md:text-base font-semibold text-gray-900 truncate">{title}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 hover:border-gray-400 transition-colors"
              title="Copy JSON"
            >
              <Clipboard className="h-4 w-4" />
              Copy JSON
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-3 overflow-auto" style={{ maxHeight: 'calc(85vh - 48px)' }}>
          <ReactJson
            src={data || {}}
            name={false}
            collapsed={2}
            enableClipboard={false}
            displayDataTypes={false}
            displayObjectSize={false}
            theme={{
              base00: '#ffffff',
              base01: '#f5f7fb',
              base02: '#e5e7eb',
              base03: '#9ca3af',
              base04: '#111827',
              base05: '#1f2937',
              base06: '#374151',
              base07: '#111827',
              base08: '#1f2937',
              base09: '#2563eb',
              base0A: '#10b981',
              base0B: '#111827',
              base0C: '#4b5563',
              base0D: '#2563eb',
              base0E: '#9333ea',
              base0F: '#d97706',
            }}
            style={{ fontSize: 12 }}
          />
        </div>
      </div>
    </div>
  )
}


