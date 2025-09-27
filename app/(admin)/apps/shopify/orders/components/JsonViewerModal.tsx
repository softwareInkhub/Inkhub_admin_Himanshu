'use client'

import React from 'react'
import JsonViewer from '@/components/shared/JsonViewer'
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
          <JsonViewer
            data={data || {}}
            collapsed={2}
          />
        </div>
      </div>
    </div>
  )
}


