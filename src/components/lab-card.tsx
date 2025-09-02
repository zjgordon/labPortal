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
    console.log('Card clicked!', { title, url, id })
    if (url) {
      console.log('Opening URL:', url)
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      console.error('No URL provided for card:', title)
    }
  }

  const formatLatency = (latencyMs: number | null) => {
    if (latencyMs === null) return null
    if (latencyMs < 1000) return `${latencyMs}ms`
    return `${(latencyMs / 1000).toFixed(1)}s`
  }

  return (
    <div 
      className="cursor-pointer"
      onClick={handleCardClick}
    >
      <Card className="group transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] h-full flex flex-col bg-slate-800 border-slate-700 text-slate-100 hover:border-slate-600">
        <CardHeader className="pb-4 text-center">
          {/* Centered Icon */}
          <div className="flex justify-center mb-4">
            {iconPath ? (
              <img 
                src={iconPath} 
                alt={`${title} icon`}
                className="w-16 h-16 object-contain rounded-lg bg-slate-700/50 p-2 group-hover:bg-slate-600/50 transition-colors"
              />
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
                Last checked: {new Date(status.lastChecked).toLocaleTimeString()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 