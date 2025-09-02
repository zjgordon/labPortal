"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusIndicator } from "@/components/status-indicator"
import { ExternalLink, Monitor } from "lucide-react"
import Image from "next/image"

export interface LabCardProps {
  id: string
  title: string
  description: string
  url: string
  iconPath?: string | null
  order: number
}

interface CardStatus {
  isUp: boolean | null
  lastChecked: string | null
  lastHttp: number | null
  latencyMs: number | null
}

export function LabCard({ id, title, description, url, iconPath, order }: LabCardProps) {
  const [status, setStatus] = useState<CardStatus>({
    isUp: null,
    lastChecked: null,
    lastHttp: null,
    latencyMs: null,
  })
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch(`/api/status?cardId=${id}`)
      if (response.ok) {
        const data = await response.json()
        console.log(`Status update for ${title}:`, data)
        setStatus(data)
      } else {
        console.error(`Status check failed for card ${id}:`, response.status)
      }
    } catch (error) {
      console.error(`Failed to fetch status for card ${id}:`, error)
    } finally {
      setIsRefreshing(false)
    }
  }, [id, title])

  // Initial status fetch
  useEffect(() => {
    console.log(`Initial status fetch for card: ${title}`)
    fetchStatus()
  }, [id, title])

  // Polling every 30 seconds
  useEffect(() => {
    console.log(`Setting up polling for card: ${title}`)
    const interval = setInterval(fetchStatus, 30000)
    return () => {
      console.log(`Cleaning up polling for card: ${title}`)
      clearInterval(interval)
    }
  }, [id, title])

  const handleCardClick = () => {
    if (url && url.trim() !== '') {
      try {
        // Ensure the URL is properly formatted
        let targetUrl = url.trim()
        
        // If it's a relative path, make it absolute
        if (targetUrl.startsWith('/')) {
          targetUrl = `${window.location.origin}${targetUrl}`
        }
        
        // If it doesn't have a protocol, assume http
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
          targetUrl = `http://${targetUrl}`
        }
        
        // Try to open the URL in a new tab
        const newWindow = window.open(targetUrl, '_blank', 'noopener,noreferrer')
        
        if (!newWindow) {
          // If popup is blocked, try alternative methods
          try {
            // Method 1: Try to navigate in the same window
            window.location.href = targetUrl
          } catch (fallbackError) {
            // Method 2: Show user-friendly error message
            alert(`Unable to open ${targetUrl}.\n\nThis might be due to:\n• Popup blocker enabled\n• Browser security settings\n• Network restrictions\n\nPlease try:\n1. Allowing popups for this site\n2. Right-clicking the card and selecting "Open in new tab"\n3. Copying the URL: ${targetUrl}`)
          }
        }
        
      } catch (error) {
        console.error('Error opening URL:', error)
        alert(`Error opening URL: ${error}`)
      }
    } else {
      alert('No URL configured for this card')
    }
  }

  const formatLatency = (latencyMs: number | null) => {
    if (latencyMs === null) return null
    if (latencyMs < 1000) return `${latencyMs}ms`
    return `${(latencyMs / 1000).toFixed(1)}s`
  }

  const formatLastChecked = (lastChecked: string | null) => {
    if (lastChecked === null) return 'Never'
    return new Date(lastChecked).toLocaleTimeString()
  }

    return (
    <div className="relative group">
      {/* Clickable overlay with fallback link */}
      <a 
        href={url || '#'} 
        target="_blank" 
        rel="noopener noreferrer"
        className="absolute inset-0 z-10"
        onClick={(e) => {
          e.preventDefault()
          handleCardClick()
        }}
        title={`Click to open ${url} in new tab`}
      />
      
      <Card className="group transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] h-full flex flex-col bg-slate-800 border-slate-700 text-slate-100 hover:border-slate-600 cursor-pointer">
        <CardHeader className="pb-4 text-center">
          {/* Centered Icon */}
          <div className="flex justify-center mb-4">
            {iconPath ? (
              <div className="w-16 h-16 bg-slate-700/50 rounded-lg p-2 flex items-center justify-center group-hover:bg-slate-600/50 transition-colors">
                <Image 
                  src={iconPath} 
                  alt={`${title} icon`}
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-slate-700/50 rounded-lg p-2 flex items-center justify-center group-hover:bg-slate-600/50 transition-colors">
                <Monitor className="w-10 h-10 text-slate-400" />
              </div>
            )}
          </div>

          {/* Centered Title */}
          <CardTitle className="text-xl font-semibold leading-tight group-hover:text-emerald-400 transition-colors mb-2">
            {title}
          </CardTitle>

          {/* External Link Icon (top right) */}
          <ExternalLink className="w-5 h-5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4" />
        </CardHeader>
        
        <CardContent className="pt-0 flex-1 flex flex-col">
          {/* Centered Description */}
          <CardDescription className="text-sm text-slate-400 leading-relaxed flex-1 text-center px-2">
            {description}
          </CardDescription>
          
          {/* Status Indicators at Bottom */}
          <div className="mt-auto space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <StatusIndicator 
                isUp={status.isUp} 
                isRefreshing={isRefreshing}
              />
              
              {status.latencyMs !== null && (
                <span className="text-sm font-medium text-slate-400 bg-slate-700/50 px-2 py-1 rounded-md">
                  {formatLatency(status.latencyMs)}
                </span>
              )}
            </div>
            
            {status.lastChecked && (
              <div className="text-xs text-slate-500 bg-slate-700/30 px-3 py-2 rounded-md">
                Last checked: {formatLastChecked(status.lastChecked)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 