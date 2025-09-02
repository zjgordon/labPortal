'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Edit, Trash2, Play, Square, RotateCcw, Server, Link, Unlink } from 'lucide-react'

interface Service {
  id: string
  cardId: string | null
  hostId: string
  unitName: string
  displayName: string
  description: string | null
  allowStart: boolean
  allowStop: boolean
  allowRestart: boolean
  host: {
    id: string
    name: string
  }
  card?: {
    id: string
    title: string
  }
}

interface CreateServiceData {
  cardId: string
  hostId: string
  unitName: string
  displayName: string
  description: string
  allowStart: boolean
  allowStop: boolean
  allowRestart: boolean
}

interface UpdateServiceData {
  cardId: string
  hostId: string
  unitName: string
  displayName: string
  description: string
  allowStart: boolean
  allowStop: boolean
  allowRestart: boolean
}

interface Host {
  id: string
  name: string
}

interface Card {
  id: string
  title: string
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [hosts, setHosts] = useState<Host[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [createData, setCreateData] = useState<CreateServiceData>({
    cardId: '',
    hostId: '',
    unitName: '',
    displayName: '',
    description: '',
    allowStart: true,
    allowStop: true,
    allowRestart: true,
  })
  const [updateData, setUpdateData] = useState<UpdateServiceData>({
    cardId: '',
    hostId: '',
    unitName: '',
    displayName: '',
    description: '',
    allowStart: true,
    allowStop: true,
    allowRestart: true,
  })
  const [actionStatuses, setActionStatuses] = useState<Record<string, string>>({})
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const [servicesRes, hostsRes, cardsRes] = await Promise.all([
        fetch('/api/services'),
        fetch('/api/hosts'),
        fetch('/api/cards/all')
      ])

      if (servicesRes.ok) {
        const servicesData = await servicesRes.json()
        setServices(servicesData)
      }
      if (hostsRes.ok) {
        const hostsData = await hostsRes.json()
        setHosts(hostsData)
      }
      if (cardsRes.ok) {
        const cardsData = await cardsRes.json()
        setCards(cardsData)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Service created successfully",
        })
        setCreateDialogOpen(false)
        setCreateData({
          cardId: '',
          hostId: '',
          unitName: '',
          displayName: '',
          description: '',
          allowStart: true,
          allowStop: true,
          allowRestart: true,
        })
        fetchData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to create service",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create service",
        variant: "destructive",
      })
    }
  }

  const handleUpdate = async () => {
    if (!selectedService) return

    try {
      const response = await fetch(`/api/services/${selectedService.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Service updated successfully",
        })
        setEditDialogOpen(false)
        setSelectedService(null)
        fetchData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to update service",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update service",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedService) return

    try {
      const response = await fetch(`/api/services/${selectedService.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Service deleted successfully",
        })
        setDeleteDialogOpen(false)
        setSelectedService(null)
        fetchData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to delete service",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      })
    }
  }

  const handleAction = async (serviceId: string, kind: 'start' | 'stop' | 'restart') => {
    const service = services.find(s => s.id === serviceId)
    if (!service) return

    try {
      const response = await fetch('/api/control/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostId: service.hostId,
          serviceId: serviceId,
          kind,
        }),
      })

      if (response.ok) {
        const action = await response.json()
        setActionStatuses(prev => ({ ...prev, [action.id]: 'queued' }))
        
        toast({
          title: "Action Queued",
          description: `${kind} action queued for ${service.displayName}`,
        })

        // Start polling for status updates
        pollActionStatus(action.id)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || `Failed to queue ${kind} action`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to queue ${kind} action`,
        variant: "destructive",
      })
    }
  }

  const pollActionStatus = async (actionId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/control/actions/${actionId}`)
        if (response.ok) {
          const action = await response.json()
          setActionStatuses(prev => ({ ...prev, [actionId]: action.status }))
          
          if (action.status === 'succeeded' || action.status === 'failed') {
            toast({
              title: "Action Complete",
              description: `${action.kind} action ${action.status} for ${action.service?.displayName || 'service'}`,
              variant: action.status === 'succeeded' ? 'default' : 'destructive',
            })
            return // Stop polling
          }
          
          // Continue polling
          setTimeout(poll, 2000)
        }
      } catch (error) {
        console.error('Failed to poll action status:', error)
      }
    }
    
    poll()
  }

  const openEditDialog = (service: Service) => {
    setSelectedService(service)
    setUpdateData({
      cardId: service.cardId || '',
      hostId: service.hostId,
      unitName: service.unitName,
      displayName: service.displayName,
      description: service.description || '',
      allowStart: service.allowStart,
      allowStop: service.allowStop,
      allowRestart: service.allowRestart,
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (service: Service) => {
    setSelectedService(service)
    setDeleteDialogOpen(true)
  }

  const getStatusBadge = (actionId: string) => {
    const status = actionStatuses[actionId]
    if (!status) return null

    const variants = {
      queued: 'bg-yellow-100 text-yellow-800',
      running: 'bg-blue-100 text-blue-800',
      succeeded: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    }

    return (
      <span className={`text-xs px-2 py-1 rounded-full ${variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
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
                  onChange={(e) => setCreateData({ ...createData, hostId: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select a host</option>
                  {hosts.map(host => (
                    <option key={host.id} value={host.id}>{host.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="cardId">Link to Card (Optional)</Label>
                <select
                  id="cardId"
                  value={createData.cardId}
                  onChange={(e) => setCreateData({ ...createData, cardId: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">No card link</option>
                  {cards.map(card => (
                    <option key={card.id} value={card.id}>{card.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="unitName">Unit Name</Label>
                <Input
                  id="unitName"
                  value={createData.unitName}
                  onChange={(e) => setCreateData({ ...createData, unitName: e.target.value })}
                  placeholder="e.g., nginx.service"
                />
              </div>
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={createData.displayName}
                  onChange={(e) => setCreateData({ ...createData, displayName: e.target.value })}
                  placeholder="e.g., Nginx Web Server"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={createData.description}
                  onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                  placeholder="e.g., High-performance web server"
                />
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowStart"
                    checked={createData.allowStart}
                    onCheckedChange={(checked) => setCreateData({ ...createData, allowStart: checked })}
                  />
                  <Label htmlFor="allowStart">Allow Start</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowStop"
                    checked={createData.allowStop}
                    onCheckedChange={(checked) => setCreateData({ ...createData, allowStop: checked })}
                  />
                  <Label htmlFor="allowStop">Allow Stop</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowRestart"
                    checked={createData.allowRestart}
                    onCheckedChange={(checked) => setCreateData({ ...createData, allowRestart: checked })}
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
                  <p className="text-sm text-gray-500">Host: {service.host.name}</p>
                  {service.description && (
                    <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
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
                      {service.allowStart && <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Start</span>}
                      {service.allowStop && <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Stop</span>}
                      {service.allowRestart && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Restart</span>}
                    </div>
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
                onChange={(e) => setUpdateData({ ...updateData, hostId: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                {hosts.map(host => (
                  <option key={host.id} value={host.id}>{host.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="edit-cardId">Link to Card (Optional)</Label>
              <select
                id="edit-cardId"
                value={updateData.cardId}
                onChange={(e) => setUpdateData({ ...updateData, cardId: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="">No card link</option>
                {cards.map(card => (
                  <option key={card.id} value={card.id}>{card.title}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="edit-unitName">Unit Name</Label>
              <Input
                id="edit-unitName"
                value={updateData.unitName}
                onChange={(e) => setUpdateData({ ...updateData, unitName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-displayName">Display Name</Label>
              <Input
                id="edit-displayName"
                value={updateData.displayName}
                onChange={(e) => setUpdateData({ ...updateData, displayName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Input
                id="edit-description"
                value={updateData.description}
                onChange={(e) => setUpdateData({ ...updateData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-allowStart"
                  checked={updateData.allowStart}
                  onCheckedChange={(checked) => setUpdateData({ ...updateData, allowStart: checked })}
                />
                <Label htmlFor="edit-allowStart">Allow Start</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-allowStop"
                  checked={updateData.allowStop}
                  onCheckedChange={(checked) => setUpdateData({ ...updateData, allowStop: checked })}
                />
                <Label htmlFor="edit-allowStop">Allow Stop</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-allowRestart"
                  checked={updateData.allowRestart}
                  onCheckedChange={(checked) => setUpdateData({ ...updateData, allowRestart: checked })}
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
                Are you sure you want to delete service &quot;{selectedService?.displayName}&quot;? This action cannot be undone.
              </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
