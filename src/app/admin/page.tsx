"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { CardEditDialog } from '@/components/card-edit-dialog'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Plus, Edit, Trash2, GripVertical, Eye, EyeOff, ExternalLink, Monitor } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface AdminCard {
  id: string
  title: string
  description: string
  url: string
  healthPath: string | null
  group: string
  iconPath: string | null
  order: number
  isEnabled: boolean
  status?: {
    isUp: boolean
    lastChecked: string | null
    lastHttp: number | null
    latencyMs: number | null
    message: string | null
    failCount: number
    nextCheckAt: string | null
  } | null
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [cards, setCards] = useState<AdminCard[]>([])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<AdminCard | null>(null)
  const [isNewCard, setIsNewCard] = useState(false)
  const [showCardManager, setShowCardManager] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const fetchCards = useCallback(async () => {
    try {
      const response = await fetch('/api/cards/all')
      if (response.ok) {
        const data = await response.json()
        // Sort by group first, then by order within each group
        setCards(data.sort((a: AdminCard, b: AdminCard) => {
          if (a.group !== b.group) {
            return a.group.localeCompare(b.group)
          }
          return a.order - b.order
        }))
      } else {
        throw new Error('Failed to fetch cards')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch cards. Please try again.",
        variant: "destructive",
      })
    }
  }, [toast])

    const checkAuth = useCallback(() => {
    console.log('=== checkAuth function called ===')
    
    const authFlag = localStorage.getItem('admin-authenticated')
    const loginTime = localStorage.getItem('admin-login-time')
    
    console.log('Auth check - authFlag:', authFlag, 'loginTime:', loginTime)
    
    if (authFlag === 'true' && loginTime) {
      const loginTimestamp = parseInt(loginTime)
      const now = Date.now()
      const hoursSinceLogin = (now - loginTimestamp) / (1000 * 60 * 60)
      
      console.log('Hours since login:', hoursSinceLogin)
      
      // Check if login is within last 24 hours
      if (hoursSinceLogin < 24) {
        console.log('Authentication successful, setting authenticated to true')
        setIsAuthenticated(true)
        fetchCards()
      } else {
        console.log('Login expired, redirecting to login')
        localStorage.removeItem('admin-authenticated')
        localStorage.removeItem('admin-login-time')
        router.push('/admin/login')
      }
    } else {
      console.log('No valid auth found, redirecting to login')
      router.push('/admin/login')
    }
    
    setIsLoading(false)
  }, [fetchCards, router])

  useEffect(() => {
    // Check authentication on component mount
    // Add a small delay to ensure localStorage is available after redirect
    const timer = setTimeout(() => {
      checkAuth()
    }, 200)
    
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const { source, destination } = result
    const items = Array.from(cards)
    
    // Find the dragged item
    const [draggedItem] = items.splice(source.index, 1)
    
    // Insert at destination
    items.splice(destination.index, 0, draggedItem)

    // Update local state immediately for responsive UI
    // Recalculate order values for all items
    const updatedItems = items.map((item, index) => ({ ...item, order: index }))
    setCards(updatedItems)

    // Persist the new order to the server
    try {
      const reorderData = updatedItems.map((item, index) => ({
        id: item.id,
        order: index,
        group: item.group,
      }))

      const response = await fetch('/api/cards/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: reorderData }),
      })

      if (!response.ok) {
        throw new Error('Failed to reorder cards')
      }

      toast({
        title: "Success",
        description: "Card order updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update card order. Please try again.",
        variant: "destructive",
      })
      // Revert to original order on error
      fetchCards()
    }
  }

  const handleCreateCard = () => {
    setEditingCard(null)
    setIsNewCard(true)
    setEditDialogOpen(true)
  }

  const handleEditCard = (card: AdminCard) => {
    setEditingCard(card)
    setIsNewCard(false)
    setEditDialogOpen(true)
  }

  const handleSaveCard = async (cardData: { title: string; description: string; url: string; healthPath?: string; group: string; isEnabled: boolean }) => {
    try {
      if (isNewCard) {
        // Create new card
        const response = await fetch('/api/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cardData),
        })

        if (!response.ok) {
          throw new Error('Failed to create card')
        }

        toast({
          title: "Success",
          description: "Card created successfully.",
        })
      } else if (editingCard) {
        // Update existing card
        const response = await fetch(`/api/cards/${editingCard.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cardData),
        })

        if (!response.ok) {
          throw new Error('Failed to update card')
        }

        toast({
          title: "Success",
          description: "Card updated successfully.",
        })
      }

      // Refresh the cards list
      fetchCards()
    } catch (error) {
      toast({
        title: "Error",
        description: isNewCard ? "Failed to create card." : "Failed to update card.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCard = async () => {
    if (!editingCard) return

    try {
      const response = await fetch(`/api/cards/${editingCard.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete card')
      }

      toast({
        title: "Success",
        description: "Card deleted successfully.",
      })

      setEditDialogOpen(false)
      fetchCards()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete card. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleToggleEnabled = async (cardId: string, currentEnabled: boolean) => {
    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !currentEnabled }),
      })

      if (!response.ok) {
        throw new Error('Failed to update card')
      }

      // Update local state
      setCards(cards.map(card => 
        card.id === cardId ? { ...card, isEnabled: !currentEnabled } : card
      ))

      toast({
        title: "Success",
        description: `Card ${!currentEnabled ? 'enabled' : 'disabled'} successfully.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update card status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin-authenticated')
    localStorage.removeItem('admin-login-time')
    router.push('/admin/login')
  }

  const handleExportCards = async () => {
    try {
      const response = await fetch('/api/cards/export')
      if (!response.ok) {
        throw new Error('Failed to export cards')
      }
      
      const cards = await response.json()
      
      // Create and download the JSON file
      const blob = new Blob([JSON.stringify(cards, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lab-portal-cards-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: "Export Successful",
        description: `Exported ${cards.length} cards successfully.`,
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export cards. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleImportCards = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const cards = JSON.parse(text)
      
      if (!Array.isArray(cards)) {
        throw new Error('Invalid file format: expected JSON array')
      }

      const response = await fetch('/api/cards/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Import failed')
      }

      const result = await response.json()
      
      toast({
        title: "Import Successful",
        description: result.message,
      })

      // Refresh the cards list
      fetchCards()
      
      // Reset the file input
      event.target.value = ''
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import cards. Please check the file format.",
        variant: "destructive",
      })
    }
  }

  // Group cards by their group for display
  const groupedCards = useMemo(() => {
    const grouped: { [key: string]: AdminCard[] } = {}
    cards.forEach(card => {
      if (!grouped[card.group]) {
        grouped[card.group] = []
      }
      grouped[card.group].push(card)
    })
    
    // Sort groups alphabetically
    Object.keys(grouped).forEach(group => {
      grouped[group].sort((a, b) => a.order - b.order)
    })
    
    return grouped
  }, [cards])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-400 mx-auto"></div>
          <p className="mt-4 text-slate-400">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (showCardManager) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100">
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-100 mb-2">Card Management</h1>
              <p className="text-slate-400">Create, edit, and organize lab tool cards</p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowCardManager(false)} 
                variant="outline" 
                className="border-emerald-400/50 text-emerald-400 hover:bg-emerald-400/10 hover:border-emerald-400 hover:text-emerald-300 transition-all duration-200 shadow-[0_0_10px_rgba(52,211,153,0.3)] hover:shadow-[0_0_15px_rgba(52,211,153,0.5)]"
              >
                Back to Config
              </Button>
              <Button onClick={handleLogout} variant="outline" className="border-emerald-400/50 text-emerald-400 hover:bg-emerald-400/10 hover:border-emerald-400 hover:text-emerald-300 transition-all duration-200 shadow-[0_0_10px_rgba(52,211,153,0.3)] hover:shadow-[0_0_15px_rgba(52,211,153,0.5)]">
                Logout
              </Button>
            </div>
          </div>

          {/* Add New Card Button */}
          <div className="mb-6 flex gap-3">
            <Button onClick={handleCreateCard} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_10px_rgba(52,211,153,0.3)] hover:shadow-[0_0_15px_rgba(52,211,153,0.5)] transition-all duration-200">
              <Plus className="w-4 h-4 mr-2" />
              Add New Card
            </Button>
            <Button 
              onClick={handleExportCards}
              variant="outline"
              className="border-blue-400/50 text-blue-400 hover:bg-blue-400/10 hover:border-blue-400 hover:text-blue-300 transition-all duration-200"
            >
              Export Cards
            </Button>
            <Button 
              onClick={() => document.getElementById('import-file-manager')?.click()}
              variant="outline"
              className="border-purple-400/50 text-purple-400 hover:bg-purple-400/10 hover:border-purple-400 hover:text-purple-300 transition-all duration-200"
            >
              Import Cards
            </Button>
            <input
              id="import-file-manager"
              type="file"
              accept=".json"
              onChange={handleImportCards}
              className="hidden"
            />
          </div>

          {/* Cards List */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="cards">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-8"
                >
                  {Object.entries(groupedCards).map(([group, groupCards]) => (
                    <div key={group} className="space-y-4">
                      {/* Group Header */}
                      <div className="border-b border-slate-600 pb-2">
                        <h3 className="text-xl font-semibold text-slate-200">
                          {group}
                          <span className="ml-3 text-sm font-normal text-slate-400">
                            ({groupCards.length} card{groupCards.length !== 1 ? 's' : ''})
                          </span>
                        </h3>
                      </div>
                      
                      {/* Group Cards */}
                      <div className="space-y-3">
                        {groupCards.map((card, index) => (
                          <Draggable key={card.id} draggableId={card.id} index={cards.findIndex(c => c.id === card.id)}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
                              >
                                <div className="flex items-center gap-4">
                                  {/* Drag Handle */}
                                  <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                    <GripVertical className="w-5 h-5 text-slate-500" />
                                  </div>

                                  {/* Card Icon */}
                                  <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
                                    {card.iconPath ? (
                                      <Image 
                                        src={card.iconPath} 
                                        alt={`${card.title} icon`}
                                        width={32}
                                        height={32}
                                        className="object-contain"
                                      />
                                    ) : (
                                      <Monitor className="w-6 h-6 text-slate-400" />
                                    )}
                                  </div>

                                  {/* Card Info */}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h3 className="font-semibold text-slate-100">{card.title}</h3>
                                      <div className="flex items-center gap-2">
                                        {card.isEnabled ? (
                                          <Eye className="w-4 h-4 text-emerald-400" />
                                        ) : (
                                          <EyeOff className="w-4 h-4 text-slate-500" />
                                        )}
                                        <span className={`text-xs px-2 py-1 rounded ${
                                          card.isEnabled 
                                            ? 'bg-emerald-500/20 text-emerald-400' 
                                            : 'bg-slate-600/50 text-slate-400'
                                        }`}>
                                          {card.isEnabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                        <span className="text-xs px-2 py-1 rounded bg-slate-600/50 text-slate-400">
                                          {card.group}
                                        </span>
                                      </div>
                                    </div>
                                    <p className="text-sm text-slate-400 mb-2">{card.description}</p>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                                      <ExternalLink className="w-3 h-3" />
                                      {card.url}
                                    </div>
                                    
                                    {/* Enhanced Status Display */}
                                    {card.status && (
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-xs">
                                          <div className={`w-2 h-2 rounded-full ${
                                            card.status.isUp ? 'bg-emerald-400' : 'bg-red-400'
                                          }`} />
                                          <span className={card.status.isUp ? 'text-emerald-400' : 'text-red-400'}>
                                            {card.status.isUp ? 'UP' : 'DOWN'}
                                          </span>
                                          {card.status.failCount > 0 && (
                                            <span className="text-orange-400">
                                              (Failed {card.status.failCount} times)
                                            </span>
                                          )}
                                        </div>
                                        {card.status.lastHttp && (
                                          <div className="text-xs text-slate-500">
                                            HTTP: {card.status.lastHttp}
                                          </div>
                                        )}
                                        {card.status.message && (
                                          <div className="text-xs text-slate-500">
                                            {card.status.message}
                                          </div>
                                        )}
                                        {card.status.nextCheckAt && (
                                          <div className="text-xs text-slate-500">
                                            Next check: {new Date(card.status.nextCheckAt).toLocaleTimeString()}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-2">
                                    <Button
                                      onClick={() => handleToggleEnabled(card.id, card.isEnabled)}
                                      variant="outline"
                                      size="sm"
                                      className={`border-slate-600 text-slate-300 hover:bg-slate-700 ${
                                        card.isEnabled ? 'hover:text-red-400' : 'hover:text-emerald-400'
                                      }`}
                                    >
                                      {card.isEnabled ? 'Disable' : 'Enable'}
                                    </Button>
                                    <Button
                                      onClick={() => handleEditCard(card)}
                                      variant="outline"
                                      size="sm"
                                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      </div>
                    </div>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Edit Dialog */}
          <CardEditDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            card={editingCard}
            onSave={handleSaveCard}
            onDelete={handleDeleteCard}
            isNew={isNewCard}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-5xl font-bold text-slate-100 mb-4 tracking-tight">Portal Configuration</h1>
            <p className="text-xl text-slate-400 mb-2">Configure and manage your lab portal</p>
            <p className="text-sm text-slate-500">Simple password-based access</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => router.push('/')} 
              variant="outline" 
              className="border-emerald-400/50 text-emerald-400 hover:bg-emerald-400/10 hover:border-emerald-400 hover:text-emerald-300 transition-all duration-200 shadow-[0_0_10px_rgba(52,211,153,0.3)] hover:shadow-[0_0_15px_rgba(52,211,153,0.5)]"
            >
              ← Back to Portal
            </Button>
            <Button onClick={handleLogout} variant="outline" className="border-emerald-400/50 text-emerald-400 hover:bg-emerald-400/10 hover:border-emerald-400 hover:text-emerald-300 transition-all duration-200 shadow-[0_0_10px_rgba(52,211,153,0.3)] hover:shadow-[0_0_15px_rgba(52,211,153,0.5)]">
              Logout
            </Button>
          </div>
        </div>

        {/* Configuration Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="bg-slate-800 border-slate-700 text-slate-100 hover:border-slate-600 transition-colors">
            <CardHeader>
              <CardTitle className="text-slate-100">Lab Tools</CardTitle>
              <CardDescription className="text-slate-400">
                Manage the cards displayed on the main portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400 mb-6">
                Add, edit, and organize lab tool cards that users can access.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => setShowCardManager(true)} 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-[0_0_10px_rgba(52,211,153,0.3)] hover:shadow-[0_0_15px_rgba(52,211,153,0.5)] transition-all duration-200"
                >
                  Manage Lab Tools
                </Button>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleExportCards}
                    variant="outline"
                    className="flex-1 border-blue-400/50 text-blue-400 hover:bg-blue-400/10 hover:border-blue-400 hover:text-blue-300 transition-all duration-200"
                  >
                    Export Cards
                  </Button>
                  <Button 
                    onClick={() => document.getElementById('import-file')?.click()}
                    variant="outline"
                    className="flex-1 border-purple-400/50 text-purple-400 hover:bg-purple-400/10 hover:border-purple-400 hover:text-purple-300 transition-all duration-200"
                  >
                    Import Cards
                  </Button>
                </div>
                <input
                  id="import-file"
                  type="file"
                  accept=".json"
                  onChange={handleImportCards}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 text-slate-100 hover:border-slate-600 transition-colors">
            <CardHeader>
              <CardTitle className="text-slate-100">Portal Settings</CardTitle>
              <CardDescription className="text-slate-400">
                Configure portal appearance and behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400 mb-6">
                Customize the portal&apos;s look, title, and other settings.
              </p>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-[0_0_10px_rgba(52,211,153,0.3)] hover:shadow-[0_0_15px_rgba(52,211,153,0.5)] transition-all duration-200">
                Configure Portal
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Status */}
        <Card className="bg-slate-800 border-slate-700 text-slate-100">
          <CardHeader>
            <CardTitle className="text-slate-100">System Status</CardTitle>
            <CardDescription className="text-slate-400">
              Current portal configuration status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <span className="font-medium text-slate-200">Authentication</span>
                <span className="text-emerald-400 font-semibold">✓ Active</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <span className="font-medium text-slate-200">Portal Access</span>
                <span className="text-blue-400 font-semibold">✓ Available</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <span className="font-medium text-slate-200">Last Login</span>
                <span className="text-slate-400">
                  {new Date(parseInt(localStorage.getItem('admin-login-time') || '0')).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <span className="font-medium text-slate-200">Total Cards</span>
                <span className="text-slate-400 font-semibold">{cards.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
