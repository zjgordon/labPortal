"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-slate-400 mb-6">
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </p>
            {this.state.error && (
              <details className="text-left mb-6">
                <summary className="cursor-pointer text-sm text-slate-500 mb-2">
                  Error details
                </summary>
                <pre className="text-xs text-slate-400 bg-slate-800 p-3 rounded overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleReset} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
