'use client'

// Root error boundary. Must declare its own <html>/<body> because the root
// layout is a passthrough and only nested route groups render the document.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
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
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Something went wrong</h1>
        {error.digest && (
          <p style={{ fontSize: '0.875rem', opacity: 0.6, margin: 0 }}>
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #444',
            borderRadius: '0.375rem',
            background: 'transparent',
            color: 'inherit',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
