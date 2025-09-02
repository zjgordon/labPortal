import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("=== AUTHORIZE FUNCTION CALLED ===")
        console.log("Credentials:", credentials)
        
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials")
          return null
        }

        // Check admin credentials
        if (credentials.email === "admin@local" && credentials.password === "admin123") {
          console.log("=== ADMIN LOGIN SUCCESSFUL ===")
          return {
            id: "admin",
            name: "Admin",
            email: "admin@local"
          }
        }

        console.log("Invalid credentials")
        return null
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    }
  }
})

export { handler as GET, handler as POST }
