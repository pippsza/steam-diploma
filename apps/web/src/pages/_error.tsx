import type { NextPageContext } from 'next'

interface Props {
  statusCode?: number
}

// Minimal pages-router error page. Forces SSR via getInitialProps so Next.js
// does not attempt to statically prerender /404 and /500, which is where the
// auto-generated chunks were failing.
function ErrorPage({ statusCode }: Props) {
  return (
    <div
      style={{
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
      <h1 style={{ fontSize: '2rem', margin: 0 }}>{statusCode ?? 'Error'}</h1>
      <p style={{ margin: 0, opacity: 0.7 }}>
        {statusCode === 404 ? 'Page not found.' : 'Something went wrong.'}
      </p>
    </div>
  )
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 404
  return { statusCode }
}

export default ErrorPage
