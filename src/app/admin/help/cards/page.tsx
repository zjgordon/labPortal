/* eslint-disable react/no-unescaped-entities */
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Square,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Upload,
  Link as LinkIcon,
  Monitor,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CardsHelpPage() {
  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <Link href="/admin" className="hover:text-gray-900">
          Admin Dashboard
        </Link>
        <span>/</span>
        <Link href="/admin/help" className="hover:text-gray-900">
          Help
        </Link>
        <span>/</span>
        <span className="text-gray-900">Cards</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Square className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">Cards Management</h1>
        </div>
        <p className="text-gray-600 text-lg">
          Learn how to create, edit, and organize lab tool cards for your portal
        </p>
      </div>

      {/* Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>What are Cards?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Cards are the primary way users interact with your lab tools and
            services. Each card represents a single application, service, or
            tool that users can access through your portal.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <LinkIcon className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <h4 className="font-medium">Direct Access</h4>
                <p className="text-sm text-gray-600">
                  Users can click cards to access tools directly
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Monitor className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <h4 className="font-medium">Status Monitoring</h4>
                <p className="text-sm text-gray-600">
                  Real-time health checks and status indicators
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Settings className="h-5 w-5 text-purple-600 mt-1" />
              <div>
                <h4 className="font-medium">Service Control</h4>
                <p className="text-sm text-gray-600">
                  Start, stop, and restart services (when enabled)
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Square className="h-5 w-5 text-orange-600 mt-1" />
              <div>
                <h4 className="font-medium">Organized Groups</h4>
                <p className="text-sm text-gray-600">
                  Categorize tools by type or purpose
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Creating Cards */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Creating New Cards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h3 className="font-medium">Navigate to Cards Management</h3>
                <p className="text-sm text-gray-600">
                  Go to the Cards section in the admin dashboard to access the
                  card management interface.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h3 className="font-medium">Click "Add New Card"</h3>
                <p className="text-sm text-gray-600">
                  Use the "Add New Card" button to open the card creation form.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h3 className="font-medium">Fill in Card Details</h3>
                <p className="text-sm text-gray-600">
                  Provide the card title, description, URL, and other required
                  information.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <h3 className="font-medium">Configure Health Monitoring</h3>
                <p className="text-sm text-gray-600">
                  Set up health check endpoints to monitor service availability.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card Properties */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Card Properties Explained</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium">Title</h4>
              <p className="text-sm text-gray-600">
                The display name of your lab tool (e.g., "Grafana", "Jupyter
                Notebook")
              </p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-medium">Description</h4>
              <p className="text-sm text-gray-600">
                A brief description of what the tool does and its purpose
              </p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-medium">URL</h4>
              <p className="text-sm text-gray-600">
                The web address where users will be directed when clicking the
                card
              </p>
            </div>
            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="font-medium">Group</h4>
              <p className="text-sm text-gray-600">
                Category for organizing cards (e.g., "AI Tools", "Development",
                "Monitoring")
              </p>
            </div>
            <div className="border-l-4 border-pink-500 pl-4">
              <h4 className="font-medium">Health Path</h4>
              <p className="text-sm text-gray-600">
                API endpoint for health checks (e.g., "/api/health", "/status")
              </p>
            </div>
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-medium">Icon</h4>
              <p className="text-sm text-gray-600">
                Visual representation of the tool (upload custom icons or use
                defaults)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Managing Cards */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Managing Existing Cards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Edit className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <h4 className="font-medium">Edit Cards</h4>
                <p className="text-sm text-gray-600">
                  Click the edit button on any card to modify its properties,
                  URL, or settings.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Trash2 className="h-5 w-5 text-red-600 mt-1" />
              <div>
                <h4 className="font-medium">Delete Cards</h4>
                <p className="text-sm text-gray-600">
                  Remove cards that are no longer needed. This action cannot be
                  undone.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Upload className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <h4 className="font-medium">Upload Icons</h4>
                <p className="text-sm text-gray-600">
                  Customize card appearance by uploading your own icons or
                  logos.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                Organize with Groups
              </h4>
              <p className="text-sm text-blue-800">
                Use consistent group names to organize your tools logically.
                Common groups include "AI Tools", "Development", "Monitoring",
                and "Utilities".
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">
                Set Up Health Checks
              </h4>
              <p className="text-sm text-green-800">
                Configure health check endpoints to provide real-time status
                information to users. This helps them know if services are
                available.
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-2">
                Use Descriptive Names
              </h4>
              <p className="text-sm text-purple-800">
                Choose clear, descriptive titles and descriptions that help
                users understand what each tool does and when to use it.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Back Button */}
      <div className="flex justify-start">
        <Link href="/admin/help">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Help Center
          </Button>
        </Link>
      </div>
    </div>
  );
}
