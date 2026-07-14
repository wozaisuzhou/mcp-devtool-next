import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Bubble MCP collects, uses, and protects your data.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="July 12, 2026">
      <section>
        <h2>Overview</h2>
        <p>
          Bubble MCP (&ldquo;we&rdquo;, &ldquo;us&rdquo;) provides tools for inspecting, testing, and
          monitoring Model Context Protocol (MCP) servers. This policy explains what data we collect
          when you use the app and how we handle it.
        </p>
      </section>

      <section>
        <h2>Information we collect</h2>
        <ul>
          <li><strong>Account information</strong> — your email address and a hashed (bcrypt) password when you sign up.</li>
          <li><strong>Saved data</strong> — MCP session snapshots, test suites, and traces you explicitly choose to save, stored under your account.</li>
          <li><strong>MCP server connections</strong> — server URLs and credentials you enter to connect to your own MCP servers. These are used only to proxy your requests and are not shared with third parties.</li>
          <li><strong>Usage data</strong> — basic analytics such as pages visited, to help us understand how the product is used.</li>
        </ul>
      </section>

      <section>
        <h2>How we use your information</h2>
        <ul>
          <li>To authenticate you and operate your account.</li>
          <li>To store and retrieve sessions, test suites, and traces you save.</li>
          <li>To send transactional email, such as password reset links.</li>
          <li>To improve the product and diagnose issues.</li>
        </ul>
        <p>We do not sell your personal information.</p>
      </section>

      <section>
        <h2>Data storage</h2>
        <p>
          Account and application data is stored using reputable third-party infrastructure providers under
          appropriate security controls. We take reasonable technical measures to protect your data, but no
          system can be guaranteed 100% secure.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <p>
          You can delete saved sessions and test suites at any time from within the app. To request deletion
          of your account and associated data, contact us using the details below.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about this policy? Reach us at{' '}
          <a href="mailto:support@bubblemcp.com">support@bubblemcp.com</a>.
        </p>
      </section>
    </LegalPage>
  )
}
