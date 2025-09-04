'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Square,
  Home,
  Server,
  Activity,
  Palette,
  ArrowLeft,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HelpPage() {
  const helpTopics = [
    {
      title: 'Cards Management',
      description:
        'Learn how to create, edit, and organize lab tool cards for your portal',
      icon: Square,
      href: '/admin/help/cards',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Hosts Configuration',
      description:
        'Set up and manage infrastructure hosts for remote service control',
      icon: Home,
      href: '/admin/help/hosts',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Services Management',
      description:
        'Configure systemd services and control permissions for each host',
      icon: Server,
      href: '/admin/help/services',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Actions & Control',
      description:
        'Understand the action queue system and remote service control',
      icon: Activity,
      href: '/admin/help/actions',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Appearance Settings',
      description:
        "Customize your portal's branding, colors, and visual appearance",
      icon: Palette,
      href: '/admin/help/appearance',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
  ];

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <Link href="/admin" className="hover:text-gray-900">
          Admin Dashboard
        </Link>
        <span>/</span>
        <span className="text-gray-900">Help</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">Help Center</h1>
        </div>
        <p className="text-gray-600 text-lg">
          Comprehensive guides and documentation for managing your Lab Portal
        </p>
      </div>

      {/* Help Topics Grid */}
      <div className="space-y-4">
        {helpTopics.map((topic, index) => {
          const IconComponent = topic.icon;
          return (
            <Link key={topic.href} href={topic.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${topic.bgColor}`}>
                      <IconComponent className={`h-6 w-6 ${topic.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {topic.title}
                      </h3>
                      <p className="text-gray-600">{topic.description}</p>
                    </div>
                    <ArrowLeft className="h-5 w-5 text-gray-400 rotate-180" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Start Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Quick Start Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h3 className="font-medium">Start with Cards</h3>
                <p className="text-sm text-gray-600">
                  Create your first lab tool cards to provide access to your
                  services and applications.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h3 className="font-medium">Enable Control Plane</h3>
                <p className="text-sm text-gray-600">
                  Activate experimental features to unlock host management and
                  service control capabilities.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h3 className="font-medium">Configure Hosts & Services</h3>
                <p className="text-sm text-gray-600">
                  Add hosts to your infrastructure and configure which services
                  they can manage.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <h3 className="font-medium">Customize Appearance</h3>
                <p className="text-sm text-gray-600">
                  Brand your portal with custom colors, logos, and instance
                  names.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
