/* eslint-disable react/no-unescaped-entities */
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Server,
  ArrowLeft,
  Plus,
  Play,
  Square,
  RotateCcw,
  Shield,
  Link as LinkIcon,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ServicesHelpPage() {
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
        <span className="text-gray-900">Services</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Server className="h-8 w-8 text-purple-600" />
          <h1 className="text-4xl font-bold text-gray-900">
            Services Management
          </h1>
        </div>
        <p className="text-gray-600 text-lg">
          Configure systemd services and control permissions for each host
        </p>
      </div>

      {/* What are Services */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>What are Managed Services?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Managed services are systemd services running on your hosts that can
            be controlled through the Lab Portal. Each service can be linked to
            a card, allowing users to start, stop, and restart services directly
            from the portal interface.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <Play className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <h4 className="font-medium">Service Control</h4>
                <p className="text-sm text-gray-600">
                  Start, stop, and restart systemd services remotely
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <h4 className="font-medium">Permission Management</h4>
                <p className="text-sm text-gray-600">
                  Configure which operations are allowed for each service
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <LinkIcon className="h-5 w-5 text-purple-600 mt-1" />
              <div>
                <h4 className="font-medium">Card Integration</h4>
                <p className="text-sm text-gray-600">
                  Link services to portal cards for user access
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Settings className="h-5 w-5 text-orange-600 mt-1" />
              <div>
                <h4 className="font-medium">Flexible Configuration</h4>
                <p className="text-sm text-gray-600">
                  Customize display names and descriptions
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adding Services */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adding New Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h3 className="font-medium">Navigate to Services Management</h3>
                <p className="text-sm text-gray-600">
                  Go to the Services section in the admin dashboard (only
                  visible when Control Plane is enabled).
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h3 className="font-medium">Click "Add New Service"</h3>
                <p className="text-sm text-gray-600">
                  Use the "Add New Service" button to open the service creation
                  form.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h3 className="font-medium">Select Host</h3>
                <p className="text-sm text-gray-600">
                  Choose which host this service will run on from the dropdown
                  list.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <h3 className="font-medium">Configure Service Details</h3>
                <p className="text-sm text-gray-600">
                  Provide the systemd unit name, display name, and description
                  for the service.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                5
              </div>
              <div>
                <h3 className="font-medium">Set Permissions</h3>
                <p className="text-sm text-gray-600">
                  Configure which operations (start, stop, restart) are allowed
                  for this service.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                6
              </div>
              <div>
                <h3 className="font-medium">Link to Card (Optional)</h3>
                <p className="text-sm text-gray-600">
                  Optionally link this service to an existing portal card for
                  user access.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Properties */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Service Properties Explained</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-medium">Unit Name</h4>
              <p className="text-sm text-gray-600">
                The systemd service unit name (e.g., "nginx.service",
                "postgresql.service")
              </p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium">Display Name</h4>
              <p className="text-sm text-gray-600">
                User-friendly name shown in the portal interface (e.g., "Nginx
                Web Server")
              </p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-medium">Description</h4>
              <p className="text-sm text-gray-600">
                Brief description of what the service does and its purpose
              </p>
            </div>
            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="font-medium">Host</h4>
              <p className="text-sm text-gray-600">
                The host where this service is running and can be managed
              </p>
            </div>
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-medium">Permissions</h4>
              <p className="text-sm text-gray-600">
                Which operations are allowed: Start, Stop, and/or Restart
              </p>
            </div>
            <div className="border-l-4 border-pink-500 pl-4">
              <h4 className="font-medium">Linked Card</h4>
              <p className="text-sm text-gray-600">
                Portal card that provides user access to this service (optional)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Operations */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Service Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Play className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <h4 className="font-medium">Start Service</h4>
                <p className="text-sm text-gray-600">
                  Starts a stopped service using{' '}
                  <code className="bg-gray-100 px-1 rounded">
                    systemctl start
                  </code>
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Square className="h-5 w-5 text-red-600 mt-1" />
              <div>
                <h4 className="font-medium">Stop Service</h4>
                <p className="text-sm text-gray-600">
                  Stops a running service using{' '}
                  <code className="bg-gray-100 px-1 rounded">
                    systemctl stop
                  </code>
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <RotateCcw className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <h4 className="font-medium">Restart Service</h4>
                <p className="text-sm text-gray-600">
                  Restarts a service using{' '}
                  <code className="bg-gray-100 px-1 rounded">
                    systemctl restart
                  </code>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card Integration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Card Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              When a service is linked to a portal card, users can control the
              service directly from the card interface:
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium mb-2">User Experience</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  • Service control buttons appear on the card when Control
                  Plane is enabled
                </li>
                <li>
                  • Users can start, stop, and restart services with a single
                  click
                </li>
                <li>• Real-time feedback shows the current service status</li>
                <li>
                  • Only operations with enabled permissions are available
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <LinkIcon className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-medium">Linking Services to Cards</h4>
                  <p className="text-sm text-gray-600">
                    When creating or editing a service, you can select an
                    existing card to link it to. This enables service control
                    from the portal interface.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium">Permission-Based Access</h4>
                  <p className="text-sm text-gray-600">
                    Service control buttons only appear for operations that have
                    been enabled in the service configuration.
                  </p>
                </div>
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
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-2">
                Use Descriptive Names
              </h4>
              <p className="text-sm text-purple-800">
                Choose clear, descriptive display names that help users
                understand what each service does (e.g., "Web Server" instead of
                "nginx.service").
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                Configure Permissions Carefully
              </h4>
              <p className="text-sm text-blue-800">
                Only enable the operations that are safe and necessary for each
                service. Avoid giving restart permissions to critical services
                unless needed.
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">
                Link Related Services
              </h4>
              <p className="text-sm text-green-800">
                Link services to their corresponding portal cards to provide
                users with convenient access to service control functionality.
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
