"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import { CardEditDialog } from '@/components/card-edit-dialog'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Plus, Edit, Trash2, GripVertical, Eye, EyeOff, ExternalLink, Monitor } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AdminCard {
  id: string
  title: string
  description: string
  url: string
  iconPath: string | null
  order: number
  isEnabled: boolean
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

  useEffect(() => {
    // Check authentication on component mount
    checkAuth()
  }, [])

  const checkAuth = () => {
    const authFlag = localStorage.getItem('admin-authenticated')
    const loginTime = localStorage.getItem('admin-login-time')
    
    if (authFlag === 'true' && loginTime) {
      const loginTimestamp = parseInt(loginTime)
      const now = Date.now()
      const hoursSinceLogin = (now - loginTimestamp) / (1000 * 60 * 60)
      
      // Check if login is within last 24 hours
      if (hoursSinceLogin < 24) {
        setIsAuthenticated(true)
        fetchCards()
      } else {
        localStorage.removeItem('admin-authenticated')
        localStorage.removeItem('admin-login-time')
        window.location.href = '/admin/login'
      }
    } else {
      window.location.href = '/admin/login'
    }
    
    setIsLoading(false)
  }

  const fetchCards = async () => {
    try {
      const response = await fetch('/api/cards/all')
      if (response.ok) {
        const data = await response.json()
        setCards(data.sort((a: AdminCard, b: AdminCard) => a.order - b.order))
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
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(cards)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update local state immediately for responsive UI
    setCards(items.map((item, index) => ({ ...item, order: index })))

    // Persist the new order to the server
    try {
      const reorderData = items.map((item, index) => ({
        id: item.id,
        order: index,
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

  const handleSaveCard = async (cardData: { title: string; description: string; url: string; isEnabled: boolean }) => {
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
    window.location.href = '/admin/login'
  }

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
                className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
              >
                Back to Config
              </Button>
              <Button onClick={handleLogout} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-slate-100">
                Logout
              </Button>
            </div>
          </div>

          {/* Add New Card Button */}
          <div className="mb-6">
            <Button onClick={handleCreateCard} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add New Card
            </Button>
          </div>

          {/* Cards List */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="cards">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3"
                >
                  {cards.map((card, index) => (
                    <Draggable key={card.id} draggableId={card.id} index={index}>
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
                                <img 
                                  src={card.iconPath} 
                                  alt={`${card.title} icon`}
                                  className="w-8 h-8 object-contain"
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
                                </div>
                              </div>
                              <p className="text-sm text-slate-400 mb-2">{card.description}</p>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <ExternalLink className="w-3 h-3" />
                                {card.url}
                              </div>
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
          <Button onClick={handleLogout} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-slate-100">
            Logout
          </Button>
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
              <Button 
                onClick={() => setShowCardManager(true)} 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-0"
              >
                Manage Lab Tools
              </Button>
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
                Customize the portal's look, title, and other settings.
              </p>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-0">
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
