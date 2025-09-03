import { ReactNode } from 'react'

interface LoginLayoutProps {
  children: ReactNode
}

export default function LoginLayout({ children }: LoginLayoutProps) {
  // Simple layout without authentication checks for the login page
  return <>{children}</>
}
