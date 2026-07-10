import type { Metadata } from 'next'
import './globals.css'
import VisitTracker from '@/components/VisitTracker'
import { ElectronMacPatch } from '@/components/ElectronMacPatch'
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/seo'

const DEFAULT_TITLE = `${SITE_NAME} — MCP Server Inspector, Test Runner & CI/CD`

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'MCP', 'Model Context Protocol', 'MCP inspector', 'MCP server testing',
    'MCP debugging', 'JSON-RPC trace', 'MCP test suite', 'MCP CI/CD',
    'Claude MCP tools', 'MCP directory',
  ],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SITE_NAME,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web, macOS, Windows',
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        <ElectronMacPatch />
        <VisitTracker />
        {children}
      </body>
    </html>
  )
}
