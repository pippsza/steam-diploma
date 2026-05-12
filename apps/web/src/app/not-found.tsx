import Link from 'next/link'

// Skip static prerendering — the page bundle pulls in chunks shared with
// Payload admin, which transitively reference next/document and blow up
// during static export.
export const dynamic = 'force-dynamic'

// Root not-found. Declares its own <html>/<body> for the same reason as
// global-error.tsx — the root layout is a passthrough.
export default function NotFound() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          fontFamily: 'system-ui, sans-serif',
          background: '#0a0a0a',
          color: '#ededed',
        }}
      >
        <h1 style={{ fontSize: '2rem', margin: 0 }}>404</h1>
        <p style={{ margin: 0, opacity: 0.7 }}>Page not found.</p>
        <Link
          href="/"
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #444',
            borderRadius: '0.375rem',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          Go home
        </Link>
      </body>
    </html>
  )
}
