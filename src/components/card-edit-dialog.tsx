"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

export interface CardEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  card?: {
    id: string
    title: string
    description: string
    url: string
    iconPath?: string | null
    isEnabled: boolean
  } | null
  onSave: (cardData: { title: string; description: string; url: string; isEnabled: boolean }) => void
  onDelete?: () => void
  isNew?: boolean
}

export function CardEditDialog({ 
  open, 
  onOpenChange, 
  card, 
  onSave, 
  onDelete, 
  isNew = false 
}: CardEditDialogProps) {
  const [title, setTitle] = useState(card?.title || '')
  const [description, setDescription] = useState(card?.description || '')
  const [url, setUrl] = useState(card?.url || '')
  const [isEnabled, setIsEnabled] = useState(card?.isEnabled ?? true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedIconPath, setUploadedIconPath] = useState(card?.iconPath || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleSave = () => {
    // Enhanced validation
    if (!title.trim() || !description.trim() || !url.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    // Enhanced URL validation - allow relative paths and local URLs
    let isValidUrl = false
    try {
      if (url.startsWith('/')) {
        // Allow relative paths for reverse proxy
        isValidUrl = true
      } else {
        const parsedUrl = new URL(url)
        // Allow http, https protocols
        if (['http:', 'https:'].includes(parsedUrl.protocol)) {
          const hostname = parsedUrl.hostname.toLowerCase()
          // Allow localhost, .local domains, and private IP ranges
          if (hostname === 'localhost' || 
              hostname.endsWith('.local') ||
              hostname.match(/^10\.|^172\.(1[6-9]|2[0-9]|3[01])\.|^192\.168\./)) {
            isValidUrl = true
          } else {
            // Allow other domains
            isValidUrl = true
          }
        }
      }
    } catch {
      isValidUrl = false
    }

    if (!isValidUrl) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid URL (HTTP/HTTPS or relative path starting with /).",
        variant: "destructive",
      })
      return
    }

    onSave({ title: title.trim(), description: description.trim(), url: url.trim(), isEnabled })
    onOpenChange(false)
  }

  const handleIconUpload = async (file: File) => {
    if (!card?.id) return

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PNG or JPEG image.",
        variant: "destructive",
      })
      return
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 2MB.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('icon', file)

    try {
      const response = await fetch(`/api/cards/${card.id}/icon`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setUploadedIconPath(data.iconPath)
        toast({
          title: "Icon Uploaded",
          description: "Card icon has been updated successfully.",
        })
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload icon. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleIconUpload(file)
    }
  }

  const removeIcon = () => {
    setUploadedIconPath(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const resetForm = () => {
    setTitle(card?.title || '')
    setDescription(card?.description || '')
    setUrl(card?.url || '')
    setIsEnabled(card?.isEnabled ?? true)
    setUploadedIconPath(card?.iconPath || null)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isNew ? 'Create New Card' : 'Edit Card'}
          </DialogTitle>
          <DialogDescription>
            {isNew ? 'Add a new lab tool card to the portal.' : 'Update the card details and settings.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter card title"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter card description"
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="grid gap-2">
              <Label htmlFor="isEnabled">Enabled</Label>
              <div className="text-sm text-muted-foreground">
                {isEnabled ? 'Card is visible on the homepage' : 'Card is hidden from the homepage'}
              </div>
            </div>
            <Switch
              id="isEnabled"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>

          {!isNew && (
            <div className="grid gap-2">
              <Label>Icon</Label>
              <div className="flex items-center gap-3">
                {uploadedIconPath ? (
                  <div className="relative">
                    <img
                      src={uploadedIconPath}
                      alt="Card icon"
                      className="w-12 h-12 object-contain border rounded"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 p-0"
                      onClick={removeIcon}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-12 h-12 border-2 border-dashed border-muted-foreground rounded flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>Uploading...</>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadedIconPath ? 'Change Icon' : 'Upload Icon'}
                      </>
                    )}
                  </Button>
                  <div className="text-xs text-muted-foreground mt-1">
                    PNG or JPEG, max 2MB
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {!isNew && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
              >
                Delete Card
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {isNew ? 'Create Card' : 'Save Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
