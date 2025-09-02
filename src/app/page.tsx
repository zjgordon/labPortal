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
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-100 mb-6 tracking-tight">
            Lab Portal
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-8 leading-relaxed">
            Portal and control plane for local network laboratories
          </p>
        </div>

        {/* Lab Tools Grid */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-4xl font-bold text-slate-100 tracking-tight">
              Lab Tools
            </h2>
            <div className="text-sm text-slate-400 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
              Click any card to access tools
            </div>
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

        {/* Footer with Status Info */}
        <div className="border-t border-slate-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            {/* Admin Panel Button - Left of Status Widget */}
            <Link href="/admin/login">
              <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-slate-100">
                <ExternalLink className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </Link>
            
            {/* Status Info - Bottom Right */}
            <div className="text-xs text-slate-500 bg-slate-800/50 px-4 py-3 rounded-lg border border-slate-700/50 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span>System Live</span>
                </div>
                <div className="text-slate-600">•</div>
                <div>
                  Last: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
