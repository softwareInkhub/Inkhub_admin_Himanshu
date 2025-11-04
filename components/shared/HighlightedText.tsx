import React from 'react'

interface HighlightedTextProps {
  text: string
  highlight?: string
  className?: string
}

export default function HighlightedText({ text, highlight, className = '' }: HighlightedTextProps) {
  if (!text) {
    return <span className={className}></span>
  }

  // Handle HTML highlighted text from Algolia (e.g., "<em>Love</em> & Death Tattoo")
  if (text.includes('<em>') && text.includes('</em>')) {
    // Replace <em> tags with styled spans for better control
    const styledText = text.replace(/<em>/g, '<mark class="bg-yellow-200 text-yellow-900 px-1 rounded">').replace(/<\/em>/g, '</mark>')
    return (
      <span 
        className={className}
        dangerouslySetInnerHTML={{ __html: styledText }}
      />
    )
  }

  // Handle regular text highlighting
  if (highlight) {
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'))
    
    return (
      <span className={className}>
        {parts.map((part, index) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    )
  }

  // If no highlighting needed, just return the text
  return <span className={className}>{text}</span>
}