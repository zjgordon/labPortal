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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Lab Portal
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Portal and control plane for local network laboratories
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/admin/login">
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Admin Panel
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Suspense fallback={<span className="animate-pulse">...</span>}>
                  {/* This will be populated by the grid component */}
                  <span>—</span>
                </Suspense>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                Live
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Real-time monitoring
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Last Updated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date().toLocaleTimeString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Auto-refresh every 30s
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lab Tools Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground">
              Lab Tools
            </h2>
            <div className="text-sm text-muted-foreground">
              Click any card to open the tool
            </div>
          </div>
          
          <Suspense fallback={
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded" />
                      <div className="flex-1">
                        <div className="h-5 bg-muted rounded mb-2" />
                        <div className="h-4 bg-muted rounded w-3/4" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-4 bg-muted rounded mb-4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          }>
            <LabCardsGrid />
          </Suspense>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground border-t pt-8">
          <p>
            Lab Portal v1.0 • Built with Next.js, Tailwind CSS, and shadcn/ui
          </p>
          <p className="mt-1">
            Status updates every 30 seconds • Click cards to access tools
          </p>
        </div>
      </div>
    </div>
  )
}
