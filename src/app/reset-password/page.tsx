'use client'
import Image from 'next/image'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Footer } from '@/components/Footer'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [step, setStep]         = useState<'form' | 'submitting' | 'success' | 'error'>('form')
  const [errMsg, setErrMsg]     = useState('')

  useEffect(() => {
    if (!token) {
      setErrMsg('No reset token provided.')
      setStep('error')
    }
  }, [token])

  const passwordMismatch = confirm.length > 0 && password !== confirm

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password || password !== confirm || password.length < 8) return
    setStep('submitting')

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Reset failed')
      setStep('success')
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Reset failed')
      setStep('error')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--c-bg-base)]">
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="bg-[var(--c-bg-1)] border border-[var(--c-border)] rounded-xl shadow-2xl w-full max-w-sm">

        <div className="px-6 pt-6 pb-4 border-b border-[var(--c-border)]">
          <div className="flex items-center gap-2 mb-3">
            <Image src="/logo.png" alt="FlashMan.ai" width={24} height={24} className="rounded-md" />
            <span className="font-bold text-[16px] tracking-tight text-[var(--c-text)]">FlashMan.ai</span>
          </div>
          <h2 className="text-[17px] font-semibold text-[var(--c-text)]">Set new password</h2>
          <p className="text-[14px] text-[var(--c-text-2)] mt-0.5">Choose a new password for your account.</p>
        </div>

        {step === 'success' && (
          <div className="px-6 py-6 flex flex-col gap-4">
            <p className="text-[14px] text-[var(--c-green,#4ade80)]">
              Password updated successfully. You can now sign in with your new password.
            </p>
            <a
              href="/"
              className="block text-center py-2 rounded-lg text-[15px] font-semibold bg-[var(--c-purple-2)] text-white hover:bg-[var(--c-purple)] transition-colors"
            >
              Go to app
            </a>
          </div>
        )}

        {step === 'error' && (
          <div className="px-6 py-6 flex flex-col gap-4">
            <p className="text-[14px] text-[var(--c-red)] bg-[var(--c-red-bg-4)] border border-[var(--c-red-border)] rounded-lg px-3 py-2">
              {errMsg}
            </p>
            <a
              href="/"
              className="block text-center py-2 rounded-lg text-[14px] font-medium bg-[var(--c-bg-3)] text-[var(--c-text-2)] hover:bg-[var(--c-border)] transition-colors"
            >
              Back to app
            </a>
          </div>
        )}

        {(step === 'form' || step === 'submitting') && (
          <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[var(--c-text-2)] uppercase tracking-wider">
                New password <span className="text-[var(--c-red)]">*</span>
              </label>
              <input
                autoFocus
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
              disabled={!password || password.length < 8 || password !== confirm || step === 'submitting'}
              className="mt-1 w-full py-2 rounded-lg text-[15px] font-semibold bg-[var(--c-purple-2)] text-white
                         hover:bg-[var(--c-purple)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors
                         flex items-center justify-center gap-2"
            >
              {step === 'submitting' ? <><span className="spinner" /> Updating…</> : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
    <Footer />
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
