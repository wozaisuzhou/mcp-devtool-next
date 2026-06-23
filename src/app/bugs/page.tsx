'use client'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { Logo } from '@/components/Logo'
import { useRegisteredUser } from '@/hooks/useRegisteredUser'

const CATEGORIES = [
  { value: 'inspector', label: 'Inspector' },
  { value: 'chat',      label: 'Chat' },
  { value: 'trace',     label: 'Trace' },
  { value: 'sessions',  label: 'Sessions' },
  { value: 'oauth',     label: 'OAuth' },
  { value: 'other',     label: 'Other' },
]

const LEVELS = [
  { value: 'low',    bugLabel: 'Low',    ideaLabel: 'Nice to have' },
  { value: 'medium', bugLabel: 'Medium', ideaLabel: 'Would improve workflow' },
  { value: 'high',   bugLabel: 'High',   ideaLabel: 'Really needed' },
]

function makeCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1
  const b = Math.floor(Math.random() * 9) + 1
  return { a, b, answer: a + b }
}

type FeedbackType = 'bug' | 'idea'
type Status = 'idle' | 'submitting' | 'done' | 'error'

export default function FeedbackPage() {
  const { user, ready } = useRegisteredUser()

  const [type, setType]         = useState<FeedbackType>('bug')
  const [title, setTitle]       = useState('')
  const [description, setDesc]  = useState('')
  const [category, setCategory] = useState('other')
  const [severity, setSeverity] = useState('medium')
  const [steps, setSteps]       = useState('')
  const [email, setEmail]       = useState('')
  const [captchaInput, setCaptchaInput] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus]     = useState<Status>('idle')
  const [reportId, setReportId] = useState('')
  const [errMsg, setErrMsg]     = useState('')

  const captcha = useMemo(() => makeCaptcha(), [])
  const isBug = type === 'bug'
  const isSignedIn = ready && !!user
  const resolvedEmail = isSignedIn ? user!.email : email

  const captchaValid = isSignedIn || parseInt(captchaInput, 10) === captcha.answer

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !description.trim() || !resolvedEmail.trim()) return
    if (!captchaValid) {
      setErrMsg(`Incorrect answer — ${captcha.a} + ${captcha.b} = ?`)
      setStatus('error')
      return
    }
    setStatus('submitting')
    try {
      const res = await fetch('/api/bugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title, description, category, severity, steps, email: resolvedEmail, honeypot }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      setReportId(data.id)
      setStatus('done')
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Submission failed')
      setStatus('error')
    }
  }

  function handleTypeChange(t: FeedbackType) {
    setType(t)
    setSeverity('medium')
    setSteps('')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--c-bg-base)]">

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-[var(--c-border)] bg-[var(--c-bg-base)]/90 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Logo className="text-[18px]" />
          </Link>
          <Link href="/inspector" className="text-[13px] text-[var(--c-text-3)] hover:text-[var(--c-text)] transition-colors">
            Back to app →
          </Link>
        </div>
      </header>

      <main className="flex-1 py-16 px-6">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--c-purple)]">Feedback</span>
            <h1 className="text-[28px] font-bold text-[var(--c-text)] tracking-tight mt-1 mb-2">
              {isBug ? 'Report a bug' : 'Share an idea'}
            </h1>
            <p className="text-[14px] text-[var(--c-text-3)]">
              {isBug
                ? 'Found something broken? Tell us what happened and we\'ll look into it.'
                : 'Have a feature request or suggestion? We\'d love to hear it.'}
            </p>
          </div>

          {/* Type toggle */}
          <div className="flex gap-1 p-1 rounded-lg bg-[var(--c-bg-2)] border border-[var(--c-border)] mb-8 w-fit">
            <button
              type="button"
              onClick={() => handleTypeChange('bug')}
              className={`px-4 py-1.5 rounded-md text-[14px] font-medium transition-colors ${
                isBug
                  ? 'bg-[var(--c-bg-1)] text-[var(--c-text)] shadow-sm border border-[var(--c-border)]'
                  : 'text-[var(--c-text-3)] hover:text-[var(--c-text-2)]'
              }`}
            >
              Bug report
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('idea')}
              className={`px-4 py-1.5 rounded-md text-[14px] font-medium transition-colors ${
                !isBug
                  ? 'bg-[var(--c-bg-1)] text-[var(--c-text)] shadow-sm border border-[var(--c-border)]'
                  : 'text-[var(--c-text-3)] hover:text-[var(--c-text-2)]'
              }`}
            >
              Feature idea
            </button>
          </div>

          {/* show submitting identity once auth state is known */}
          {ready && isSignedIn && status !== 'done' && (
            <p className="text-[13px] text-[var(--c-text-3)] mb-6">
              Submitting as <span className="text-[var(--c-text-2)] font-medium">{user!.email}</span>
            </p>
          )}

          {status === 'done' ? (
            <div className="bg-[var(--c-bg-1)] border border-[var(--c-border)] rounded-xl p-10 text-center flex flex-col items-center gap-5">
              <div className="w-12 h-12 rounded-full bg-[var(--c-green-bg)] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--c-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 10l5 5 9-9"/>
                </svg>
              </div>
              <div>
                <p className="text-[18px] font-semibold text-[var(--c-text)]">
                  {isBug ? 'Bug report submitted' : 'Idea submitted'}
                </p>
                <p className="text-[14px] text-[var(--c-text-2)] mt-1">
                  {isBug
                    ? "Thanks — we'll investigate and follow up if needed."
                    : "Thanks for the suggestion! We'll consider it for a future update."}
                </p>
                <p className="text-[12px] text-[var(--c-text-3)] font-mono mt-3">{reportId}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setTitle(''); setDesc(''); setSteps(''); setStatus('idle') }}
                  className="px-4 py-2 rounded-lg text-[14px] font-medium bg-[var(--c-bg-3)] text-[var(--c-text-2)]
                             hover:bg-[var(--c-border)] transition-colors"
                >
                  Submit another
                </button>
                <Link
                  href="/inspector"
                  className="px-4 py-2 rounded-lg text-[14px] font-semibold bg-[var(--c-purple-2)] text-white
                             hover:bg-[var(--c-purple)] transition-colors"
                >
                  Back to app
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">

              {/* Honeypot — invisible, filled only by bots */}
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}
              />

              {/* Email — only for guests */}
              {!isSignedIn && (
                <Field label="Your email" required>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={status === 'submitting'}
                    className={inputCls}
                  />
                </Field>
              )}

              {/* Title */}
              <Field label="Title" required>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isBug ? 'Brief summary of the issue' : 'One-line description of your idea'}
                  disabled={status === 'submitting'}
                  className={inputCls}
                />
              </Field>

              {/* Area + Severity row */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Area">
                  <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={status === 'submitting'} className={inputCls}>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label={isBug ? 'Severity' : 'Priority'}>
                  <select value={severity} onChange={(e) => setSeverity(e.target.value)} disabled={status === 'submitting'} className={inputCls}>
                    {LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>
                        {isBug ? l.bugLabel : l.ideaLabel}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Description */}
              <Field label={isBug ? 'What happened?' : 'Describe your idea'} required>
                <textarea
                  value={description}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder={isBug
                    ? 'What did you expect vs what actually happened?'
                    : 'What problem does this solve? How would it work?'}
                  rows={5}
                  disabled={status === 'submitting'}
                  className={`${inputCls} resize-none`}
                />
              </Field>

              {/* Steps / Context */}
              <Field label={isBug ? 'Steps to reproduce' : 'Use case or context'} hint="optional">
                <textarea
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder={isBug
                    ? '1. Open Inspector\n2. Connect to a server\n3. Click …'
                    : 'What workflow or scenario prompted this idea?'}
                  rows={4}
                  disabled={status === 'submitting'}
                  className={`${inputCls} resize-none`}
                />
              </Field>

              {/* Math CAPTCHA — only for guests */}
              {!isSignedIn && (
                <Field label={`Spam check: What is ${captcha.a} + ${captcha.b}?`} required>
                  <input
                    type="number"
                    value={captchaInput}
                    onChange={(e) => { setCaptchaInput(e.target.value); if (status === 'error') setStatus('idle') }}
                    placeholder="Enter the answer"
                    disabled={status === 'submitting'}
                    className={inputCls}
                  />
                </Field>
              )}

              {status === 'error' && (
                <p className="text-[14px] text-[var(--c-red)] bg-[var(--c-red-bg)] border border-[var(--c-red-bg-2)]
                               rounded-lg px-3 py-2">
                  {errMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={!title.trim() || !description.trim() || !resolvedEmail.trim() || status === 'submitting'}
                className="self-start px-6 py-2.5 rounded-lg text-[15px] font-semibold bg-[var(--c-purple-2)] text-white
                           hover:bg-[var(--c-purple)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors
                           flex items-center gap-2"
              >
                {status === 'submitting'
                  ? <><span className="spinner" /> Submitting…</>
                  : isBug ? 'Submit bug report' : 'Submit idea'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}

function Field({ label, hint, required, children }: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-[var(--c-text-2)]">
        {label}
        {required && <span className="text-[var(--c-red)] ml-0.5">*</span>}
        {hint && <span className="text-[var(--c-text-3)] font-normal ml-1.5">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = `w-full bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-[14px]
  text-[var(--c-text)] placeholder-[var(--c-text-3)] outline-none focus:border-[var(--c-purple-2)]
  disabled:opacity-50 transition-colors`
