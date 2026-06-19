'use client'
import { useState } from 'react'
import type { RegisteredUser } from '@/hooks/useRegisteredUser'

interface Props {
  onSignedIn: (user: RegisteredUser) => void
  onClose: () => void
}

type Step = 'form' | 'submitting' | 'error' | 'forgot' | 'forgot-submitting' | 'forgot-sent'

export function SignInModal({ onSignedIn, onClose }: Props) {
  const [step, setStep]         = useState<Step>('form')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [errMsg, setErrMsg]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) return
    setStep('submitting')

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Sign in failed')
      onSignedIn({ email: data.user.email, name: data.user.name ?? undefined })
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Sign in failed')
      setStep('error')
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    if (!forgotEmail.trim()) return
    setStep('forgot-submitting')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      })
      if (!res.ok) throw new Error('Request failed')
      setStep('forgot-sent')
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Request failed')
      setStep('forgot-submitting') // reuse submitting state to show error inline
      setStep('forgot')
    }
  }

  function openForgot() {
    setForgotEmail(email)
    setErrMsg('')
    setStep('forgot')
  }

  const isForgotFlow = step === 'forgot' || step === 'forgot-submitting' || step === 'forgot-sent'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[var(--c-bg-1)] border border-[var(--c-border)] rounded-xl shadow-2xl w-full max-w-sm mx-4">

        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[var(--c-border)]">
          <div>
            <h2 className="text-[17px] font-semibold text-[var(--c-text)]">
              {isForgotFlow ? 'Reset password' : 'Sign in'}
            </h2>
            <p className="text-[14px] text-[var(--c-text-2)] mt-0.5">
              {isForgotFlow
                ? "We'll send a reset link to your email."
                : 'Enter your email and password.'}
            </p>
          </div>
          <button onClick={onClose} className="text-[var(--c-text-3)] hover:text-[var(--c-text)] transition-colors mt-0.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13"/>
            </svg>
          </button>
        </div>

        {/* ── Sign-in form ── */}
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
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-medium text-[var(--c-text-2)] uppercase tracking-wider">
                  Password <span className="text-[var(--c-red)]">*</span>
                </label>
                <button
                  type="button"
                  onClick={openForgot}
                  className="text-[12px] text-[var(--c-purple-2)] hover:text-[var(--c-purple)] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                disabled={step === 'submitting'}
                className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-[15px]
                           text-[var(--c-text)] placeholder-[var(--c-text-3)] outline-none focus:border-[var(--c-purple-2)]
                           transition-colors disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={!email.trim() || !password || step === 'submitting'}
              className="mt-1 w-full py-2 rounded-lg text-[15px] font-semibold bg-[var(--c-purple-2)] text-white
                         hover:bg-[var(--c-purple)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors
                         flex items-center justify-center gap-2"
            >
              {step === 'submitting' ? <><span className="spinner" /> Signing in…</> : 'Sign in'}
            </button>
          </form>
        )}

        {/* ── Sign-in error ── */}
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

        {/* ── Forgot password form ── */}
        {(step === 'forgot' || step === 'forgot-submitting') && (
          <form onSubmit={handleForgot} className="px-6 py-5 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[var(--c-text-2)] uppercase tracking-wider">
                Email <span className="text-[var(--c-red)]">*</span>
              </label>
              <input
                autoFocus
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={step === 'forgot-submitting'}
                className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-[15px]
                           text-[var(--c-text)] placeholder-[var(--c-text-3)] outline-none focus:border-[var(--c-purple-2)]
                           transition-colors disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={!forgotEmail.trim() || step === 'forgot-submitting'}
              className="mt-1 w-full py-2 rounded-lg text-[15px] font-semibold bg-[var(--c-purple-2)] text-white
                         hover:bg-[var(--c-purple)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors
                         flex items-center justify-center gap-2"
            >
              {step === 'forgot-submitting' ? <><span className="spinner" /> Sending…</> : 'Send reset link'}
            </button>

            <button
              type="button"
              onClick={() => setStep('form')}
              className="text-[13px] text-[var(--c-text-3)] hover:text-[var(--c-text-2)] transition-colors text-center"
            >
              Back to sign in
            </button>
          </form>
        )}

        {/* ── Forgot password sent ── */}
        {step === 'forgot-sent' && (
          <div className="px-6 py-6 flex flex-col gap-4">
            <p className="text-[14px] text-[var(--c-text-2)]">
              If an account exists for <strong className="text-[var(--c-text)]">{forgotEmail}</strong>, a reset link has been sent.
              Check your inbox and follow the link to set a new password.
            </p>
            <button
              onClick={() => setStep('form')}
              className="w-full py-2 rounded-lg text-[14px] font-medium bg-[var(--c-bg-3)] text-[var(--c-text-2)]
                         hover:bg-[var(--c-border)] transition-colors"
            >
              Back to sign in
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
