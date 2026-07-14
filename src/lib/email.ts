export async function sendEmail(to: string, subject: string, html: string) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.log(`[email] (no RESEND_API_KEY) would send "${subject}" to ${to}`)
    return
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: fromEmail, to: [to], subject, html }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    console.error('[email] Resend error:', res.status, body)
  }
}
