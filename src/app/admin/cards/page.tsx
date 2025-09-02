'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Edit, Trash2, GripVertical, Eye, EyeOff, ExternalLink, Monitor, Upload } from 'lucide-react'
import { CardEditDialog } from '@/components/card-edit-dialog'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
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

export default function AdminCardsPage() {
  const [cards, setCards] = useState<AdminCard[]>([])
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<AdminCard | null>(null)
  const [isNewCard, setIsNewCard] = useState(false)
  const { toast } = useToast()

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
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchCards()
  }, [fetchCards])

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
  const groupedCards = cards.reduce((grouped: { [key: string]: AdminCard[] }, card) => {
    if (!grouped[card.group]) {
      grouped[card.group] = []
    }
    grouped[card.group].push(card)
    return grouped
  }, {})

  // Sort groups alphabetically
  Object.keys(groupedCards).forEach(group => {
    groupedCards[group].sort((a, b) => a.order - b.order)
  })

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
        <h1 className="text-3xl font-bold">Portal Cards Management</h1>
        <div className="flex gap-3">
          <Button 
            onClick={handleExportCards}
            variant="outline"
          >
            Export Cards
          </Button>
          <Button 
            onClick={() => document.getElementById('import-file')?.click()}
            variant="outline"
          >
            Import Cards
          </Button>
          <input
            id="import-file"
            type="file"
            accept=".json"
            onChange={handleImportCards}
            className="hidden"
          />
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreateCard}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Card
              </Button>
            </DialogTrigger>
            <DialogContent>
              <CardEditDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                card={editingCard}
                onSave={handleSaveCard}
                onDelete={handleDeleteCard}
                isNew={isNewCard}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

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
                  <div className="border-b border-gray-200 pb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {group}
                      <span className="ml-3 text-sm font-normal text-gray-500">
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
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              {/* Drag Handle */}
                              <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                <GripVertical className="w-5 h-5 text-gray-400" />
                              </div>

                              {/* Card Icon */}
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                {card.iconPath ? (
                                  <Image 
                                    src={card.iconPath} 
                                    alt={`${card.title} icon`}
                                    width={32}
                                    height={32}
                                    className="object-contain"
                                  />
                                ) : (
                                  <Monitor className="w-6 h-6 text-gray-400" />
                                )}
                              </div>

                              {/* Card Info */}
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-gray-900">{card.title}</h3>
                                  <div className="flex items-center gap-2">
                                    {card.isEnabled ? (
                                      <Eye className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <EyeOff className="w-4 w-4 text-gray-400" />
                                    )}
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      card.isEnabled 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {card.isEnabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                                      {card.group}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{card.description}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                  <ExternalLink className="w-3 h-3" />
                                  {card.url}
                                </div>
                                
                                {/* Enhanced Status Display */}
                                {card.status && (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs">
                                      <div className={`w-2 h-2 rounded-full ${
                                        card.status.isUp ? 'bg-green-400' : 'bg-red-400'
                                      }`} />
                                      <span className={card.status.isUp ? 'text-green-600' : 'text-red-600'}>
                                        {card.status.isUp ? 'UP' : 'DOWN'}
                                      </span>
                                      {card.status.failCount > 0 && (
                                        <span className="text-orange-600">
                                          (Failed {card.status.failCount} times)
                                        </span>
                                      )}
                                    </div>
                                    {card.status.lastHttp && (
                                      <div className="text-xs text-gray-500">
                                        HTTP: {card.status.lastHttp}
                                      </div>
                                    )}
                                    {card.status.message && (
                                      <div className="text-xs text-gray-500">
                                        {card.status.message}
                                      </div>
                                    )}
                                    {card.status.nextCheckAt && (
                                      <div className="text-xs text-gray-500">
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
                                  className={card.isEnabled ? 'hover:text-red-600' : 'hover:text-green-600'}
                                >
                                  {card.isEnabled ? 'Disable' : 'Enable'}
                                </Button>
                                <Button
                                  onClick={() => handleEditCard(card)}
                                  variant="outline"
                                  size="sm"
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
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <CardEditDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            card={editingCard}
            onSave={handleSaveCard}
            onDelete={handleDeleteCard}
            isNew={isNewCard}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
