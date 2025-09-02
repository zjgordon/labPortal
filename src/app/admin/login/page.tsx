"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Simple password check
    if (password === 'admin123') {
      try {
        // Set authentication in localStorage
        localStorage.setItem('admin-authenticated', 'true')
        localStorage.setItem('admin-login-time', Date.now().toString())
        
        // Redirect to admin dashboard
        window.location.href = '/admin'
        
      } catch (error) {
        setError('An error occurred during login. Please try again.')
      }
    } else {
      setError('Incorrect password. Please try again.')
      setPassword('')
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Admin Access
          </h1>
          <p className="text-muted-foreground">
            Enter the admin password to configure the portal
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Portal Configuration</CardTitle>
            <CardDescription>
              Enter your admin password to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Admin Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded border">
                  {error}
                </div>
              )}
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Checking..." : "Access Configuration"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
