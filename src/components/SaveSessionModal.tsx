'use client'
import { useState } from 'react'

interface Props {
  onClose: () => void
}

export function SaveSessionModal({ onClose }: Props) {
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password.trim()) return
    if (mode === 'signup' && !name.trim()) return

    setLoading(true)
    // Placeholder: wire up real auth here
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    setError('Authentication not yet connected — coming soon.')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#141416] border border-[#2a2a32] rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#2a2a32]">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-[#e8e8f0]">
                {mode === 'signup' ? 'Save your session' : 'Welcome back'}
              </h2>
              <p className="text-[12px] text-[#9090a8] mt-1">
                {mode === 'signup'
                  ? 'Create an account to save and restore MCP sessions.'
                  : 'Sign in to access your saved sessions.'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-[#5a5a70] hover:text-[#e8e8f0] transition-colors ml-4 mt-0.5"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Mode tabs */}
          <div className="flex mt-4 bg-[#1a1a1e] rounded-lg p-0.5">
            <button
              onClick={() => { setMode('signup'); setError('') }}
              className={`flex-1 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                mode === 'signup'
                  ? 'bg-[#222228] text-[#e8e8f0]'
                  : 'text-[#9090a8] hover:text-[#e8e8f0]'
              }`}
            >
              Sign up
            </button>
            <button
              onClick={() => { setMode('login'); setError('') }}
              className={`flex-1 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-[#222228] text-[#e8e8f0]'
                  : 'text-[#9090a8] hover:text-[#e8e8f0]'
              }`}
            >
              Sign in
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-3">
          {mode === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-[#9090a8] uppercase tracking-wider">
                Name
              </label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="bg-[#1a1a1e] border border-[#2a2a32] rounded-lg px-3 py-2 text-[13px]
                           text-[#e8e8f0] placeholder-[#5a5a70] outline-none focus:border-[#5a54c4]
                           transition-colors"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-[#9090a8] uppercase tracking-wider">
              Email
            </label>
            <input
              autoFocus={mode === 'login'}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="bg-[#1a1a1e] border border-[#2a2a32] rounded-lg px-3 py-2 text-[13px]
                         text-[#e8e8f0] placeholder-[#5a5a70] outline-none focus:border-[#5a54c4]
                         transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-[#9090a8] uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-[#1a1a1e] border border-[#2a2a32] rounded-lg px-3 py-2 text-[13px]
                         text-[#e8e8f0] placeholder-[#5a5a70] outline-none focus:border-[#5a54c4]
                         transition-colors"
            />
          </div>

          {error && (
            <p className="text-[11px] text-[#f0a840] bg-[#1a1610] border border-[#2a1a1a] rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full py-2 rounded-lg text-[13px] font-semibold bg-[#5a54c4] text-white
                       hover:bg-[#7c6ff7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                       flex items-center justify-center gap-2"
          >
            {loading ? <span className="spinner" /> : null}
            {mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>

          <p className="text-[11px] text-center text-[#5a5a70]">
            By continuing you agree to our{' '}
            <span className="text-[#7c6ff7] cursor-pointer hover:underline">Terms</span>
            {' '}and{' '}
            <span className="text-[#7c6ff7] cursor-pointer hover:underline">Privacy Policy</span>.
          </p>
        </form>
      </div>
    </div>
  )
}
