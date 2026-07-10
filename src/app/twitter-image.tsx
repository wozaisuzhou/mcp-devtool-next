import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#0d0d0f',
          backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,111,247,0.35), transparent 70%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', fontSize: 92, fontWeight: 700, color: '#e8e8f0' }}>
          Bubble
          <span style={{ color: '#7c6ff7', marginLeft: 18 }}>MCP</span>
        </div>
        <div style={{ display: 'flex', marginTop: 28, fontSize: 32, color: '#9090a8', textAlign: 'center', maxWidth: 900 }}>
          Debug, test, and ship MCP servers as a team
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 44 }}>
          {['Inspector', 'Trace', 'Tests', 'CI/CD'].map((label) => (
            <div
              key={label}
              style={{
                display: 'flex',
                padding: '10px 22px',
                borderRadius: 999,
                fontSize: 22,
                color: '#7c6ff7',
                background: 'rgba(124,111,247,0.12)',
                border: '1px solid rgba(124,111,247,0.35)',
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
