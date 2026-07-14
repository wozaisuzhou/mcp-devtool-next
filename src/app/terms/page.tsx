import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms that govern your use of Bubble MCP.',
  alternates: { canonical: '/terms' },
}

export default function TermsOfServicePage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="July 12, 2026">
      <section>
        <h2>Acceptance of terms</h2>
        <p>
          By creating an account or using Bubble MCP, you agree to these terms. If you don&rsquo;t agree,
          please don&rsquo;t use the service.
        </p>
      </section>

      <section>
        <h2>The service</h2>
        <p>
          Bubble MCP is a developer tool for inspecting, testing, tracing, and monitoring your own Model
          Context Protocol (MCP) servers. You are responsible for the MCP servers you connect to and any
          data you send through them.
        </p>
      </section>

      <section>
        <h2>Accounts</h2>
        <ul>
          <li>You must provide a valid email address and keep your password secure.</li>
          <li>You&rsquo;re responsible for activity that happens under your account.</li>
          <li>We may suspend or terminate accounts that violate these terms or abuse the service.</li>
        </ul>
      </section>

      <section>
        <h2>Plans</h2>
        <p>
          Bubble MCP offers a free plan and a paid plan with higher limits. Plan features and limits are
          described in the app and may change over time; we&rsquo;ll make reasonable efforts to notify
          users of material changes.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>You agree not to use Bubble MCP to:</p>
        <ul>
          <li>Access MCP servers or data you don&rsquo;t have authorization to access.</li>
          <li>Disrupt, overload, or attempt to compromise the service or other users&rsquo; data.</li>
          <li>Use the service for any unlawful purpose.</li>
        </ul>
      </section>

      <section>
        <h2>Disclaimer & liability</h2>
        <p>
          Bubble MCP is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable for
          any indirect, incidental, or consequential damages arising from your use of the service, to the
          maximum extent permitted by law.
        </p>
      </section>

      <section>
        <h2>Changes to these terms</h2>
        <p>
          We may update these terms from time to time. Continued use of the service after changes take
          effect constitutes acceptance of the updated terms.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about these terms? Reach us at{' '}
          <a href="mailto:support@bubblemcp.com">support@bubblemcp.com</a>.
        </p>
      </section>
    </LegalPage>
  )
}
