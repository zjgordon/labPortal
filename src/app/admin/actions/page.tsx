'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Filter, ChevronDown, ChevronUp } from 'lucide-react';

interface Action {
  id: string;
  kind: string;
  status: string;
  requestedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  exitCode: number | null;
  message: string | null;
  requestedBy: string | null;
  host: {
    id: string;
    name: string;
  };
  service: {
    id: string;
    displayName: string;
    unitName: string;
  };
}

interface ActionsResponse {
  actions: Action[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface Host {
  id: string;
  name: string;
}

interface Service {
  id: string;
  displayName: string;
  unitName: string;
}

export default function AdminActionsPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<
    ActionsResponse['pagination'] | null
  >(null);
  const [filters, setFilters] = useState({
    hostId: '',
    serviceId: '',
    status: '',
    kind: '',
    range: '24h',
  });
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  const fetchActions = useCallback(
    async (page: number = 1, append: boolean = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20',
          ...filters,
        });

        // Remove empty filters
        Object.entries(filters).forEach(([key, value]) => {
          if (!value) {
            params.delete(key);
          }
        });

        const response = await fetch(`/api/control/actions?${params}`);
        if (response.ok) {
          const data: ActionsResponse = await response.json();

          if (append) {
            setActions((prev) => [...prev, ...data.actions]);
          } else {
            setActions(data.actions);
          }
          setPagination(data.pagination);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to fetch actions',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch actions',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters, toast]
  );

  const fetchHostsAndServices = useCallback(async () => {
    try {
      const [hostsRes, servicesRes] = await Promise.all([
        fetch('/api/hosts'),
        fetch('/api/services'),
      ]);

      if (hostsRes.ok) {
        const hostsData = await hostsRes.json();
        setHosts(hostsData);
      }
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch hosts and services',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchHostsAndServices();
  }, [fetchHostsAndServices]);

  useEffect(() => {
    fetchActions(1, false);
  }, [fetchActions]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchActions(1, false);
  };

  const loadMore = () => {
    if (pagination?.hasNext) {
      fetchActions(pagination.page + 1, true);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'queued':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getKindColor = (kind: string) => {
    switch (kind) {
      case 'start':
        return 'bg-green-100 text-green-800';
      case 'stop':
        return 'bg-red-100 text-red-800';
      case 'restart':
        return 'bg-blue-100 text-blue-800';
      case 'status':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Action History</h1>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {showFilters ? (
            <ChevronUp className="h-4 w-4 ml-2" />
          ) : (
            <ChevronDown className="h-4 w-4 ml-2" />
          )}
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="host">Host</Label>
                <select
                  id="host"
                  value={filters.hostId}
                  onChange={(e) => handleFilterChange('hostId', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">All hosts</option>
                  {hosts.map((host) => (
                    <option key={host.id} value={host.id}>
                      {host.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="service">Service</Label>
                <select
                  id="service"
                  value={filters.serviceId}
                  onChange={(e) =>
                    handleFilterChange('serviceId', e.target.value)
                  }
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">All services</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">All statuses</option>
                  <option value="queued">Queued</option>
                  <option value="running">Running</option>
                  <option value="succeeded">Succeeded</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div>
                <Label htmlFor="kind">Action Type</Label>
                <select
                  id="kind"
                  value={filters.kind}
                  onChange={(e) => handleFilterChange('kind', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">All types</option>
                  <option value="start">Start</option>
                  <option value="stop">Stop</option>
                  <option value="restart">Restart</option>
                  <option value="status">Status</option>
                </select>
              </div>
              <div>
                <Label htmlFor="range">Time Range</Label>
                <select
                  id="range"
                  value={filters.range}
                  onChange={(e) => handleFilterChange('range', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="1h">Last 1 hour</option>
                  <option value="24h">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={applyFilters}>Apply Filters</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions List */}
      <div className="space-y-4">
        {actions.map((action) => (
          <Card key={action.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${getKindColor(action.kind)}`}
                  >
                    {action.kind}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${getStatusColor(action.status)}`}
                  >
                    {action.status}
                  </span>
                  {action.exitCode !== null && (
                    <span className="text-xs text-gray-500">
                      Exit: {action.exitCode}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {formatTimestamp(action.requestedAt)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Service:</span>
                  <p className="text-gray-600">{action.service.displayName}</p>
                  <p className="text-gray-500 text-xs">
                    {action.service.unitName}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Host:</span>
                  <p className="text-gray-600">{action.host.name}</p>
                </div>
                <div>
                  <span className="font-medium">Requested by:</span>
                  <p className="text-gray-600">
                    {action.requestedBy || 'Unknown'}
                  </p>
                </div>
              </div>

              {action.startedAt && (
                <div className="mt-3 text-sm text-gray-600">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="font-medium">Started:</span>{' '}
                      {formatTimestamp(action.startedAt)}
                    </div>
                    {action.finishedAt && (
                      <>
                        <div>
                          <span className="font-medium">Finished:</span>{' '}
                          {formatTimestamp(action.finishedAt)}
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span>{' '}
                          {Math.round(
                            (new Date(action.finishedAt).getTime() -
                              new Date(action.startedAt).getTime()) /
                              1000
                          )}
                          s
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {action.message && (
                <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                  {action.message.length > 300
                    ? `${action.message.substring(0, 300)}...`
                    : action.message}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More Button */}
      {pagination?.hasNext && (
        <div className="mt-6 text-center">
          <Button onClick={loadMore} disabled={loadingMore} variant="outline">
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}

      {/* Pagination Info */}
      {pagination && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Showing {actions.length} of {pagination.totalCount} actions
        </div>
      )}
    </div>
  );
}
