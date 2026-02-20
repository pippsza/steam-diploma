import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'

export const authConfig: NextAuthConfig = {
  providers: [Google],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id
        token.isVerified = (user as Record<string, unknown>).isVerified === true
      }
      return token
    },
    session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub
        session.user.isVerified = token.isVerified ?? false
      }
      return session
    },
  },
}
