"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusIndicator } from "@/components/status-indicator"
import { ExternalLink, Monitor } from "lucide-react"

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
        setStatus(data)
      }
    } catch (error) {
      console.error(`Failed to fetch status for card ${id}:`, error)
    } finally {
      setIsRefreshing(false)
    }
  }, [id])

  // Initial status fetch
  useEffect(() => {
    fetchStatus()
  }, [id])

  // Polling every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const handleCardClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const formatLatency = (latencyMs: number | null) => {
    if (latencyMs === null) return null
    if (latencyMs < 1000) return `${latencyMs}ms`
    return `${(latencyMs / 1000).toFixed(1)}s`
  }

  return (
    <Card 
      className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {iconPath ? (
              <img 
                src={iconPath} 
                alt={`${title} icon`}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  // Fallback to default icon if image fails to load
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  target.nextElementSibling?.classList.remove('hidden')
                }}
              />
            ) : null}
            <div className={cn(iconPath ? "hidden" : "", "w-8 h-8")}>
              <Monitor className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                {title}
              </CardTitle>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <CardDescription className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {description}
        </CardDescription>
        
        <div className="flex items-center justify-between">
          <StatusIndicator 
            isUp={status.isUp} 
            isRefreshing={isRefreshing}
          />
          
          {status.latencyMs !== null && (
            <span className="text-xs text-muted-foreground">
              {formatLatency(status.latencyMs)}
            </span>
          )}
        </div>
        
        {status.lastChecked && (
          <div className="mt-2 text-xs text-muted-foreground">
            Last checked: {new Date(status.lastChecked).toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper function for conditional classes
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
