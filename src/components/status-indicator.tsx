"use client"

import { cn } from "@/lib/utils"

export interface StatusIndicatorProps {
  isUp: boolean | null
  isRefreshing?: boolean
  error?: string | null
  className?: string
}

export function StatusIndicator({ isUp, isRefreshing = false, error = null, className }: StatusIndicatorProps) {
  const getStatusInfo = () => {
    if (error) {
      return {
        color: "bg-red-500",
        text: "Error",
        pulse: false,
        textColor: "text-red-400"
      }
    }
    
    if (isRefreshing) {
      return {
        color: "bg-yellow-500",
        text: "Loading",
        pulse: true,
        textColor: "text-yellow-400"
      }
    }
    
    if (isUp === null) {
      return {
        color: "bg-gray-500",
        text: "Unknown",
        pulse: false,
        textColor: "text-gray-400"
      }
    }
    
    if (isUp) {
      return {
        color: "bg-green-500",
        text: "Up",
        pulse: false,
        textColor: "text-green-400"
      }
    }
    
    return {
      color: "bg-red-500",
      text: "Down",
      pulse: false,
      textColor: "text-red-400"
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
        title={error ? `Error: ${error}` : statusInfo.text}
      />
      <span className={cn("text-xs font-medium", statusInfo.textColor)}>
        {statusInfo.text}
      </span>
    </div>
  )
}
