import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '/',           priority: 1.0, changeFrequency: 'weekly' },
    { path: '/directory',  priority: 0.8, changeFrequency: 'daily' },
    { path: '/inspector',  priority: 0.7, changeFrequency: 'monthly' },
    { path: '/trace',      priority: 0.6, changeFrequency: 'monthly' },
    { path: '/tests',      priority: 0.6, changeFrequency: 'monthly' },
    { path: '/sessions',   priority: 0.6, changeFrequency: 'monthly' },
    { path: '/chat',       priority: 0.6, changeFrequency: 'monthly' },
    { path: '/oauth',      priority: 0.5, changeFrequency: 'monthly' },
    { path: '/analytics',  priority: 0.5, changeFrequency: 'monthly' },
    { path: '/team',       priority: 0.5, changeFrequency: 'monthly' },
    { path: '/bugs',       priority: 0.4, changeFrequency: 'monthly' },
  ]

  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))
}
