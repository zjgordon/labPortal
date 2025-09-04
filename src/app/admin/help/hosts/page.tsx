/* eslint-disable react/no-unescaped-entities */
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Home,
  ArrowLeft,
  Plus,
  Key,
  Wifi,
  Shield,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HostsHelpPage() {
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
        <span className="text-gray-900">Hosts</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Home className="h-8 w-8 text-green-600" />
          <h1 className="text-4xl font-bold text-gray-900">
            Hosts Configuration
          </h1>
        </div>
        <p className="text-gray-600 text-lg">
          Set up and manage infrastructure hosts for remote service control
        </p>
      </div>

      {/* Prerequisites */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Prerequisites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 mb-3">
              <strong>Note:</strong> Host management requires the Control Plane
              to be enabled in Experimental Features.
            </p>
            <p className="text-sm text-yellow-700">
              Make sure to enable the Control Plane in the admin dashboard
              before configuring hosts.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* What are Hosts */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>What are Hosts?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Hosts represent the physical or virtual machines in your
            infrastructure that you want to manage through the Lab Portal. Each
            host can run multiple services that can be controlled remotely.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <Wifi className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <h4 className="font-medium">Remote Management</h4>
                <p className="text-sm text-gray-600">
                  Control services on remote machines from the portal
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Key className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <h4 className="font-medium">Secure Authentication</h4>
                <p className="text-sm text-gray-600">
                  Token-based authentication for secure access
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-purple-600 mt-1" />
              <div>
                <h4 className="font-medium">Health Monitoring</h4>
                <p className="text-sm text-gray-600">
                  Real-time heartbeat and status monitoring
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-orange-600 mt-1" />
              <div>
                <h4 className="font-medium">Service Control</h4>
                <p className="text-sm text-gray-600">
                  Start, stop, and restart systemd services
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adding Hosts */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adding New Hosts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h3 className="font-medium">Navigate to Hosts Management</h3>
                <p className="text-sm text-gray-600">
                  Go to the Hosts section in the admin dashboard (only visible
                  when Control Plane is enabled).
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h3 className="font-medium">Click "Add New Host"</h3>
                <p className="text-sm text-gray-600">
                  Use the "Add New Host" button to open the host creation form.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h3 className="font-medium">Configure Host Details</h3>
                <p className="text-sm text-gray-600">
                  Provide a name for the host and optionally an IP address or
                  hostname.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <h3 className="font-medium">Generate Agent Token</h3>
                <p className="text-sm text-gray-600">
                  Create a secure authentication token for the host's agent to
                  use.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Host Properties */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Host Properties Explained</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-medium">Name</h4>
              <p className="text-sm text-gray-600">
                A descriptive name for the host (e.g., "Web Server", "Database
                Server", "AI Workstation")
              </p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium">Address</h4>
              <p className="text-sm text-gray-600">
                IP address or hostname where the agent is running (optional for
                localhost)
              </p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-medium">Agent Token</h4>
              <p className="text-sm text-gray-600">
                Secure authentication token for the host's agent (generated
                automatically)
              </p>
            </div>
            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="font-medium">Last Seen</h4>
              <p className="text-sm text-gray-600">
                Timestamp of the last successful heartbeat from the agent
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Installation */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Installing the Agent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              After creating a host, you need to install and configure the Lab
              Portal agent on that machine:
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium mb-2">Quick Installation</h4>
              <div className="bg-black text-green-400 p-3 rounded font-mono text-sm">
                <div># Download and install the agent</div>
                <div>
                  curl -sSL https://your-portal.com/agent/install.sh | bash
                </div>
                <div></div>
                <div># Configure with your token</div>
                <div>
                  sudo lab-portal-agent configure --token YOUR_AGENT_TOKEN
                </div>
                <div></div>
                <div># Start the agent service</div>
                <div>sudo systemctl enable --now lab-portal-agent</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Key className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-medium">Token Configuration</h4>
                  <p className="text-sm text-gray-600">
                    Use the generated agent token to authenticate the agent with
                    your portal.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium">Service Management</h4>
                  <p className="text-sm text-gray-600">
                    The agent runs as a systemd service and automatically starts
                    on boot.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Wifi className="h-5 w-5 text-purple-600 mt-1" />
                <div>
                  <h4 className="font-medium">Network Access</h4>
                  <p className="text-sm text-gray-600">
                    Ensure the host can reach your portal's API endpoints for
                    communication.
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
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">
                Use Descriptive Names
              </h4>
              <p className="text-sm text-green-800">
                Choose clear, descriptive names for your hosts that indicate
                their purpose or location (e.g., "Production Web Server",
                "Development Database").
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                Secure Token Management
              </h4>
              <p className="text-sm text-blue-800">
                Keep agent tokens secure and rotate them regularly. Never share
                tokens in logs or documentation.
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-2">
                Monitor Host Health
              </h4>
              <p className="text-sm text-purple-800">
                Regularly check the "Last Seen" timestamp to ensure agents are
                communicating properly with the portal.
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
