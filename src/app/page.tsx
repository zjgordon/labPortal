"use client"

import { useState, useEffect, useMemo } from 'react'
import { LabCard } from '@/components/lab-card'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface Card {
  id: string
  title: string
  description: string
  url: string
  healthPath: string | null
  iconPath: string | null
  order: number
  group: string
  isEnabled: boolean
}

interface GroupedCards {
  [group: string]: Card[]
}

export default function HomePage() {
  const [cards, setCards] = useState<Card[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await fetch('/api/cards')
        if (response.ok) {
          const data = await response.json()
          setCards(data)
        } else {
          console.error('Failed to fetch cards')
        }
      } catch (error) {
        console.error('Error fetching cards:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCards()
  }, [])

  // Filter cards based on search query
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return cards
    
    const query = searchQuery.toLowerCase()
    return cards.filter(card => 
      card.title.toLowerCase().includes(query) ||
      card.description.toLowerCase().includes(query) ||
      card.group.toLowerCase().includes(query)
    )
  }, [cards, searchQuery])

  // Group filtered cards by their group
  const groupedCards = useMemo(() => {
    const grouped: GroupedCards = {}
    
    filteredCards.forEach(card => {
      if (!grouped[card.group]) {
        grouped[card.group] = []
      }
      grouped[card.group].push(card)
    })
    
    // Sort groups alphabetically and cards within each group by order
    Object.keys(grouped).forEach(group => {
      grouped[group].sort((a, b) => a.order - b.order)
    })
    
    return grouped
  }, [filteredCards])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-16">
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-slate-100 tracking-tight flex items-center">
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  LAB TOOLS
                </span>
                <div className="ml-3 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              </h2>
            </div>
            
            {/* Search placeholder */}
            <div className="mb-8">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search tools..."
                  className="pl-10 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400"
                  disabled
                />
              </div>
            </div>

            {/* Loading skeleton */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-lg border text-card-foreground shadow-sm animate-pulse h-full bg-slate-800 border-slate-700">
                  <div className="flex flex-col space-y-1.5 p-6 pb-4 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 bg-slate-700 rounded-lg"></div>
                    </div>
                    <div className="h-6 bg-slate-700 rounded mb-2"></div>
                  </div>
                  <div className="p-6 pt-0">
                    <div className="space-y-3 text-center">
                      <div className="h-4 bg-slate-700 rounded"></div>
                      <div className="h-4 bg-slate-700 rounded w-3/4 mx-auto"></div>
                      <div className="h-4 bg-slate-700 rounded w-1/2 mx-auto"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

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
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
              <a href="/admin/login">
                <button className="inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border bg-background h-9 rounded-md border-emerald-400/50 text-emerald-400 hover:bg-emerald-400/10 hover:border-emerald-400 hover:text-emerald-300 text-xs px-3 py-1 transition-all duration-200 shadow-[0_0_10px_rgba(52,211,153,0.3)] hover:shadow-[0_0_15px_rgba(52,211,153,0.5)]">
                  ADMIN
                </button>
              </a>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-16">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-100 tracking-tight flex items-center">
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                LAB TOOLS
              </span>
              <div className="ml-3 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            </h2>
          </div>
          
          {/* Search */}
          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-emerald-400 focus:ring-emerald-400"
              />
            </div>
          </div>

          {/* Grouped Cards */}
          {Object.keys(groupedCards).length > 0 ? (
            <div className="space-y-12">
              {Object.entries(groupedCards).map(([group, groupCards]) => (
                <div key={group} className="space-y-6">
                  {/* Sticky Group Header */}
                  <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 pb-4">
                    <h3 className="text-2xl font-semibold text-slate-200 tracking-tight">
                      {group}
                      <span className="ml-3 text-sm font-normal text-slate-400">
                        ({groupCards.length} tool{groupCards.length !== 1 ? 's' : ''})
                      </span>
                    </h3>
                  </div>
                  
                  {/* Cards Grid */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {groupCards.map((card) => (
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
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-4">
                {searchQuery ? 'No tools found matching your search.' : 'No tools available.'}
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
