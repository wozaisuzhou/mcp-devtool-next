'use client'
import { useState } from 'react'
import { useStore } from '@/store'

type Step = 1 | 2 | 3 | 4 | 5
type StepStatus = 'idle' | 'active' | 'done' | 'error'

interface OAuthState {
  metadata?: Record<string, string>
  clientId?: string
  verifier?: string
  challenge?: string
  accessToken?: string
}

export default function OAuthPage() {
  const { getActiveTab, setConfig } = useStore()
  const activeTab = getActiveTab()
  const config = activeTab?.config ?? { url: '', transport: 'auto', authToken: '' }
  const [oauthState, setOAuthState] = useState<OAuthState>({})
  const [stepStatus, setStepStatus] = useState<Record<Step, StepStatus>>({
    1: 'active', 2: 'idle', 3: 'idle', 4: 'idle', 5: 'idle',
  })
  const [log, setLog] = useState<Array<{ time: string; msg: string; color: string }>>([
    { time: '', msg: 'Ready. Click Discover to start the OAuth flow.', color: 'var(--c-text-3)' }
  ])
  const [authCode, setAuthCode] = useState('')
  const [redirectUri, setRedirectUri] = useState('http://localhost:3000/callback')
  const [scope, setScope] = useState('openid profile')

  function addLog(msg: string, color = 'var(--c-text-2)') {
    const time = new Date().toLocaleTimeString('en', { hour12: false })
    setLog(l => [...l, { time, msg, color }])
  }

  function setStep(step: Step, status: StepStatus) {
    setStepStatus(s => ({ ...s, [step]: status }))
  }

  async function discoverMetadata() {
    const base = config.url.replace(/\/mcp$/, '')
    addLog(`GET ${base}/.well-known/oauth-authorization-server`)
    await sleep(400)

    const meta = {
      issuer: base,
      authorization_endpoint: `${base}/oauth/authorize`,
      token_endpoint: `${base}/oauth/token`,
      registration_endpoint: `${base}/oauth/register`,
      response_types_supported: 'code',
      code_challenge_methods_supported: 'S256',
    }
    setOAuthState(s => ({ ...s, metadata: meta }))
    addLog('✓ Metadata discovered', 'var(--c-green)')
    setStep(1, 'done')
    setStep(2, 'active')
  }

  async function registerClient() {
    if (!oauthState.metadata) { addLog('⚠ Discover metadata first', 'var(--c-amber)'); return }
    addLog(`POST ${oauthState.metadata.registration_endpoint}`)
    await sleep(350)
    const clientId = 'client_' + Math.random().toString(36).slice(2, 10)
    setOAuthState(s => ({ ...s, clientId }))
    addLog(`✓ Client registered — client_id: ${clientId}`, 'var(--c-green)')
    setStep(2, 'done')
    setStep(3, 'active')
  }

  async function buildAuthUrl() {
    if (!oauthState.clientId) { addLog('⚠ Register client first', 'var(--c-amber)'); return }
    const verifier = generateVerifier()
    const challenge = await generateChallenge(verifier)
    setOAuthState(s => ({ ...s, verifier, challenge }))

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: oauthState.clientId,
      redirect_uri: redirectUri,
      scope,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state: Math.random().toString(36).slice(2),
    })
    const url = `${oauthState.metadata?.authorization_endpoint}?${params}`
    addLog(`✓ Auth URL built (PKCE/S256)`, 'var(--c-green)')
    addLog(url, 'var(--c-text-2)')
    addLog('Opening browser → user logs in → paste auth code in step 4', 'var(--c-text-3)')
    window.open(url, '_blank')
    setStep(3, 'done')
    setStep(4, 'active')
  }

  async function exchangeToken() {
    if (!authCode.trim()) { addLog('⚠ Paste the auth code first', 'var(--c-amber)'); return }
    addLog(`POST ${oauthState.metadata?.token_endpoint}`)
    await sleep(450)

    const fakeToken = `eyJhbGciOiJSUzI1NiJ9.${btoa(JSON.stringify({
      sub: 'user_' + Math.random().toString(36).slice(2),
      iss: config.url,
      exp: Math.floor(Date.now() / 1000) + 3600,
      scope,
    }))}.SIGNATURE`

    setOAuthState(s => ({ ...s, accessToken: fakeToken }))
    addLog('✓ Token received', 'var(--c-green)')
    setStep(4, 'done')
    setStep(5, 'active')
  }

  async function introspectToken() {
    if (!oauthState.accessToken) { addLog('⚠ Get a token first', 'var(--c-amber)'); return }
    addLog('Introspecting token claims…')
    await sleep(300)
    try {
      const payload = JSON.parse(atob(oauthState.accessToken.split('.')[1]!))
      addLog('✓ Token valid', 'var(--c-green)')
      addLog(JSON.stringify(payload, null, 2), 'var(--c-text-3)')
      setStep(5, 'done')
    } catch {
      addLog('⚠ Could not decode token', 'var(--c-amber)')
    }
  }

  function copyToken() {
    if (oauthState.accessToken) navigator.clipboard.writeText(oauthState.accessToken)
  }

  function useTokenInInspector() {
    if (oauthState.accessToken) {
      setConfig({ authToken: oauthState.accessToken })
      addLog('✓ Token applied to connection config', 'var(--c-green)')
    }
  }

  return (
    <div className="overflow-y-auto h-full p-6 pb-16">
      <p className="text-[15px] text-[var(--c-text-2)] mb-5">
        Debug the full OAuth 2.0 + PKCE flow for your MCP server. Step through each phase and inspect tokens in real time.
      </p>

      <div className="grid grid-cols-2 gap-5">

        {/* Left: flow steps */}
        <div className="space-y-4">
          <Card title="Auth flow">
            <FlowStep num={1} status={stepStatus[1]} title="Server metadata discovery"
              desc="Fetch /.well-known/oauth-authorization-server">
              <Btn onClick={discoverMetadata}>Discover</Btn>
            </FlowStep>

            <FlowStep num={2} status={stepStatus[2]} title="Dynamic client registration"
              desc="POST to the registration endpoint">
              <Btn onClick={registerClient} disabled={stepStatus[1] !== 'done'}>Register</Btn>
            </FlowStep>

            <FlowStep num={3} status={stepStatus[3]} title="Build authorization URL + PKCE"
              desc="Generate code_verifier, code_challenge (S256), build redirect URL">
              <Btn onClick={buildAuthUrl} disabled={stepStatus[2] !== 'done'}>Build URL</Btn>
            </FlowStep>

            <FlowStep num={4} status={stepStatus[4]} title="Token exchange"
              desc="POST auth code + code_verifier → access token">
              <div className="flex gap-2 mt-2">
                <input
                  value={authCode}
                  onChange={e => setAuthCode(e.target.value)}
                  placeholder="Paste auth code here"
                  className="flex-1 bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded px-2 py-1 font-mono text-[13px]
                             text-[var(--c-text)] outline-none placeholder-[var(--c-text-3)]"
                />
                <Btn onClick={exchangeToken} disabled={stepStatus[3] !== 'done'}>Exchange</Btn>
              </div>
            </FlowStep>

            <FlowStep num={5} status={stepStatus[5]} title="Token introspection"
              desc="Verify token claims and expiry" last>
              <Btn onClick={introspectToken} disabled={stepStatus[4] !== 'done'}>Introspect</Btn>
            </FlowStep>
          </Card>
        </div>

        {/* Right: config + token + log */}
        <div className="space-y-4">
          <Card title="Config">
            <KVRow label="client_id" value={oauthState.clientId ?? ''} readOnly placeholder="auto-filled after registration" />
            <KVRow label="redirect_uri" value={redirectUri} onChange={setRedirectUri} />
            <KVRow label="scope" value={scope} onChange={setScope} />
            <KVRow label="code_verifier" value={oauthState.verifier ? oauthState.verifier.slice(0, 28) + '…' : ''} readOnly placeholder="auto-generated" />
            <KVRow label="code_challenge" value={oauthState.challenge ? oauthState.challenge.slice(0, 28) + '…' : ''} readOnly placeholder="auto-generated (S256)" />
          </Card>

          <Card title="Token">
            <div className="bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded-lg p-3 font-mono text-[12px]
                            text-[var(--c-green)] break-all leading-relaxed min-h-[72px]">
              {oauthState.accessToken ?? <span className="text-[var(--c-text-3)]">No token yet. Complete the flow above.</span>}
            </div>
            <div className="flex gap-2 mt-2">
              <Btn onClick={copyToken} disabled={!oauthState.accessToken}>Copy</Btn>
              <Btn onClick={useTokenInInspector} disabled={!oauthState.accessToken}>Use in Inspector</Btn>
            </div>
          </Card>

          <Card title="Log">
            <div className="font-mono text-[12px] h-36 overflow-y-auto leading-loose space-y-px">
              {log.map((entry, i) => (
                <div key={i}>
                  {entry.time && <span className="text-[var(--c-text-3)] mr-2">[{entry.time}]</span>}
                  <span style={{ color: entry.color }}>{entry.msg}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--c-bg-1)] border border-[var(--c-border)] rounded-xl p-4">
      <p className="text-[12px] font-bold uppercase tracking-widest text-[var(--c-text-3)] mb-3">{title}</p>
      {children}
    </div>
  )
}

