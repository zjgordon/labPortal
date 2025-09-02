import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LabCard } from '@/components/lab-card'
import { getEnabledCards } from '@/lib/actions'
import { ExternalLink, Plus, Server } from 'lucide-react'
import Link from 'next/link'

async function LabCardsGrid() {
  const cards = await getEnabledCards()
  
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

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cards.map((card) => (
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
  )
}

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
                  {new Date().toLocaleTimeString()}
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
                <Card key={i} className="animate-pulse h-full bg-slate-800 border-slate-700">
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
                </Card>
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
