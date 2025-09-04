'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  Play,
  Square,
  RotateCcw,
  Server,
  Link,
  Unlink,
  Clock,
  History,
} from 'lucide-react';

interface Service {
  id: string;
  cardId: string | null;
  hostId: string;
  unitName: string;
  displayName: string;
  description: string | null;
  allowStart: boolean;
  allowStop: boolean;
  allowRestart: boolean;
  host: {
    id: string;
    name: string;
  };
  card?: {
    id: string;
    title: string;
  };
  lastAction?: {
    id: string;
    kind: string;
    status: string;
    requestedAt: string;
    startedAt: string | null;
    finishedAt: string | null;
    exitCode: number | null;
    message: string | null;
    requestedBy: string | null;
  } | null;
}

interface CreateServiceData {
  cardId: string;
  hostId: string;
  unitName: string;
  displayName: string;
  description: string;
  allowStart: boolean;
  allowStop: boolean;
  allowRestart: boolean;
}

interface UpdateServiceData {
  cardId: string;
  hostId: string;
  unitName: string;
  displayName: string;
  description: string;
  allowStart: boolean;
  allowStop: boolean;
  allowRestart: boolean;
}

interface Host {
  id: string;
  name: string;
}

interface Card {
  id: string;
  title: string;
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [createData, setCreateData] = useState<CreateServiceData>({
    cardId: '',
    hostId: '',
    unitName: '',
    displayName: '',
    description: '',
    allowStart: true,
    allowStop: true,
    allowRestart: true,
  });
  const [updateData, setUpdateData] = useState<UpdateServiceData>({
    cardId: '',
    hostId: '',
    unitName: '',
    displayName: '',
    description: '',
    allowStart: true,
    allowStop: true,
    allowRestart: true,
  });
  const [actionStatuses, setActionStatuses] = useState<Record<string, string>>(
    {}
  );
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [selectedServiceForTimeline, setSelectedServiceForTimeline] =
    useState<Service | null>(null);
  const [timelineActions, setTimelineActions] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineRange, setTimelineRange] = useState('24h');
  const [actionConfirmDialogOpen, setActionConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    serviceId: string;
    kind: 'start' | 'stop' | 'restart';
    service: Service;
  } | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [servicesRes, hostsRes, cardsRes] = await Promise.all([
        fetch('/api/services/last-actions'),
        fetch('/api/hosts'),
        fetch('/api/cards/all'),
      ]);

      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData);
      }
      if (hostsRes.ok) {
        const hostsData = await hostsRes.json();
        setHosts(hostsData);
      }
      if (cardsRes.ok) {
        const cardsData = await cardsRes.json();
        setCards(cardsData);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Service created successfully',
        });
        setCreateDialogOpen(false);
        setCreateData({
          cardId: '',
          hostId: '',
          unitName: '',
          displayName: '',
          description: '',
          allowStart: true,
          allowStop: true,
          allowRestart: true,
        });
        fetchData();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to create service',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create service',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedService) return;

    try {
      const response = await fetch(`/api/services/${selectedService.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Service updated successfully',
        });
        setEditDialogOpen(false);
        setSelectedService(null);
        fetchData();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to update service',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update service',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedService) return;

    try {
      const response = await fetch(`/api/services/${selectedService.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Service deleted successfully',
        });
        setDeleteDialogOpen(false);
        setSelectedService(null);
        fetchData();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete service',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete service',
        variant: 'destructive',
      });
    }
  };

  const handleAction = async (
    serviceId: string,
    kind: 'start' | 'stop' | 'restart'
  ) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;

    // Show confirmation dialog for destructive operations
    if (kind === 'stop' || kind === 'restart') {
      setPendingAction({ serviceId, kind, service });
      setActionConfirmDialogOpen(true);
      return;
    }

    // Execute non-destructive actions immediately
    await executeAction(serviceId, kind, service);
  };

  const executeAction = async (
    serviceId: string,
    kind: 'start' | 'stop' | 'restart',
    service: Service
  ) => {
    try {
      const response = await fetch('/api/control/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostId: service.hostId,
          serviceId: serviceId,
          kind,
        }),
      });

      if (response.ok) {
        const action = await response.json();
        setActionStatuses((prev) => ({ ...prev, [action.id]: 'queued' }));

        toast({
          title: 'Action Queued',
          description: `${kind} action queued for ${service.displayName}`,
        });

        // Start polling for status updates
        pollActionStatus(action.id);
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || `Failed to queue ${kind} action`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to queue ${kind} action`,
        variant: 'destructive',
      });
    }
  };

  const confirmAction = async () => {
    if (!pendingAction) return;

    await executeAction(
      pendingAction.serviceId,
      pendingAction.kind,
      pendingAction.service
    );
    setActionConfirmDialogOpen(false);
    setPendingAction(null);
  };

  const pollActionStatus = async (actionId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/control/actions/${actionId}`);
        if (response.ok) {
          const action = await response.json();
          setActionStatuses((prev) => ({ ...prev, [actionId]: action.status }));

          if (action.status === 'succeeded' || action.status === 'failed') {
            toast({
              title: 'Action Complete',
              description: `${action.kind} action ${action.status} for ${action.service?.displayName || 'service'}`,
              variant:
                action.status === 'succeeded' ? 'default' : 'destructive',
            });
            return; // Stop polling
          }

          // Continue polling
          setTimeout(poll, 2000);
        }
      } catch (error) {
        console.error('Failed to poll action status:', error);
      }
    };

    poll();
  };

  const openEditDialog = (service: Service) => {
    setSelectedService(service);
    setUpdateData({
      cardId: service.cardId || '',
      hostId: service.hostId,
      unitName: service.unitName,
      displayName: service.displayName,
      description: service.description || '',
      allowStart: service.allowStart,
      allowStop: service.allowStop,
      allowRestart: service.allowRestart,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (service: Service) => {
    setSelectedService(service);
    setDeleteDialogOpen(true);
  };

  const openTimeline = async (service: Service) => {
    setSelectedServiceForTimeline(service);
    setTimelineOpen(true);
    await fetchTimelineActions(service.id, timelineRange);
  };

  const fetchTimelineActions = async (serviceId: string, range: string) => {
    setTimelineLoading(true);
    try {
      const response = await fetch(
        `/api/control/actions?serviceId=${serviceId}&range=${range}&limit=50`
      );
      if (response.ok) {
        const data = await response.json();
        setTimelineActions(data.actions || []);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch timeline actions',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch timeline actions',
        variant: 'destructive',
      });
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleTimelineRangeChange = async (range: string) => {
    setTimelineRange(range);
    if (selectedServiceForTimeline) {
      await fetchTimelineActions(selectedServiceForTimeline.id, range);
    }
  };

  const getStatusBadge = (actionId: string) => {
    const status = actionStatuses[actionId];
    if (!status) return null;

    const variants = {
      queued: 'bg-yellow-100 text-yellow-800',
      running: 'bg-blue-100 text-blue-800',
      succeeded: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };

    return (
      <span
        className={`text-xs px-2 py-1 rounded-full ${variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}`}
      >
        {status}
      </span>
    );
  };

  const getLastActionPill = (service: Service) => {
    if (!service.lastAction) {
      return (
        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
          No actions
        </span>
      );
    }

    const { lastAction } = service;
    const variants = {
      queued: 'bg-yellow-100 text-yellow-800',
      running: 'bg-blue-100 text-blue-800',
      succeeded: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };

    const duration =
      lastAction.finishedAt && lastAction.startedAt
        ? Math.round(
            (new Date(lastAction.finishedAt).getTime() -
              new Date(lastAction.startedAt).getTime()) /
              1000
          )
        : null;

    return (
      <span
        className={`text-xs px-2 py-1 rounded-full ${variants[lastAction.status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}`}
      >
        {lastAction.kind} {lastAction.status}
        {duration !== null && ` (${duration}s)`}
      </span>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
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
        <h1 className="text-3xl font-bold">Service Management</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Service</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="hostId">Host</Label>
                <select
                  id="hostId"
                  value={createData.hostId}
                  onChange={(e) =>
                    setCreateData({ ...createData, hostId: e.target.value })
                  }
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select a host</option>
                  {hosts.map((host) => (
                    <option key={host.id} value={host.id}>
                      {host.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="cardId">Link to Card (Optional)</Label>
                <select
                  id="cardId"
                  value={createData.cardId}
                  onChange={(e) =>
                    setCreateData({ ...createData, cardId: e.target.value })
                  }
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">No card link</option>
                  {cards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="unitName">Unit Name</Label>
                <Input
                  id="unitName"
                  value={createData.unitName}
                  onChange={(e) =>
                    setCreateData({ ...createData, unitName: e.target.value })
                  }
                  placeholder="e.g., nginx.service"
                />
              </div>
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={createData.displayName}
                  onChange={(e) =>
                    setCreateData({
                      ...createData,
                      displayName: e.target.value,
                    })
                  }
                  placeholder="e.g., Nginx Web Server"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={createData.description}
                  onChange={(e) =>
                    setCreateData({
                      ...createData,
                      description: e.target.value,
                    })
                  }
                  placeholder="e.g., High-performance web server"
                />
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowStart"
                    checked={createData.allowStart}
                    onCheckedChange={(checked) =>
                      setCreateData({ ...createData, allowStart: checked })
                    }
                  />
                  <Label htmlFor="allowStart">Allow Start</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowStop"
                    checked={createData.allowStop}
                    onCheckedChange={(checked) =>
                      setCreateData({ ...createData, allowStop: checked })
                    }
                  />
                  <Label htmlFor="allowStop">Allow Stop</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowRestart"
                    checked={createData.allowRestart}
                    onCheckedChange={(checked) =>
                      setCreateData({ ...createData, allowRestart: checked })
                    }
                  />
                  <Label htmlFor="allowRestart">Allow Restart</Label>
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full">
                Create Service
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {services.map((service) => (
          <Card key={service.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    {service.displayName}
                    {service.card && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center gap-1">
                        <Link className="h-3 w-3" />
                        {service.card.title}
                      </span>
                    )}
                  </CardTitle>
                  <p className="text-sm text-gray-600">{service.unitName}</p>
                  <p className="text-sm text-gray-500">
                    Host: {service.host.name}
                  </p>
                  {service.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {service.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openTimeline(service)}
                  >
                    <History className="h-4 w-4 mr-1" />
                    Timeline
                  </Button>
                  {service.allowStart && (
                    <Button
                      size="sm"
                      onClick={() => handleAction(service.id, 'start')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  {service.allowStop && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(service.id, 'stop')}
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                  )}
                  {service.allowRestart && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(service.id, 'restart')}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(service)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteDialog(service)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="font-medium">Permissions:</span>
                    <div className="flex gap-2 mt-1">
                      {service.allowStart && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          Start
                        </span>
                      )}
                      {service.allowStop && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                          Stop
                        </span>
                      )}
                      {service.allowRestart && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          Restart
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Last Action:</span>
                    <div className="mt-1">{getLastActionPill(service)}</div>
                  </div>
                </div>
                {getStatusBadge(service.id)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-hostId">Host</Label>
              <select
                id="edit-hostId"
                value={updateData.hostId}
                onChange={(e) =>
                  setUpdateData({ ...updateData, hostId: e.target.value })
                }
                className="w-full p-2 border rounded-md"
              >
                {hosts.map((host) => (
                  <option key={host.id} value={host.id}>
                    {host.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="edit-cardId">Link to Card (Optional)</Label>
              <select
                id="edit-cardId"
                value={updateData.cardId}
                onChange={(e) =>
                  setUpdateData({ ...updateData, cardId: e.target.value })
                }
                className="w-full p-2 border rounded-md"
              >
                <option value="">No card link</option>
                {cards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="edit-unitName">Unit Name</Label>
              <Input
                id="edit-unitName"
                value={updateData.unitName}
                onChange={(e) =>
                  setUpdateData({ ...updateData, unitName: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-displayName">Display Name</Label>
              <Input
                id="edit-displayName"
                value={updateData.displayName}
                onChange={(e) =>
                  setUpdateData({ ...updateData, displayName: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Input
                id="edit-description"
                value={updateData.description}
                onChange={(e) =>
                  setUpdateData({ ...updateData, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-allowStart"
                  checked={updateData.allowStart}
                  onCheckedChange={(checked) =>
                    setUpdateData({ ...updateData, allowStart: checked })
                  }
                />
                <Label htmlFor="edit-allowStart">Allow Start</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-allowStop"
                  checked={updateData.allowStop}
                  onCheckedChange={(checked) =>
                    setUpdateData({ ...updateData, allowStop: checked })
                  }
                />
                <Label htmlFor="edit-allowStop">Allow Stop</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-allowRestart"
                  checked={updateData.allowRestart}
                  onCheckedChange={(checked) =>
                    setUpdateData({ ...updateData, allowRestart: checked })
                  }
                />
                <Label htmlFor="edit-allowRestart">Allow Restart</Label>
              </div>
            </div>
            <Button onClick={handleUpdate} className="w-full">
              Update Service
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to delete service &quot;
              {selectedService?.displayName}&quot;? This action cannot be
              undone.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Timeline Side Panel */}
      <Dialog open={timelineOpen} onOpenChange={setTimelineOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Action Timeline - {selectedServiceForTimeline?.displayName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Time Range Filter */}
            <div className="flex gap-2">
              <Button
                variant={timelineRange === '1h' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTimelineRangeChange('1h')}
              >
                Last 1h
              </Button>
              <Button
                variant={timelineRange === '24h' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTimelineRangeChange('24h')}
              >
                Last 24h
              </Button>
              <Button
                variant={timelineRange === '7d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTimelineRangeChange('7d')}
              >
                Last 7d
              </Button>
            </div>

            {/* Actions List */}
            {timelineLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : timelineActions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No actions found for the selected time range.
              </div>
            ) : (
              <div className="space-y-3">
                {timelineActions.map((action) => (
                  <div key={action.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            action.status === 'succeeded'
                              ? 'bg-green-100 text-green-800'
                              : action.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : action.status === 'running'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {action.kind} {action.status}
                        </span>
                        {action.exitCode !== null && (
                          <span className="text-xs text-gray-500">
                            Exit: {action.exitCode}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTimestamp(action.requestedAt)}
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 mb-2">
                      <div>
                        <strong>Requested by:</strong>{' '}
                        {action.requestedBy || 'Unknown'}
                      </div>
                      {action.startedAt && (
                        <div>
                          <strong>Started:</strong>{' '}
                          {formatTimestamp(action.startedAt)}
                        </div>
                      )}
                      {action.finishedAt && (
                        <div>
                          <strong>Finished:</strong>{' '}
                          {formatTimestamp(action.finishedAt)}
                        </div>
                      )}
                      {action.startedAt && action.finishedAt && (
                        <div>
                          <strong>Duration:</strong>{' '}
                          {Math.round(
                            (new Date(action.finishedAt).getTime() -
                              new Date(action.startedAt).getTime()) /
                              1000
                          )}
                          s
                        </div>
                      )}
                    </div>

                    {action.message && (
                      <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                        {action.message.length > 200
                          ? `${action.message.substring(0, 200)}...`
                          : action.message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog
        open={actionConfirmDialogOpen}
        onOpenChange={setActionConfirmDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Destructive Action</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to <strong>{pendingAction?.kind}</strong>{' '}
              the service{' '}
              <strong>&quot;{pendingAction?.service.displayName}&quot;</strong>?
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Warning
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      This action will{' '}
                      {pendingAction?.kind === 'stop'
                        ? 'stop the service, potentially interrupting active connections'
                        : 'restart the service, causing a brief service interruption'}
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setActionConfirmDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmAction}
                className={
                  pendingAction?.kind === 'stop'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                }
              >
                {pendingAction?.kind === 'stop'
                  ? 'Stop Service'
                  : 'Restart Service'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
