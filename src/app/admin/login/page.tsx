"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

/**
 * AdminLoginPage - Authentication interface for portal administration
 * Features:
 * - NextAuth-based authentication
 * - Proper session management
 * - Error handling and user feedback
 * - Navigation back to main portal
 */
export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  /**
   * Handles admin login form submission
   * Authenticates user using NextAuth and redirects to admin dashboard
   * @param e - Form submission event
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Use NextAuth signIn for proper authentication
      const result = await signIn('credentials', {
        email: 'admin@local',
        password,
        redirect: false,
      })

      if (result?.ok) {
        console.log('Login successful, redirecting to admin dashboard...')
        router.push('/admin')
      } else {
        setError('Incorrect password. Please try again.')
        setPassword('')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('An error occurred during login. Please try again.')
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">
            Admin Access
          </h1>
          <p className="text-slate-400 mb-6">
            Enter the admin password to configure the portal
          </p>
          
          {/* Back to Portal Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/')}
            className="border-emerald-400/50 text-emerald-400 hover:bg-emerald-400/10 hover:border-emerald-400 hover:text-emerald-300 transition-all duration-200 shadow-[0_0_10px_rgba(52,211,153,0.3)] hover:shadow-[0_15px_rgba(52,211,153,0.5)]"
          >
            ← Back to Portal
          </Button>
        </div>

        <Card className="bg-slate-800 border-slate-700 text-slate-100">
          <CardHeader>
            <CardTitle className="text-slate-100">Portal Configuration</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your admin password to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Admin Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-400/20"
                />
              </div>
              
              {error && (
                <div className="text-sm text-red-400 bg-red-500/10 p-3 rounded border border-red-500/20">
                  {error}
                </div>
              )}
              
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-[0_0_10px_rgba(52,211,153,0.3)] hover:shadow-[0_15px_rgba(52,211,153,0.5)] transition-all duration-200" disabled={isLoading}>
                {isLoading ? "Checking..." : "Access Configuration"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
