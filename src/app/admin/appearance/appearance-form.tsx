'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Info } from 'lucide-react'

interface AppearanceData {
  instanceName: string
  headerText: string | null
  theme: string
}

export function AppearanceForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
              const [formData, setFormData] = useState<AppearanceData>({
              instanceName: 'Instance',
              headerText: 'Header Message',
              theme: 'system'
            })
  const { toast } = useToast()
  const router = useRouter()

    // Simplified: Don't try to load current data, just use defaults
  useEffect(() => {
    setIsLoadingData(false)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    console.log('Submitting form data:', formData)

    try {
      const response = await fetch('/api/admin/appearance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'smoke-test-key', // Use the test API key for now
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          console.error('Response error:', errorData)
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch (parseError) {
          console.error('Could not parse error response:', parseError)
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('Success response:', result)
      console.log('Response status:', response.status)
      
      toast({
        title: 'Success',
        description: 'Appearance settings updated successfully',
      })

      // Revalidate the layout by refreshing the page
      router.refresh()
      
    } catch (error) {
      console.error('Error updating appearance:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update appearance'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof AppearanceData, value: string | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }



  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
                          {/* Instance Name */}
                  <div className="space-y-2">
                    <Label htmlFor="instanceName">Instance Name</Label>
                    <Input
                      id="instanceName"
                      value={formData.instanceName}
                      onChange={(e) => handleInputChange('instanceName', e.target.value)}
                      placeholder="Enter instance name"
                      maxLength={60}
                      required
                      className="text-lg font-medium"
                    />
                    <p className="text-sm text-muted-foreground">
                      The display name for your portal instance (max 60 characters)
                    </p>
                  </div>

                  {/* Header Text */}
                  <div className="space-y-2">
                    <Label htmlFor="headerText">Header Message</Label>
                    <Input
                      id="headerText"
                      value={formData.headerText || ''}
                      onChange={(e) => handleInputChange('headerText', e.target.value || null)}
                      placeholder="Enter header message (optional)"
                      maxLength={140}
                      className="text-base"
                    />
                    <p className="text-sm text-muted-foreground">
                      Short banner text shown in header center (max 140 characters)
                    </p>
                  </div>

        {/* Theme */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="theme">Theme</Label>
            <div className="group relative">
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Theme switching coming soon
              </div>
            </div>
          </div>
          <Input
            id="theme"
            value={formData.theme}
            disabled
            className="bg-gray-100"
          />
          <p className="text-sm text-muted-foreground">
            Theme preference (currently locked to system)
          </p>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  )
}
