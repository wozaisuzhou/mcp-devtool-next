import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'flashman',
  description: 'Inspector · Chat · Trace · OAuth for MCP servers',
}

const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('flashman_theme');
    if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
  } catch(e) {}
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
