import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppearanceForm } from './appearance-form'

export default function AdminAppearancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Appearance Settings</h1>
        <p className="text-muted-foreground">
          Customize the portal's appearance and branding
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Portal Branding</CardTitle>
          <CardDescription>
            Configure how your lab portal appears to users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppearanceForm />
        </CardContent>
      </Card>
    </div>
  )
}
