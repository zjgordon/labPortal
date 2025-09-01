"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { CardEditDialog } from '@/components/card-edit-dialog'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Plus, Edit, Trash2, GripVertical, Eye, EyeOff, ExternalLink, Monitor } from 'lucide-react'

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
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [cards, setCards] = useState<AdminCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<AdminCard | null>(null)
  const [isNewCard, setIsNewCard] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/admin/login')
    }
  }, [status, router])

  // Fetch cards on component mount
  useEffect(() => {
    if (status === "authenticated") {
      fetchCards()
    }
  }, [status])

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
    } finally {
      setIsLoading(false)
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

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/admin/login')
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage lab portal cards and settings</p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={handleCreateCard}>
              <Plus className="w-4 h-4 mr-2" />
              New Card
            </Button>
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Cards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cards.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Enabled Cards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {cards.filter(card => card.isEnabled).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Disabled Cards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {cards.filter(card => !card.isEnabled).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Last Updated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date().toLocaleTimeString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards Management */}
        <Card>
          <CardHeader>
            <CardTitle>Lab Tool Cards</CardTitle>
            <CardDescription>
              Drag and drop to reorder cards. Click edit to modify details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading cards...</p>
              </div>
            ) : cards.length === 0 ? (
              <div className="text-center py-8">
                <Monitor className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Cards Found</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first lab tool card to get started.
                </p>
                <Button onClick={handleCreateCard}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Card
                </Button>
              </div>
            ) : (
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
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center gap-4 p-4 border rounded-lg bg-card ${
                                snapshot.isDragging ? 'shadow-lg ring-2 ring-primary' : ''
                              } ${!card.isEnabled ? 'opacity-60' : ''}`}
                            >
                              {/* Drag Handle */}
                              <div
                                {...provided.dragHandleProps}
                                className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical className="w-5 h-5" />
                              </div>

                              {/* Card Icon */}
                              <div className="w-10 h-10 flex-shrink-0">
                                {card.iconPath ? (
                                  <img
                                    src={card.iconPath}
                                    alt={`${card.title} icon`}
                                    className="w-10 h-10 object-contain"
                                  />
                                ) : (
                                  <div className="w-10 h-10 border-2 border-dashed border-muted-foreground rounded flex items-center justify-center">
                                    <Monitor className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                )}
                              </div>

                              {/* Card Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-foreground truncate">
                                    {card.title}
                                  </h3>
                                  {!card.isEnabled && (
                                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                                      Disabled
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {card.description}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span className="truncate">{card.url}</span>
                                  <span>Order: {card.order + 1}</span>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleEnabled(card.id, card.isEnabled)}
                                  title={card.isEnabled ? 'Disable card' : 'Enable card'}
                                >
                                  {card.isEnabled ? (
                                    <Eye className="w-4 h-4" />
                                  ) : (
                                    <EyeOff className="w-4 h-4" />
                                  )}
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(card.url, '_blank', 'noopener,noreferrer')}
                                  title="Open URL"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditCard(card)}
                                  title="Edit card"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
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
            )}
          </CardContent>
        </Card>
      </div>

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
  )
}
