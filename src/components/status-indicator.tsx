"use client"

import { cn } from "@/lib/utils"

export interface StatusIndicatorProps {
  isUp: boolean | null
  isRefreshing?: boolean
  className?: string
}

export function StatusIndicator({ isUp, isRefreshing = false, className }: StatusIndicatorProps) {
  const getStatusInfo = () => {
    if (isRefreshing) {
      return {
        color: "bg-yellow-500",
        text: "Checking...",
        pulse: true
      }
    }
    
    if (isUp === null) {
      return {
        color: "bg-gray-500",
        text: "Unknown",
        pulse: false
      }
    }
    
    if (isUp) {
      return {
        color: "bg-green-500",
        text: "Up",
        pulse: false
      }
    }
    
    return {
      color: "bg-red-500",
      text: "Down",
      pulse: false
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "w-3 h-3 rounded-full",
          statusInfo.color,
          statusInfo.pulse && "animate-pulse"
        )}
        title={statusInfo.text}
      />
      <span className="text-xs text-muted-foreground font-medium">
        {statusInfo.text}
      </span>
    </div>
  )
}
