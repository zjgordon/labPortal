import { ReactNode } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Server, Monitor, Home, Square, Palette } from 'lucide-react'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/admin" className="flex items-center space-x-2">
                <Monitor className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Lab Portal Admin</span>
              </Link>
              
              <div className="flex space-x-1">
                <Link href="/admin/cards">
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Square className="h-4 w-4" />
                    <span>Cards</span>
                  </Button>
                </Link>
                <Link href="/admin/hosts">
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Home className="h-4 w-4" />
                    <span>Hosts</span>
                  </Button>
                </Link>
                <Link href="/admin/services">
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Server className="h-4 w-4" />
                    <span>Services</span>
                  </Button>
                </Link>
                <Link href="/admin/appearance">
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Palette className="h-4 w-4" />
                    <span>Appearance</span>
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  Back to Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-6">
        {children}
      </main>
    </div>
  )
}
