'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  Server,
  Home,
  Activity,
  Settings,
  Square,
} from 'lucide-react';
import { ControlPlaneToggle } from '@/components/control-plane-toggle';
import { useControlPlane } from '@/hooks/use-control-plane';

interface DashboardStats {
  totalHosts: number;
  totalServices: number;
  totalCards: number;
  onlineHosts: number;
  totalActions: number;
  pendingActions: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { enabled: controlPlaneEnabled, loading: controlPlaneLoading } =
    useControlPlane();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [hostsRes, servicesRes, actionsRes, cardsRes] = await Promise.all([
        fetch('/api/hosts'),
        fetch('/api/services'),
        fetch('/api/control/actions'),
        fetch('/api/cards/all'),
      ]);

      let totalHosts = 0;
      let totalServices = 0;
      let totalCards = 0;
      let onlineHosts = 0;
      let totalActions = 0;
      let pendingActions = 0;

      if (hostsRes.ok) {
        const hosts = await hostsRes.json();
        totalHosts = hosts.length;
        onlineHosts = hosts.filter((h: any) => h.lastSeenAt).length;
      }

      if (servicesRes.ok) {
        const services = await servicesRes.json();
        totalServices = services.length;
      }

      if (actionsRes.ok) {
        const actions = await actionsRes.json();
        totalActions = actions.length;
        pendingActions = actions.filter(
          (a: any) => a.status === 'queued' || a.status === 'running'
        ).length;
      }

      if (cardsRes.ok) {
        const cards = await cardsRes.json();
        totalCards = cards.length;
      }

      setStats({
        totalHosts,
        totalServices,
        totalCards,
        onlineHosts,
        totalActions,
        pendingActions,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Manage your Lab Portal infrastructure and services
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Cards - Always visible */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
            <Square className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCards || 0}</div>
            <p className="text-xs text-muted-foreground">Lab tools</p>
          </CardContent>
        </Card>

        {/* Conditional blocks based on control plane toggle */}
        {!controlPlaneLoading && controlPlaneEnabled ? (
          <>
            {/* Total Hosts - Only visible when control plane enabled */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Hosts
                </CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.totalHosts || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.onlineHosts || 0} online
                </p>
              </CardContent>
            </Card>

            {/* Total Services - Only visible when control plane enabled */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Services
                </CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.totalServices || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Managed services
                </p>
              </CardContent>
            </Card>

            {/* Total Actions - Only visible when control plane enabled */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Actions
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.totalActions || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.pendingActions || 0} pending
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Blank blocks to maintain visual consistency when control plane is disabled */}
            <Card className="opacity-0 pointer-events-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium"></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold"></div>
                <p className="text-xs text-muted-foreground"></p>
              </CardContent>
            </Card>

            <Card className="opacity-0 pointer-events-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium"></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold"></div>
                <p className="text-xs text-muted-foreground"></p>
              </CardContent>
            </Card>

            <Card className="opacity-0 pointer-events-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium"></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold"></div>
                <p className="text-xs text-muted-foreground"></p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h3 className="font-medium">Configure Portal</h3>
                <p className="text-sm text-gray-600">
                  Start by managing your portal cards - add, edit, and organize
                  lab tools that users can access.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h3 className="font-medium">Add Hosts</h3>
                <p className="text-sm text-gray-600">
                  Add hosts to your infrastructure. Each host will need an agent
                  token for authentication.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h3 className="font-medium">Configure Services</h3>
                <p className="text-sm text-gray-600">
                  Define which services each host can manage, including
                  start/stop/restart permissions.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <h3 className="font-medium">Deploy Agents</h3>
                <p className="text-sm text-gray-600">
                  Use the agent skeleton to deploy lightweight agents on your
                  hosts for remote service control.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                5
              </div>
              <div>
                <h3 className="font-medium">Monitor & Control</h3>
                <p className="text-sm text-gray-600">
                  Monitor host health, trigger service actions, and track
                  execution status in real-time.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Experimental Features */}
      <div className="mt-8">
        <ControlPlaneToggle />
      </div>
    </div>
  );
}
