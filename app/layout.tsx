import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'

// Use system fonts to avoid Google Fonts connectivity issues
const fontClass = 'font-sans'

export const metadata: Metadata = {
  title: 'INKHUB Admin',
  description: 'High-performance admin panel for managing large datasets',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${fontClass} h-full antialiased`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
} 