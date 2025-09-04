'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Info } from 'lucide-react';

interface AppearanceData {
  instanceName: string;
  headerText: string | null;
  theme: string;
  showClock: boolean;
}

export function AppearanceForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [formData, setFormData] = useState<AppearanceData>({
    instanceName: 'Lab Portal',
    headerText: null,
    theme: 'system',
    showClock: true,
  });
  const { toast } = useToast();
  const router = useRouter();

  // Load current appearance data on component mount
  useEffect(() => {
    const fetchCurrentAppearance = async () => {
      try {
        const response = await fetch('/api/admin/appearance', {
          method: 'GET',
          headers: {
            'x-api-key': 'smoke-test-key',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setFormData({
            instanceName: data.data.instanceName,
            headerText: data.data.headerText,
            theme: data.data.theme,
            showClock: data.data.showClock,
          });
        }
      } catch (error) {
        console.error('Failed to fetch current appearance:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchCurrentAppearance();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/appearance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'smoke-test-key',
          Origin: window.location.origin,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // Ignore parse error, use default message
        }
        throw new Error(errorMessage);
      }

      await response.json();

      toast({
        title: 'Success',
        description: 'Appearance settings updated successfully',
      });

      // Revalidate the layout by refreshing the page
      router.refresh();
    } catch (error) {
      console.error('Error updating appearance:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update appearance';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof AppearanceData,
    value: string | null | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isLoadingData) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Instance Name</Label>
            <Input disabled placeholder="Loading..." />
          </div>
          <div className="space-y-2">
            <Label>Header Message</Label>
            <Input disabled placeholder="Loading..." />
          </div>
          <div className="space-y-2">
            <Label>Theme</Label>
            <Input disabled placeholder="Loading..." />
          </div>
        </div>
        <Button disabled className="w-full">
          Loading...
        </Button>
      </div>
    );
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
            onChange={(e) =>
              handleInputChange('headerText', e.target.value || null)
            }
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

        {/* Show Clock */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showClock"
              checked={formData.showClock}
              onChange={(e) => handleInputChange('showClock', e.target.checked)}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
            />
            <Label htmlFor="showClock">Show Clock in Header</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Display a live UTC and local time clock in the portal header
          </p>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
}
