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
import {
  Loader2,
  Settings,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';

interface ControlPlaneToggleProps {
  className?: string;
}

export function ControlPlaneToggle({ className }: ControlPlaneToggleProps) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { toast } = useToast();
  const { data: session, status } = useSession();

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('control-plane-toggle-expanded');
    if (savedState !== null) {
      setIsExpanded(JSON.parse(savedState));
    }
  }, []);

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

  const handleExpandToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    localStorage.setItem(
      'control-plane-toggle-expanded',
      JSON.stringify(newExpanded)
    );
  };

  const handleResetCards = async () => {
    if (!session) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to reset cards.',
        variant: 'destructive',
      });
      return;
    }

    setResetting(true);
    setShowResetConfirm(false);

    try {
      const response = await fetch('/api/admin/reset-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: 'Cards Reset Successfully',
          description: 'All cards have been reset to the default seed data.',
        });
        // Optionally refresh the page to show the new cards
        window.location.reload();
      } else {
        const error = await response.json();
        toast({
          title: 'Reset Failed',
          description: error.message || 'Failed to reset cards to seed data.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error resetting cards:', error);
      toast({
        title: 'Reset Failed',
        description: 'Failed to reset cards. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setResetting(false);
    }
  };

  const handleClearCards = async () => {
    if (!session) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to clear cards.',
        variant: 'destructive',
      });
      return;
    }

    setClearing(true);
    setShowClearConfirm(false);

    try {
      const response = await fetch('/api/admin/clear-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: 'Cards Cleared Successfully',
          description: 'All cards have been permanently deleted.',
        });
        // Optionally refresh the page to show the empty state
        window.location.reload();
      } else {
        const error = await response.json();
        toast({
          title: 'Clear Failed',
          description: error.message || 'Failed to clear all cards.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error clearing cards:', error);
      toast({
        title: 'Clear Failed',
        description: 'Failed to clear cards. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <span className="bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text text-transparent">
                  Danger Zone
                </span>
              </CardTitle>
              <CardDescription>
                Control experimental features and functionality
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExpandToggle}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent>
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <span className="bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text text-transparent">
                Danger Zone
              </span>
            </CardTitle>
            <CardDescription>
              Control experimental features and functionality
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExpandToggle}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
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
                    Admin users can now start, stop, and restart services
                    directly from lab cards.
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
              manage services on connected hosts. This is an experimental
              feature that may require additional configuration and testing.
            </p>
          </div>

          {/* Reset to Seed Cards Section */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium">Reset to Seed Cards</h4>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </div>
              <p className="text-sm text-muted-foreground">
                Clear all current cards and restore the default seed cards
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
              disabled={resetting}
              className="flex items-center gap-2"
            >
              {resetting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              {resetting ? 'Resetting...' : 'Reset Cards'}
            </Button>
          </div>

          {/* Confirmation Dialog */}
          {showResetConfirm && (
            <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm flex-1">
                  <p className="font-medium text-yellow-800">
                    Confirm Card Reset
                  </p>
                  <p className="text-yellow-700 mb-3">
                    This will permanently delete all current cards and restore
                    the default seed cards (ComfyUI, SD Forge, OogaBooga,
                    SillyTavern, Grafana, Portainer, Gitea, OwnCloud). This
                    action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleResetCards}
                      disabled={resetting}
                      className="flex items-center gap-2"
                    >
                      {resetting ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3 w-3" />
                      )}
                      {resetting ? 'Resetting...' : 'Confirm Reset'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowResetConfirm(false)}
                      disabled={resetting}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clear All Cards Section */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium">Clear All Cards</h4>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-sm text-muted-foreground">
                Permanently delete all cards without restoring defaults
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearConfirm(true)}
              disabled={clearing}
              className="flex items-center gap-2"
            >
              {clearing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {clearing ? 'Clearing...' : 'Clear All'}
            </Button>
          </div>

          {/* Clear Confirmation Dialog */}
          {showClearConfirm && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                <div className="text-sm flex-1">
                  <p className="font-medium text-red-800">
                    Confirm Clear All Cards
                  </p>
                  <p className="text-red-700 mb-3">
                    This will permanently delete ALL cards and leave the portal
                    empty. This action cannot be undone and no default cards
                    will be restored.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleClearCards}
                      disabled={clearing}
                      className="flex items-center gap-2"
                    >
                      {clearing ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                      {clearing ? 'Clearing...' : 'Confirm Clear'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowClearConfirm(false)}
                      disabled={clearing}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
