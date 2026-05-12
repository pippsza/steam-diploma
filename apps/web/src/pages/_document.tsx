import { Html, Head, Main, NextScript } from 'next/document'

// Explicit pages-router Document. Overriding the auto-generated default keeps
// Next.js from bundling shared internal chunks that trigger an
// "<Html> outside pages/_document" error when prerendering /404 and /500
// fallbacks during `next build`.
export default function Document() {
  return (
    <Html>
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
