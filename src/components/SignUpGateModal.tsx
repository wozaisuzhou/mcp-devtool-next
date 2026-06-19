'use client'
import { useState } from 'react'
import type { RegisteredUser } from '@/hooks/useRegisteredUser'

interface Props {
  onSignedUp: (user: RegisteredUser) => void
  onClose: () => void
}

type Step = 'form' | 'submitting' | 'error'

export function SignUpGateModal({ onSignedUp, onClose }: Props) {
  const [step, setStep]         = useState<Step>('form')
  const [email, setEmail]       = useState('')
  const [name, setName]         = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [errMsg, setErrMsg]     = useState('')

  const passwordMismatch = confirm.length > 0 && password !== confirm

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password || password !== confirm) return
    setStep('submitting')

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Sign up failed')
      onSignedUp({ email: data.user.email, name: data.user.name ?? undefined })
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Sign up failed')
      setStep('error')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[var(--c-bg-1)] border border-[var(--c-border)] rounded-xl shadow-2xl w-full max-w-sm mx-4">

        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[var(--c-border)]">
          <div>
            <h2 className="text-[17px] font-semibold text-[var(--c-text)]">Sign up to save sessions</h2>
            <p className="text-[14px] text-[var(--c-text-2)] mt-0.5">
              A free account lets you save and revisit snapshots.
            </p>
          </div>
          <button onClick={onClose} className="text-[var(--c-text-3)] hover:text-[var(--c-text)] transition-colors mt-0.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13"/>
            </svg>
          </button>
        </div>

        {(step === 'form' || step === 'submitting') && (
          <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[var(--c-text-2)] uppercase tracking-wider">
                Email <span className="text-[var(--c-red)]">*</span>
              </label>
              <input
                autoFocus
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={step === 'submitting'}
                className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-[15px]
                           text-[var(--c-text)] placeholder-[var(--c-text-3)] outline-none focus:border-[var(--c-purple-2)]
                           transition-colors disabled:opacity-50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[var(--c-text-2)] uppercase tracking-wider">
                Name <span className="text-[var(--c-text-3)] normal-case font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                disabled={step === 'submitting'}
                className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-[15px]
                           text-[var(--c-text)] placeholder-[var(--c-text-3)] outline-none focus:border-[var(--c-purple-2)]
                           transition-colors disabled:opacity-50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[var(--c-text-2)] uppercase tracking-wider">
                Password <span className="text-[var(--c-red)]">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                disabled={step === 'submitting'}
                className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-[15px]
                           text-[var(--c-text)] placeholder-[var(--c-text-3)] outline-none focus:border-[var(--c-purple-2)]
                           transition-colors disabled:opacity-50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[var(--c-text-2)] uppercase tracking-wider">
                Confirm password <span className="text-[var(--c-red)]">*</span>
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                disabled={step === 'submitting'}
                className={`bg-[var(--c-bg-2)] border rounded-lg px-3 py-2 text-[15px]
                           text-[var(--c-text)] placeholder-[var(--c-text-3)] outline-none
                           transition-colors disabled:opacity-50
                           ${passwordMismatch ? 'border-[var(--c-red)]' : 'border-[var(--c-border)] focus:border-[var(--c-purple-2)]'}`}
              />
              {passwordMismatch && (
                <span className="text-[13px] text-[var(--c-red)]">Passwords do not match</span>
              )}
            </div>

            <button
              type="submit"
              disabled={!email.trim() || !password || password !== confirm || step === 'submitting'}
              className="mt-1 w-full py-2 rounded-lg text-[15px] font-semibold bg-[var(--c-purple-2)] text-white
                         hover:bg-[var(--c-purple)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors
                         flex items-center justify-center gap-2"
            >
              {step === 'submitting' ? <><span className="spinner" /> Creating account…</> : 'Create free account'}
            </button>
          </form>
        )}

        {step === 'error' && (
          <div className="px-6 py-6 flex flex-col gap-4">
            <p className="text-[14px] text-[var(--c-red)] bg-[var(--c-red-bg-4)] border border-[var(--c-red-border)] rounded-lg px-3 py-2">
              {errMsg}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('form')}
                className="flex-1 py-2 rounded-lg text-[14px] font-medium bg-[var(--c-bg-3)] text-[var(--c-text-2)]
                           hover:bg-[var(--c-border)] transition-colors"
              >
                Try again
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-[14px] font-medium bg-[var(--c-bg-3)] text-[var(--c-text-2)]
                           hover:bg-[var(--c-border)] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
