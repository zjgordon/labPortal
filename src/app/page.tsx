"use client"

import { Suspense, useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card as UICard, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LabCard } from '@/components/lab-card'
import { Input } from '@/components/ui/input'
import { ExternalLink, Plus, Server, Search } from 'lucide-react'
import Link from 'next/link'

/**
 * Client-side time display component to avoid hydration errors
 * Renders time only after component mounts to prevent server/client mismatch
 */
function TimeDisplay() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString())
    }
    
    // Update immediately on mount
    updateTime()
    
    // Update every second for live clock effect
    const interval = setInterval(updateTime, 1000)
    
    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, [])

  return <span>{time}</span>
}

interface LabCardData {
  id: string
  title: string
  description: string
  url: string
  iconPath: string | null
  order: number
  isEnabled: boolean
  group: string
}

/**
 * LabCardsGrid component - Displays lab tools organized by category with search functionality
 * Features:
 * - Real-time search across titles, descriptions, and categories
 * - Automatic grouping by tool category
 * - Loading states and error handling
 * - Responsive grid layout
 */
function LabCardsGrid() {
  const [searchQuery, setSearchQuery] = useState('')
  const [cards, setCards] = useState<LabCardData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch cards on component mount
  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await fetch('/api/cards', { cache: 'no-store' })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        setCards(data)
      } catch (error) {
        console.error('Failed to fetch cards:', error)
        // Could add error state here for better UX
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchCards()
  }, [])

  // Filter and group cards
  const groupedCards = useMemo(() => {
    if (!cards.length) return {}

    // Filter cards based on search query
    const filteredCards = cards.filter(card =>
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.group.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Group cards by category
    const grouped = filteredCards.reduce((acc, card) => {
      if (!acc[card.group]) {
        acc[card.group] = []
      }
      acc[card.group].push(card)
      return acc
    }, {} as Record<string, LabCardData[]>)

    // Sort groups alphabetically and sort cards within each group by order
    Object.keys(grouped).forEach(group => {
      grouped[group].sort((a, b) => a.order - b.order)
    })

    return grouped
  }, [cards, searchQuery])

  if (isLoading) {
    return (
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {[...Array(6)].map((_, i) => (
          <UICard key={i} className="animate-pulse h-full bg-slate-800 border-slate-700">
            <CardHeader className="pb-4 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-slate-700 rounded-lg" />
              </div>
              <div className="h-6 bg-slate-700 rounded mb-2" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 text-center">
                <div className="h-4 bg-slate-700 rounded" />
                <div className="h-4 bg-slate-700 rounded w-3/4 mx-auto" />
                <div className="h-4 bg-slate-700 rounded w-1/2 mx-auto" />
              </div>
            </CardContent>
          </UICard>
        ))}
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <Server className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Lab Tools Available</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          There are currently no lab tools configured. Please check back later or contact an administrator.
        </p>
        <Link href="/admin/login">
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Admin Access
          </Button>
        </Link>
      </div>
    )
  }

  const groupNames = Object.keys(groupedCards).sort()

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Search lab tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-400/20"
        />
      </div>

      {/* Grouped Cards */}
      {groupNames.map(groupName => (
        <div key={groupName} className="space-y-4">
          {/* Category Header */}
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-semibold text-slate-200">
              {groupName}
            </h3>
            <div className="flex-1 h-px bg-slate-700"></div>
            <span className="text-sm text-slate-500 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              {groupedCards[groupName].length} tool{groupedCards[groupName].length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Cards Grid for this Category */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {groupedCards[groupName].map((card) => (
              <LabCard
                key={card.id}
                id={card.id}
                title={card.title}
                description={card.description}
                url={card.url}
                iconPath={card.iconPath}
                order={card.order}
              />
            ))}
          </div>
        </div>
      ))}

      {/* No Results Message */}
      {searchQuery && groupNames.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">No Results Found</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            No lab tools match your search for &quot;{searchQuery}&quot;. Try adjusting your search terms.
          </p>
          <Button 
            variant="outline" 
            onClick={() => setSearchQuery('')}
            className="border-emerald-400/50 text-emerald-400 hover:bg-emerald-400/10 hover:border-emerald-400 hover:text-emerald-300"
          >
            Clear Search
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * HomePage - Main portal interface for lab tools
 * Features:
 * - Cyberpunk-themed header with live system time
 * - Lab tools organized by category with search
 * - Responsive design with proper loading states
 * - Admin access button for configuration
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* New Cyberpunk Header */}
      <header className="border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo & Title */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center">
                  <div className="w-6 h-6 bg-slate-900 rounded-sm"></div>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                  LAB<span className="text-emerald-400">PORTAL</span>
                </h1>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Control Plane v1.0</p>
              </div>
            </div>

            {/* Right: System Status */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-slate-400">SYSTEM</span>
                </div>
                <div className="text-slate-600">|</div>
                <div className="text-slate-400">
                  <TimeDisplay />
                </div>
              </div>
              <Link href="/admin/login">
                <Button variant="outline" size="sm" className="border-emerald-400/50 text-emerald-400 hover:bg-emerald-400/10 hover:border-emerald-400 hover:text-emerald-300 text-xs px-3 py-1 transition-all duration-200 shadow-[0_0_10px_rgba(52,211,153,0.3)] hover:shadow-[0_0_15px_rgba(52,211,153,0.5)]">
                  ADMIN
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Lab Tools Grid */}
        <div className="mb-16">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-100 tracking-tight flex items-center">
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                LAB TOOLS
              </span>
              <div className="ml-3 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            </h2>
          </div>
          
          <Suspense fallback={
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {[...Array(6)].map((_, i) => (
                <UICard key={i} className="animate-pulse h-full bg-slate-800 border-slate-700">
                  <CardHeader className="pb-4 text-center">
                    {/* Centered Icon */}
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 bg-slate-700 rounded-lg" />
                    </div>
                    {/* Centered Title */}
                    <div className="h-6 bg-slate-700 rounded mb-2" />
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3 text-center">
                      <div className="h-4 bg-slate-700 rounded" />
                      <div className="h-4 bg-slate-700 rounded w-3/4 mx-auto" />
                      <div className="h-4 bg-slate-700 rounded w-1/2 mx-auto" />
                    </div>
                  </CardContent>
                </UICard>
              ))}
            </div>
          }>
            <LabCardsGrid />
          </Suspense>
        </div>


      </div>
    </div>
  )
}
