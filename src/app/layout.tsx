import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/components/auth-provider'
import { ErrorBoundary } from '@/components/error-boundary'
import { cronManager } from '@/lib/cron-manager'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Lab Portal',
  description: 'Portal and control plane for local network laboratories',
}

// Initialize cron manager for background tasks
if (typeof window === 'undefined') {
  // Server-side only
  console.log('Initializing cron manager...')
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