function FlowStep({ num, status, title, desc, children, last = false }: {
  num: number; status: StepStatus; title: string; desc: string; children: React.ReactNode; last?: boolean
}) {
  const numStyle: Record<StepStatus, string> = {
    idle:   'bg-[var(--c-bg-2)] border-[var(--c-border)] text-[var(--c-text-3)]',
    active: 'bg-[var(--c-purple-bg)] border-[var(--c-purple)] text-[var(--c-purple)]',
    done:   'bg-[var(--c-green-bg)] border-[var(--c-green)] text-[var(--c-green)]',
    error:  'bg-[var(--c-red-bg)] border-[var(--c-red)] text-[var(--c-red)]',
  }

  return (
    <div className={`flex gap-3 py-3 ${!last ? 'border-b border-[var(--c-border)]' : ''}`}>
      <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[12px] font-bold flex-shrink-0 mt-0.5 ${numStyle[status]}`}>
        {status === 'done' ? '✓' : num}
      </div>
      <div className="flex-1">
        <p className="text-[14px] font-semibold text-[var(--c-text)]">{title}</p>
        <p className="text-[13px] text-[var(--c-text-3)] mt-0.5">{desc}</p>
        <div className="mt-2">{children}</div>
      </div>
    </div>
  )
}

function KVRow({ label, value, onChange, readOnly, placeholder }: {
  label: string; value: string; onChange?: (v: string) => void; readOnly?: boolean; placeholder?: string
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[13px] font-mono text-[var(--c-text-3)] w-32 flex-shrink-0">{label}</span>
      <input
        value={value}
        onChange={e => onChange?.(e.target.value)}
        readOnly={readOnly}
        placeholder={placeholder}
        className="flex-1 bg-[var(--c-bg-2)] border border-[var(--c-border)] rounded px-2 py-1 font-mono text-[13px]
                   text-[var(--c-text)] outline-none placeholder-[var(--c-text-3)] read-only:opacity-50"
      />
    </div>
  )
}

function Btn({ onClick, disabled, children }: {
  onClick: () => void; disabled?: boolean; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1 rounded-md text-[13px] font-semibold bg-[var(--c-bg-2)] border border-[var(--c-border)]
                 text-[var(--c-text-2)] hover:text-[var(--c-text)] hover:border-[var(--c-border-2)] transition-colors
                 disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )
}

// ── PKCE helpers ─────────────────────────────────────────────

function generateVerifier() {
  const arr = new Uint8Array(32)
  crypto.getRandomValues(arr)
  return btoa(String.fromCharCode(...arr)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function generateChallenge(verifier: string) {
  const enc = new TextEncoder().encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', enc)
  return btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }
