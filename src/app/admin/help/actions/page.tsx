/* eslint-disable react/no-unescaped-entities */
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Activity,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Square,
  RotateCcw,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ActionsHelpPage() {
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
        <span className="text-gray-900">Actions</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="h-8 w-8 text-orange-600" />
          <h1 className="text-4xl font-bold text-gray-900">
            Actions & Control
          </h1>
        </div>
        <p className="text-gray-600 text-lg">
          Understand the action queue system and remote service control
        </p>
      </div>

      {/* What are Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>What are Actions?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Actions are commands sent to agents running on your hosts to control
            services. The action queue system manages these commands, ensuring
            they are executed reliably and providing real-time status updates.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <Play className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <h4 className="font-medium">Service Control</h4>
                <p className="text-sm text-gray-600">
                  Start, stop, and restart services on remote hosts
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <List className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <h4 className="font-medium">Queue Management</h4>
                <p className="text-sm text-gray-600">
                  Reliable command queuing and execution tracking
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-purple-600 mt-1" />
              <div>
                <h4 className="font-medium">Real-time Status</h4>
                <p className="text-sm text-gray-600">
                  Live updates on action progress and completion
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-1" />
              <div>
                <h4 className="font-medium">Error Handling</h4>
                <p className="text-sm text-gray-600">
                  Comprehensive error reporting and retry mechanisms
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Lifecycle */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Action Lifecycle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h3 className="font-medium">Queued</h3>
                <p className="text-sm text-gray-600">
                  Action is created and added to the queue, waiting for an agent
                  to pick it up.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h3 className="font-medium">Running</h3>
                <p className="text-sm text-gray-600">
                  Agent has picked up the action and is executing the command on
                  the host.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h3 className="font-medium">Completed</h3>
                <p className="text-sm text-gray-600">
                  Action has been successfully executed and the result has been
                  reported back.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <h3 className="font-medium">Failed</h3>
                <p className="text-sm text-gray-600">
                  Action encountered an error during execution and could not be
                  completed.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Types */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Action Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Play className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <h4 className="font-medium">Start Service</h4>
                <p className="text-sm text-gray-600">
                  Starts a systemd service using{' '}
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
                  Stops a systemd service using{' '}
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
                  Restarts a systemd service using{' '}
                  <code className="bg-gray-100 px-1 rounded">
                    systemctl restart
                  </code>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Queue Management */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Action Queue Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              The action queue system ensures reliable command execution across
              your infrastructure:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  Automatic Polling
                </h4>
                <p className="text-sm text-blue-800">
                  Agents automatically poll for new actions every few seconds,
                  ensuring commands are picked up quickly.
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Idempotency</h4>
                <p className="text-sm text-green-800">
                  Duplicate actions are automatically detected and prevented
                  using idempotency keys.
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-2">
                  Rate Limiting
                </h4>
                <p className="text-sm text-purple-800">
                  Built-in rate limiting prevents overwhelming hosts with too
                  many simultaneous actions.
                </p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-medium text-orange-900 mb-2">
                  Error Recovery
                </h4>
                <p className="text-sm text-orange-800">
                  Failed actions are logged with detailed error information for
                  troubleshooting.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monitoring Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Monitoring Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              You can monitor action execution through the Actions section in
              the admin dashboard:
            </p>

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <List className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-medium">Action List</h4>
                  <p className="text-sm text-gray-600">
                    View all actions with their current status, timestamps, and
                    execution details.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium">Real-time Updates</h4>
                  <p className="text-sm text-gray-600">
                    Action status updates automatically as agents report back
                    their progress.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-1" />
                <div>
                  <h4 className="font-medium">Error Details</h4>
                  <p className="text-sm text-gray-600">
                    Failed actions include detailed error messages to help with
                    troubleshooting.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Indicators */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Status Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div>
                <h4 className="font-medium">Queued</h4>
                <p className="text-sm text-gray-600">
                  Action is waiting to be picked up by an agent
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <h4 className="font-medium">Running</h4>
                <p className="text-sm text-gray-600">
                  Action is currently being executed by an agent
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <h4 className="font-medium">Completed</h4>
                <p className="text-sm text-gray-600">
                  Action has been successfully executed
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div>
                <h4 className="font-medium">Failed</h4>
                <p className="text-sm text-gray-600">
                  Action encountered an error during execution
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
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-medium text-orange-900 mb-2">
                Monitor Action Status
              </h4>
              <p className="text-sm text-orange-800">
                Regularly check the Actions section to ensure commands are being
                executed successfully and troubleshoot any failures.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                Understand Service Dependencies
              </h4>
              <p className="text-sm text-blue-800">
                Be aware of service dependencies when starting or stopping
                services, as this can affect other running services.
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">
                Use Appropriate Permissions
              </h4>
              <p className="text-sm text-green-800">
                Configure service permissions carefully to ensure users can only
                perform safe operations on each service.
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
