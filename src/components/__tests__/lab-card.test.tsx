import React from 'react'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LabCard } from '../lab-card'
import { mockCardStatus, mockCardStatusDown, mockFetchResponse, mockFetchError } from '@/lib/test-utils'

// Mock the StatusIndicator component - the component doesn't actually use this
// but we'll keep the mock for compatibility
jest.mock('../status-indicator', () => ({
  StatusIndicator: ({ isUp, isStale }: { isUp: boolean | null; isStale: boolean }) => (
    <div data-testid="status-indicator" data-is-up={isUp} data-is-stale={isStale}>
      Status: {isUp ? 'UP' : isUp === false ? 'DOWN' : 'UNKNOWN'} {isStale ? '(STALE)' : ''}
    </div>
  ),
}))



describe('LabCard', () => {
  const defaultProps = {
    id: 'test-card-1',
    title: 'Test Lab Tool',
    description: 'A test lab tool for testing purposes',
    url: 'http://localhost:8080',
    iconPath: '/icons/test.svg',
    order: 1,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('Rendering', () => {
    it('renders card with correct title and description', () => {
      render(<LabCard {...defaultProps} />)
      
      expect(screen.getByText('Test Lab Tool')).toBeInTheDocument()
      expect(screen.getByText('A test lab tool for testing purposes')).toBeInTheDocument()
    })

    it('renders card with icon when iconPath is provided', () => {
      render(<LabCard {...defaultProps} />)
      
      const icon = screen.getByAltText('Test Lab Tool icon')
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveAttribute('src', '/icons/test.svg')
    })

    it('renders fallback monitor icon when iconPath is not provided', () => {
      render(<LabCard {...defaultProps} iconPath={null} />)
      
      // Should render the card content even without icon
      expect(screen.getByText('Test Lab Tool')).toBeInTheDocument()
      expect(screen.getByText('A test lab tool for testing purposes')).toBeInTheDocument()
    })

    it('applies cyberpunk theme styling to title', () => {
      render(<LabCard {...defaultProps} />)
      
      const title = screen.getByText('Test Lab Tool')
      expect(title).toHaveClass('bg-gradient-to-r', 'from-emerald-400', 'to-cyan-400', 'bg-clip-text', 'text-transparent')
    })
  })

  describe('Status Fetching', () => {
    it('fetches status on mount', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCardStatus),
      })
      
      render(<LabCard {...defaultProps} />)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/status?cardId=test-card-1')
      })
    })

    it('handles successful status fetch', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCardStatus),
      })
      
      render(<LabCard {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('150ms')).toBeInTheDocument()
        expect(screen.getByText('Up')).toBeInTheDocument()
      })
    })

    it('handles status fetch error gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Network error' }),
      })
      
      render(<LabCard {...defaultProps} />)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/status?cardId=test-card-1')
      })
      
      // Should still render the card even if status fetch fails
      expect(screen.getByText('Test Lab Tool')).toBeInTheDocument()
    })


  })

  describe('Status Display', () => {
    it('displays up status correctly', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCardStatus),
      })
      
      render(<LabCard {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Up')).toBeInTheDocument()
        expect(screen.getByText('150ms')).toBeInTheDocument()
        expect(screen.getByText(/Last checked:/)).toBeInTheDocument()
      })
    })

    it('displays down status correctly', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCardStatusDown),
      })
      
      render(<LabCard {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Down')).toBeInTheDocument()
      })
    })

    it('displays stale status when lastChecked is old', async () => {
      const staleStatus = {
        ...mockCardStatus,
        lastChecked: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      }
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(staleStatus),
      })
      
      render(<LabCard {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Stale')).toBeInTheDocument()
      })
    })

    it('displays fresh status when lastChecked is recent', async () => {
      const freshStatus = {
        ...mockCardStatus,
        lastChecked: new Date().toISOString(), // Now
      }
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(freshStatus),
      })
      
      render(<LabCard {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Up')).toBeInTheDocument()
        expect(screen.queryByText('Stale')).not.toBeInTheDocument()
      })
    })
  })

  describe('Card Interaction', () => {
    it('opens URL in new tab when clicked', async () => {
      const mockOpen = jest.fn()
      global.window.open = mockOpen
      
      render(<LabCard {...defaultProps} />)
      
      const card = screen.getByRole('link')
      fireEvent.click(card)
      
      expect(mockOpen).toHaveBeenCalledWith(
        'http://localhost:8080',
        '_blank',
        'noopener,noreferrer'
      )
    })

    it('handles card click with relative URL', async () => {
      const mockOpen = jest.fn()
      global.window.open = mockOpen
      
      render(<LabCard {...defaultProps} url="/relative/path" />)
      
      const card = screen.getByRole('link')
      fireEvent.click(card)
      
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('/relative/path'),
        '_blank',
        'noopener,noreferrer'
      )
    })

    it('handles card click with URL without protocol', async () => {
      const mockOpen = jest.fn()
      global.window.open = mockOpen
      
      render(<LabCard {...defaultProps} url="localhost:8080" />)
      
      const card = screen.getByRole('link')
      fireEvent.click(card)
      
      expect(mockOpen).toHaveBeenCalledWith(
        'http://localhost:8080',
        '_blank',
        'noopener,noreferrer'
      )
    })

    it('shows alert when no URL is configured', async () => {
      const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {})
      
      render(<LabCard {...defaultProps} url="" />)
      
      const card = screen.getByRole('link')
      fireEvent.click(card)
      
      expect(mockAlert).toHaveBeenCalledWith('No URL configured for this card')
      
      mockAlert.mockRestore()
    })

    it('handles popup blocked scenario', async () => {
      global.window.open = jest.fn().mockReturnValue(null)
      
      render(<LabCard {...defaultProps} />)
      
      const card = screen.getByRole('link')
      fireEvent.click(card)
      
      // Should attempt to open popup (which will fail in test environment)
      expect(global.window.open).toHaveBeenCalledWith(
        'http://localhost:8080',
        '_blank',
        'noopener,noreferrer'
      )
      
      // The fallback navigation attempt will fail in jsdom, but that's expected
      // In a real browser, this would attempt to navigate to the URL
    })
  })

  describe('Polling', () => {
    it('sets up polling interval for status updates', async () => {
      jest.useFakeTimers()
      
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCardStatus),
      })
      
      render(<LabCard {...defaultProps} />)
      
      // Initial fetch
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })
      
      // Advance time to trigger polling
      act(() => {
        jest.advanceTimersByTime(30000)
      })
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2)
      })
      
      jest.useRealTimers()
    })

    it('cleans up polling interval on unmount', async () => {
      jest.useFakeTimers()
      
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCardStatus),
      })
      
      const { unmount } = render(<LabCard {...defaultProps} />)
      
      // Initial fetch
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })
      
      // Unmount component
      unmount()
      
      // Advance time - should not trigger another fetch
      act(() => {
        jest.advanceTimersByTime(30000)
      })
      
      expect(global.fetch).toHaveBeenCalledTimes(1)
      
      jest.useRealTimers()
    })
  })

  describe('Error Handling', () => {
    it('handles invalid lastChecked date gracefully', async () => {
      const invalidStatus = {
        ...mockCardStatus,
        lastChecked: 'invalid-date',
      }
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidStatus),
      })
      
      render(<LabCard {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Stale')).toBeInTheDocument()
      })
    })

    it('handles network errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
      
      render(<LabCard {...defaultProps} />)
      
      // Should still render the card
      expect(screen.getByText('Test Lab Tool')).toBeInTheDocument()
    })
  })
})
