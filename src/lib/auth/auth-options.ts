import CredentialsProvider from "next-auth/providers/credentials"
import { env } from '@/lib/env'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Check admin credentials
        if (credentials.email === "admin@local" && credentials.password === env.ADMIN_PASSWORD) {
          return {
            id: "admin",
            name: "Admin",
            email: "admin@local"
          }
        }

        return null
      }
    })
  ],
  session: {
    strategy: "jwt" as const
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
        token.email = user.email ?? null
        token.name = user.name ?? null
      }
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    }
  }
}
