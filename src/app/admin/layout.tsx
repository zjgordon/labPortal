'use client';

import { ReactNode, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Server,
  Monitor,
  Home,
  Square,
  Palette,
  LogOut,
  Activity,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useControlPlane } from '@/hooks/use-control-plane';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { enabled: controlPlaneEnabled, loading: controlPlaneLoading } =
    useControlPlane();

  // Check if this is the login page
  const isLoginPage = pathname === '/admin/login';

  // Redirect to login if not authenticated (but not if already on login page)
  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session && !isLoginPage) {
      router.push('/admin/login');
    }
  }, [session, status, router, isLoginPage]);

  // Show loading while checking authentication (but not on login page)
  if (status === 'loading' && !isLoginPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render admin content if not authenticated (but allow login page)
  if (!session && !isLoginPage) {
    return null;
  }

  // If this is the login page, render without the admin navigation
  if (isLoginPage) {
    return <>{children}</>;
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/admin" className="flex items-center space-x-2">
                <Monitor className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">
                  Lab Portal Admin
                </span>
              </Link>

              <div className="flex space-x-1">
                <Link href="/admin/cards">
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2"
                  >
                    <Square className="h-4 w-4" />
                    <span>Cards</span>
                  </Button>
                </Link>
                {controlPlaneEnabled && (
                  <>
                    <Link href="/admin/hosts">
                      <Button
                        variant="ghost"
                        className="flex items-center space-x-2"
                      >
                        <Home className="h-4 w-4" />
                        <span>Hosts</span>
                      </Button>
                    </Link>
                    <Link href="/admin/services">
                      <Button
                        variant="ghost"
                        className="flex items-center space-x-2"
                      >
                        <Server className="h-4 w-4" />
                        <span>Services</span>
                      </Button>
                    </Link>
                    <Link href="/admin/actions">
                      <Button
                        variant="ghost"
                        className="flex items-center space-x-2"
                      >
                        <Activity className="h-4 w-4" />
                        <span>Actions</span>
                      </Button>
                    </Link>
                  </>
                )}
                <Link href="/admin/appearance">
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2"
                  >
                    <Palette className="h-4 w-4" />
                    <span>Appearance</span>
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Logged in as {session?.user?.email}
              </span>
              <Link href="/">
                <Button variant="outline" size="sm">
                  Back to Portal
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-6">{children}</main>
    </div>
  );
}
