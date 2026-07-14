import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { Footer } from '@/components/Footer'

export function LegalPage({
  title,
  lastUpdated,
  children,
}: {
  title: string
  lastUpdated: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--c-bg-base)]">
      <header className="border-b border-[var(--c-border)] bg-[var(--c-bg-1)]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/"><Logo className="text-[20px]" /></Link>
          <Link href="/" className="text-[13px] text-[var(--c-text-2)] hover:text-[var(--c-text)] transition-colors">
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="text-[28px] font-semibold text-[var(--c-text)]">{title}</h1>
          <p className="text-[13px] text-[var(--c-text-3)] mt-1.5 mb-10">Last updated: {lastUpdated}</p>

          <div className="flex flex-col gap-8 text-[14px] leading-relaxed text-[var(--c-text-2)] [&_h2]:text-[17px] [&_h2]:font-semibold [&_h2]:text-[var(--c-text)] [&_h2]:mb-2.5 [&_p]:mb-2.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1 [&_a]:text-[var(--c-purple)] [&_a]:hover:underline">
            {children}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
