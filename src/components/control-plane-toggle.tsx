'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Settings, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';

interface ControlPlaneToggleProps {
  className?: string;
}

export function ControlPlaneToggle({ className }: ControlPlaneToggleProps) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { data: session, status } = useSession();

  // Fetch current setting on mount
  useEffect(() => {
    // Only fetch if we have a session
    if (status === 'loading') return;
    if (!session) {
      setLoading(false);
      return;
    }
    fetchControlPlaneSetting();
  }, [session, status]);

  const fetchControlPlaneSetting = async () => {
    try {
      const response = await fetch('/api/admin/control-plane');
      if (response.ok) {
        const data = await response.json();
        setEnabled(data.enabled);
      } else {
        console.error('Failed to fetch control plane setting');
      }
    } catch (error) {
      console.error('Error fetching control plane setting:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (newEnabled: boolean) => {
    if (!session) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to modify settings.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/control-plane', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: newEnabled }),
      });

      if (response.ok) {
        setEnabled(newEnabled);
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('controlPlaneChanged'));
        toast({
          title: 'Control Plane Updated',
          description: `Control plane features are now ${newEnabled ? 'enabled' : 'disabled'}.`,
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Update Failed',
          description:
            error.message || 'Failed to update control plane setting.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating control plane setting:', error);
      toast({
        title: 'Update Failed',
        description:
          'Failed to update control plane setting. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Experimental Features
          </CardTitle>
          <CardDescription>
            Control experimental features and functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Experimental Features
        </CardTitle>
        <CardDescription>
          Control experimental features and functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium">Control Plane</h4>
              {enabled ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {enabled
                ? 'Service control features are enabled on lab cards'
                : 'Service control features are disabled (experimental)'}
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={saving}
          />
        </div>

        {enabled && (
          <div className="rounded-md bg-green-50 border border-green-200 p-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-800">
                  Control Plane Active
                </p>
                <p className="text-green-700">
                  Admin users can now start, stop, and restart services directly
                  from lab cards.
                </p>
              </div>
            </div>
          </div>
        )}

        {!enabled && (
          <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">
                  Control Plane Disabled
                </p>
                <p className="text-yellow-700">
                  Service control features are hidden. Enable this to access
                  experimental functionality.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>
            <strong>Note:</strong> The control plane allows admin users to
            manage services on connected hosts. This is an experimental feature
            that may require additional configuration and testing.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
