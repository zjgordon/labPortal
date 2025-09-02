"use client"

import { useMemo } from 'react'

interface SparklineProps {
  data: Array<{
    timestamp: string
    isUp: boolean
    latencyMs?: number | null
  }>
  width?: number
  height?: number
  showUptime?: boolean
  className?: string
}

/**
 * Sparkline component for displaying status trends
 * Shows a mini chart of up/down status over time
 */
export function Sparkline({ 
  data, 
  width = 80, 
  height = 20, 
  showUptime = true,
  className = ""
}: SparklineProps) {
  const { points, uptime } = useMemo(() => {
    if (!data || data.length === 0) {
      return { points: "", uptime: 0 }
    }

    // Calculate uptime percentage
    const upCount = data.filter(d => d.isUp).length
    const uptime = data.length > 0 ? (upCount / data.length) * 100 : 0

    // Create SVG path points
    const points = data.map((point, index) => {
      const x = (index / (data.length - 1)) * width
      const y = point.isUp ? height * 0.3 : height * 0.8
      return `${x},${y}`
    }).join(' ')

    return { points, uptime }
  }, [data, width, height])

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center text-xs text-gray-400 ${className}`}>
        No data
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Sparkline SVG */}
      <svg 
        width={width} 
        height={height} 
        className="flex-shrink-0"
        viewBox={`0 0 ${width} ${height}`}
      >
        {/* Background grid lines */}
        <line 
          x1="0" y1={height * 0.5} 
          x2={width} y2={height * 0.5} 
          stroke="currentColor" 
          strokeWidth="0.5" 
          opacity="0.2"
        />
        
        {/* Status line */}
        {points && points.length > 0 && (
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            points={points}
            className="text-emerald-400"
          />
        )}
        
        {/* Data points */}
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * width
          const y = point.isUp ? height * 0.3 : height * 0.8
          const color = point.isUp ? '#10b981' : '#ef4444' // emerald-500 : red-500
          
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="1.5"
              fill={color}
              className="drop-shadow-sm"
            />
          )
        })}
      </svg>
      
      {/* Uptime badge */}
      {showUptime && (
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-gray-400">Uptime:</span>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
            uptime >= 99 ? 'bg-emerald-100 text-emerald-800' :
            uptime >= 95 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {uptime.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  )
}
