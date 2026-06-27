import type { Metadata } from 'next'
import './globals.css'
import VisitTracker from '@/components/VisitTracker'

export const metadata: Metadata = {
  title: 'Bubble MCP',
  description: 'Inspector · Chat · Trace · OAuth for MCP servers',
}

const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('flashman_theme');
    if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  } catch(e) {}
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <VisitTracker />
        {children}
      </body>
    </html>
  )
}
