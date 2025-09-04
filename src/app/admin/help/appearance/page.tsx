/* eslint-disable react/no-unescaped-entities */
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Palette,
  ArrowLeft,
  Image,
  Type,
  Clock,
  Eye,
  Save,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AppearanceHelpPage() {
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
        <span className="text-gray-900">Appearance</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="h-8 w-8 text-pink-600" />
          <h1 className="text-4xl font-bold text-gray-900">
            Appearance Settings
          </h1>
        </div>
        <p className="text-gray-600 text-lg">
          Customize your portal&apos;s branding, colors, and visual appearance
        </p>
      </div>

      {/* What is Appearance Customization */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>What is Appearance Customization?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Appearance customization allows you to brand your Lab Portal with
            your organization's identity. You can customize the instance name,
            header text, colors, and other visual elements to create a
            personalized experience for your users.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <Type className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <h4 className="font-medium">Branding</h4>
                <p className="text-sm text-gray-600">
                  Custom instance names and header text
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Palette className="h-5 w-5 text-pink-600 mt-1" />
              <div>
                <h4 className="font-medium">Color Themes</h4>
                <p className="text-sm text-gray-600">
                  Customize colors and visual styling
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Image className="h-5 w-5 text-green-600 mt-1" alt="" />
              <div>
                <h4 className="font-medium">Visual Elements</h4>
                <p className="text-sm text-gray-600">
                  Upload logos and customize visual components
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Eye className="h-5 w-5 text-purple-600 mt-1" />
              <div>
                <h4 className="font-medium">User Experience</h4>
                <p className="text-sm text-gray-600">
                  Create a cohesive, branded experience
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accessing Appearance Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Accessing Appearance Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h3 className="font-medium">Navigate to Appearance</h3>
                <p className="text-sm text-gray-600">
                  Go to the Appearance section in the admin dashboard navigation
                  menu.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h3 className="font-medium">View Current Settings</h3>
                <p className="text-sm text-gray-600">
                  The appearance form will load with your current configuration
                  settings.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h3 className="font-medium">Make Changes</h3>
                <p className="text-sm text-gray-600">
                  Modify any appearance settings using the form fields and
                  controls.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <h3 className="font-medium">Save Changes</h3>
                <p className="text-sm text-gray-600">
                  Click "Save Changes" to apply your new appearance settings.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings Explained */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Appearance Settings Explained</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-pink-500 pl-4">
              <h4 className="font-medium">Instance Name</h4>
              <p className="text-sm text-gray-600">
                The main title displayed in the portal header (e.g., "My Lab
                Portal", "Development Environment")
              </p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium">Header Text</h4>
              <p className="text-sm text-gray-600">
                Optional subtitle or description text displayed below the
                instance name
              </p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-medium">Show Clock</h4>
              <p className="text-sm text-gray-600">
                Toggle to display a live clock in the portal header
              </p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-medium">Theme</h4>
              <p className="text-sm text-gray-600">
                Choose between light, dark, or system theme preferences
              </p>
            </div>
            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="font-medium">Primary Color</h4>
              <p className="text-sm text-gray-600">
                Main color used throughout the portal interface
              </p>
            </div>
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-medium">Secondary Color</h4>
              <p className="text-sm text-gray-600">
                Accent color used for highlights and secondary elements
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Updates */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Real-time Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              When you save appearance changes, they are applied immediately
              across the portal:
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">
                Instant Application
              </h4>
              <p className="text-sm text-green-800">
                Changes to instance name, header text, and other settings are
                applied immediately without requiring a page refresh.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <RefreshCw className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-medium">Automatic Refresh</h4>
                  <p className="text-sm text-gray-600">
                    The portal header automatically updates to reflect your new
                    appearance settings.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Eye className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium">Live Preview</h4>
                  <p className="text-sm text-gray-600">
                    You can see changes take effect immediately as you modify
                    settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customization Tips */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Customization Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                Choose Meaningful Names
              </h4>
              <p className="text-sm text-blue-800">
                Use descriptive instance names that clearly identify your
                portal's purpose (e.g., "Production Lab", "Development
                Environment", "Research Portal").
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">
                Use Header Text Wisely
              </h4>
              <p className="text-sm text-green-800">
                Header text is perfect for additional context, instructions, or
                branding messages that help users understand the portal's
                purpose.
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-2">
                Color Coordination
              </h4>
              <p className="text-sm text-purple-800">
                Choose colors that work well together and align with your
                organization's branding guidelines for a professional
                appearance.
              </p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-medium text-orange-900 mb-2">
                Test Different Themes
              </h4>
              <p className="text-sm text-orange-800">
                Experiment with different theme settings to find what works best
                for your users and environment.
              </p>
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
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
              <h4 className="font-medium text-pink-900 mb-2">Keep It Simple</h4>
              <p className="text-sm text-pink-800">
                Avoid overly complex color schemes or cluttered header text.
                Simple, clean designs are more professional and user-friendly.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                Consider Accessibility
              </h4>
              <p className="text-sm text-blue-800">
                Ensure sufficient contrast between text and background colors
                for readability, especially for users with visual impairments.
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">
                Document Changes
              </h4>
              <p className="text-sm text-green-800">
                Keep track of appearance changes, especially in shared
                environments, to maintain consistency across your organization.
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
