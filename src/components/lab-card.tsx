"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusIndicator } from "@/components/status-indicator"
import { Sparkline } from "@/components/sparkline"
import { ExternalLink, Monitor, MoreVertical, Play, Square, RotateCcw } from "lucide-react"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"

export interface LabCardProps {
  id: string
  title: string
  description: string
  url: string
  iconPath?: string | null
  order: number
  services?: Array<{
    id: string
    unitName: string
    displayName: string
    allowStart: boolean
    allowStop: boolean
    allowRestart: boolean
    host: {
      id: string
      name: string
    }
  }>
}

interface CardStatus {
  isUp: boolean | null
  lastChecked: string | null
  lastHttp: number | null
  latencyMs: number | null
  message: string | null
  failCount: number
  nextCheckAt: string | null
}

interface StatusHistory {
  events: Array<{
    timestamp: string
    isUp: boolean
    latencyMs?: number | null
  }>
  uptimePercentage: number
}

/**
 * LabCard component - Displays a single lab tool card with status monitoring
 * Features:
 * - Real-time status monitoring with automatic polling
 * - Click handling with fallback navigation methods
 * - Cyberpunk-themed styling with glow effects
 * - Status staleness detection and visual feedback
 */
export function LabCard({ id, title, description, url, iconPath, order, services }: LabCardProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [status, setStatus] = useState<CardStatus>({
    isUp: null,
    lastChecked: null,
    lastHttp: null,
    latencyMs: null,
    message: null,
    failCount: 0,
    nextCheckAt: null,
  })

  const [history, setHistory] = useState<StatusHistory | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isControlOpen, setIsControlOpen] = useState(false)
  const [isExecutingAction, setIsExecutingAction] = useState(false)

  /**
   * Fetches the current status for this lab tool card
   * Updates the status state and handles errors gracefully
   */
  const fetchStatus = async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch(`/api/status?cardId=${id}`)
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      } else {
        console.error(`Status check failed for card ${id}:`, response.status)
      }
    } catch (error) {
      console.error(`Failed to fetch status for card ${id}:`, error)
    } finally {
      setIsRefreshing(false)
    }
  }

  /**
   * Fetches the status history for this card
   */
  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true)
      const response = await fetch(`/api/status/history?cardId=${id}&range=24h`)
      if (response.ok) {
        const data = await response.json()
        setHistory(data)
      } else {
        console.error(`History fetch failed for card ${id}:`, response.status)
      }
    } catch (error) {
      console.error(`Failed to fetch history for card ${id}:`, error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Initial status and history fetch
  useEffect(() => {
    fetchStatus()
    fetchHistory()
  }, [id]) // Run when id changes

  // Polling every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchStatus, 30000)
    return () => {
      clearInterval(interval)
    }
  }, [id]) // Run when id changes

  // Refresh history every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchHistory, 5 * 60 * 1000)
    return () => {
      clearInterval(interval)
    }
  }, [id]) // Run when id changes

  /**
   * Handles card click events with intelligent URL handling
   * Features:
   * - URL validation and formatting
   * - Popup blocking detection with fallbacks
   * - User-friendly error messages
   * - Support for relative and absolute URLs
   */
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

  /**
   * Formats latency values for display
   * @param latencyMs - Latency in milliseconds
   * @returns Formatted string (e.g., "150ms" or "2.5s")
   */
  const formatLatency = (latencyMs: number | null) => {
    if (latencyMs === null) return null
    if (latencyMs < 1000) return `${latencyMs}ms`
    return `${(latencyMs / 1000).toFixed(1)}s`
  }

  /**
   * Formats the last checked timestamp for display
   * @param lastChecked - ISO timestamp string
   * @returns Formatted time string or "Never" if null
   */
  const formatLastChecked = (lastChecked: string | null) => {
    if (lastChecked === null) return 'Never'
    return new Date(lastChecked).toLocaleTimeString()
  }

  /**
   * Determines if the status data is stale (older than 2 minutes)
   * @returns true if status is stale, false if fresh
   */
  const isStatusStale = () => {
    if (!status.lastChecked) return true
    
    try {
      const lastCheckedTime = new Date(status.lastChecked).getTime()
      if (isNaN(lastCheckedTime)) {
        console.warn(`Invalid lastChecked date for ${title}:`, status.lastChecked)
        return true
      }
      
      const timeDiff = Date.now() - lastCheckedTime
      const isStale = timeDiff > 120000 // 2 minutes
      
      return isStale
    } catch (error) {
      console.error(`Error parsing lastChecked date for ${title}:`, error, status.lastChecked)
      return true
    }
  }

  // Get status color based on status and staleness
  const getStatusColor = () => {
    if (isStatusStale()) return 'bg-gray-500' // Grey for stale status
    if (status.isUp === null) return 'bg-gray-500' // Grey for unknown
    return status.isUp ? 'bg-emerald-500' : 'bg-red-500' // Green for up, red for down
  }

  // Get status text
  const getStatusText = () => {
    if (isStatusStale()) return 'Stale'
    if (status.isUp === null) return 'Unknown'
    return status.isUp ? 'Up' : 'Down'
  }

  // Create tooltip content
  const getTooltipContent = () => {
    const parts = []
    if (status.lastHttp !== null) parts.push(`HTTP: ${status.lastHttp}`)
    if (status.message) parts.push(`Message: ${status.message}`)
    if (status.failCount > 0) parts.push(`Fail Count: ${status.failCount}`)
    if (status.nextCheckAt) parts.push(`Next Check: ${new Date(status.nextCheckAt).toLocaleTimeString()}`)
    
    return parts.length > 0 ? parts.join('\n') : 'No additional information'
  }

  /**
   * Executes a control action on a linked service
   * @param serviceId - The service ID to control
   * @param hostId - The host ID where the service runs
   * @param action - The action to perform (start/stop/restart)
   */
  const executeControlAction = async (serviceId: string, hostId: string, action: 'start' | 'stop' | 'restart') => {
    if (isExecutingAction) return
    
    setIsExecutingAction(true)
    try {
      const response = await fetch('/api/control/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostId,
          serviceId,
          kind: action,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Action Enqueued",
          description: `${action.charAt(0).toUpperCase() + action.slice(1)} action for ${title} has been queued successfully.`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "Action Failed",
          description: error.error || `Failed to enqueue ${action} action.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(`Failed to execute ${action} action:`, error)
      toast({
        title: "Action Failed",
        description: `Failed to execute ${action} action. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setIsExecutingAction(false)
      setIsControlOpen(false)
    }
  }

  // Check if user is admin and has linked services
  const isAdmin = session?.user?.email === 'admin@local'
  const hasLinkedServices = services && services.length > 0

  // Close control dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isControlOpen) {
        setIsControlOpen(false)
      }
    }

    if (isControlOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isControlOpen])

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
              <div className="w-16 h-16 bg-slate-700/50 rounded-lg p-2 flex items-center justify-center group-hover:bg-slate-600/50 transition-all duration-300 shadow-[0_0_20px_rgba(52,211,153,0.3)] group-hover:shadow-[0_0_25px_rgba(52,211,153,0.5)] border border-emerald-400/20 group-hover:border-emerald-400/40">
                <Image 
                  src={iconPath} 
                  alt={`${title} icon`}
                  width={40}
                  height={40}
                  className="object-contain drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]"
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-slate-700/50 rounded-lg p-2 flex items-center justify-center group-hover:bg-slate-600/50 transition-all duration-300 shadow-[0_0_20px_rgba(52,211,153,0.3)] group-hover:shadow-[0_0_25px_rgba(52,211,153,0.5)] border border-emerald-400/20 group-hover:border-emerald-400/40">
                <Monitor className="w-10 h-10 text-slate-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
              </div>
            )}
          </div>

          {/* Centered Title */}
          <CardTitle className="text-xl font-semibold leading-tight mb-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            {title}
          </CardTitle>

          {/* Control Dropdown (top right) - Only for admin users with linked services */}
          {isAdmin && hasLinkedServices && (
            <div className="absolute top-4 right-4 z-20">
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsControlOpen(!isControlOpen)
                  }}
                  className="p-1 rounded-md bg-slate-700/80 hover:bg-slate-600/80 transition-colors text-slate-300 hover:text-slate-100"
                  title="Control Services"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                
                {isControlOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-600 rounded-md shadow-lg z-30">
                    <div className="py-1">
                      {services?.map((service) => (
                        <div key={service.id} className="px-3 py-2 border-b border-slate-700 last:border-b-0">
                          <div className="text-xs text-slate-400 mb-2 font-medium">
                            {service.displayName}
                          </div>
                          <div className="flex gap-1">
                            {service.allowStart && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  executeControlAction(service.id, service.host.id, 'start')
                                }}
                                disabled={isExecutingAction}
                                className="flex-1 px-2 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 rounded text-white transition-colors flex items-center justify-center gap-1"
                              >
                                <Play className="w-3 h-3" />
                                Start
                              </button>
                            )}
                            {service.allowStop && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  executeControlAction(service.id, service.host.id, 'stop')
                                }}
                                disabled={isExecutingAction}
                                className="flex-1 px-2 py-1 text-xs bg-red-600 hover:bg-red-500 disabled:bg-slate-600 rounded text-white transition-colors flex items-center justify-center gap-1"
                              >
                                <Square className="w-3 h-3" />
                                Stop
                              </button>
                            )}
                            {service.allowRestart && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  executeControlAction(service.id, service.host.id, 'restart')
                                }}
                                disabled={isExecutingAction}
                                className="flex-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 rounded text-white transition-colors flex items-center justify-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Restart
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* External Link Icon (top right) - Only when no control dropdown */}
          {(!isAdmin || !hasLinkedServices) && (
            <ExternalLink className="w-5 h-5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4" />
          )}
        </CardHeader>
        
        <CardContent className="pt-0 flex-1 flex flex-col">
          {/* Centered Description */}
          <CardDescription className="text-sm text-slate-400 leading-relaxed flex-1 text-center px-2">
            {description}
          </CardDescription>
          
          {/* Status Indicators at Bottom */}
          <div className="mt-auto space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className={`w-3 h-3 rounded-full ${getStatusColor()} ${isRefreshing ? 'animate-pulse' : ''}`}
                  title={getTooltipContent()}
                />
                <span className={`text-xs font-medium ${isStatusStale() ? 'text-gray-400' : status.isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                  {getStatusText()}
                </span>
              </div>
              
              {status.latencyMs !== null && (
                <span className="text-sm font-medium text-slate-400 bg-slate-700/50 px-2 py-1 rounded-md">
                  {formatLatency(status.latencyMs)}
                </span>
              )}
            </div>
            
            {/* Sparkline and Uptime */}
            {history && (
              <div className="bg-slate-700/30 rounded-md p-3">
                <Sparkline 
                  data={history.events}
                  width={120}
                  height={24}
                  showUptime={true}
                  className="text-slate-300"
                />
              </div>
            )}
            
            {status.lastChecked && (
              <div className="text-xs text-slate-500 bg-slate-700/30 px-3 py-2 rounded-md">
                Last checked: {formatLastChecked(status.lastChecked)}
                {status.failCount > 0 && (
                  <span className="ml-2 text-orange-400">
                    (Failed {status.failCount} times)
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 