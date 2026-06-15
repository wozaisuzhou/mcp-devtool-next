import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'flashman',
  description: 'Inspector · Chat · Trace · OAuth for MCP servers',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
