import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from '../page';
import { mockCards, mockFetchResponse, mockFetchError } from '@/lib/test-utils';

// Mock the LabCard component
jest.mock('@/components/lab-card', () => ({
  LabCard: ({
    id,
    title,
    description,
    group,
  }: {
    id: string;
    title: string;
    description: string;
    group?: string;
  }) => (
    <div
      data-testid="lab-card"
      data-title={title}
      data-group={group || 'Development'}
    >
      <h3>{title}</h3>
      <p>{description}</p>
      <span>Group: {group || 'Development'}</span>
    </div>
  ),
}));

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Rendering', () => {
    it('renders the main portal header', () => {
      render(<HomePage />);

      // The logo text is split between "LAB" and "PORTAL" elements
      expect(screen.getByText('LAB')).toBeInTheDocument();
      expect(screen.getByText('PORTAL')).toBeInTheDocument();
      expect(screen.getByText('ADMIN')).toBeInTheDocument();
    });

    it('renders the cyberpunk-themed header with logo', () => {
      render(<HomePage />);

      // Find the logo container that contains both LAB and PORTAL
      const logoContainer = screen.getByText('LAB').closest('h1');
      expect(logoContainer).toBeInTheDocument();
      expect(logoContainer).toHaveClass('text-2xl', 'font-bold');
    });

    it('displays live system time', async () => {
      render(<HomePage />);

      // Should show time in the header (TimeDisplay component renders time)
      await waitFor(() => {
        const timeElement = screen.getByText(/\d{1,2}:\d{2}:\d{2}/);
        expect(timeElement).toBeInTheDocument();
      });
    });
  });

  describe('LabCardsGrid', () => {
    it('shows loading state initially', () => {
      (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {})); // Never resolves

      render(<HomePage />);

      // Should show loading skeleton cards (look for individual skeleton cards with animate-pulse)
      const skeletonCards = screen.getAllByText('', {
        selector: '.animate-pulse',
      });
      expect(skeletonCards.length).toBeGreaterThan(0);
    });

    it('fetches cards on mount', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse(mockCards)
      );

      render(<HomePage />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/cards', {
          cache: 'no-store',
        });
      });
    });

    it('displays cards when fetch is successful', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse(mockCards)
      );

      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Test Lab Tool 1')).toBeInTheDocument();
        expect(screen.getByText('Test Lab Tool 2')).toBeInTheDocument();
        expect(screen.getByText('Production Tool')).toBeInTheDocument();
      });
    });

    it('handles fetch error gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchError('Failed to fetch', 500)
      );

      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('No Lab Tools Available')).toBeInTheDocument();
        expect(
          screen.getByText(
            'There are currently no lab tools configured. Please check back later or contact an administrator.'
          )
        ).toBeInTheDocument();
      });
    });

    it('shows no results message when search has no matches', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse(mockCards)
      );

      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Test Lab Tool 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search lab tools...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText('No Results Found')).toBeInTheDocument();
      expect(
        screen.getByText(/No lab tools match your search for "nonexistent"/)
      ).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    beforeEach(async () => {
      // Mock appearance API call
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              data: {
                instanceName: 'Test Instance',
                headerText: 'Test Header Message',
                theme: 'system',
              },
            }),
        })
        // Mock cards API call
        .mockResolvedValueOnce(mockFetchResponse(mockCards));
    });

    it('filters cards by title', async () => {
      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Test Lab Tool 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search lab tools...');
      fireEvent.change(searchInput, { target: { value: 'Test Lab Tool 1' } });

      expect(screen.getByText('Test Lab Tool 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Lab Tool 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Production Tool')).not.toBeInTheDocument();
    });

    it('filters cards by description', async () => {
      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Test Lab Tool 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search lab tools...');
      fireEvent.change(searchInput, { target: { value: 'production tool' } });

      expect(screen.getByText('Production Tool')).toBeInTheDocument();
      expect(screen.queryByText('Test Lab Tool 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Lab Tool 2')).not.toBeInTheDocument();
    });

    it('filters cards by group', async () => {
      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Test Lab Tool 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search lab tools...');
      fireEvent.change(searchInput, { target: { value: 'Production' } });

      expect(screen.getByText('Production Tool')).toBeInTheDocument();
      expect(screen.queryByText('Test Lab Tool 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Lab Tool 2')).not.toBeInTheDocument();
    });

    it('is case insensitive', async () => {
      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Test Lab Tool 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search lab tools...');
      fireEvent.change(searchInput, { target: { value: 'TEST LAB TOOL' } });

      expect(screen.getByText('Test Lab Tool 1')).toBeInTheDocument();
      expect(screen.getByText('Test Lab Tool 2')).toBeInTheDocument();
    });

    it('clears search when clear button is clicked', async () => {
      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Test Lab Tool 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search lab tools...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      // Should show no results message with clear button
      expect(screen.getByText('No Results Found')).toBeInTheDocument();
      expect(screen.getByText('Clear Search')).toBeInTheDocument();

      // Click clear button
      const clearButton = screen.getByText('Clear Search');
      fireEvent.click(clearButton);

      // Should show all cards again
      await waitFor(() => {
        expect(screen.getByText('Test Lab Tool 1')).toBeInTheDocument();
        expect(screen.getByText('Test Lab Tool 2')).toBeInTheDocument();
        expect(screen.getByText('Production Tool')).toBeInTheDocument();
      });

      // Search input should be cleared
      expect(searchInput).toHaveValue('');
    });
  });

  describe('Category Grouping', () => {
    beforeEach(async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchResponse(mockCards)
      );
      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Test Lab Tool 1')).toBeInTheDocument();
      });
    });

    it('groups cards by category', () => {
      // Should show category headers
      expect(screen.getByText('Development')).toBeInTheDocument();
      expect(screen.getByText('Production')).toBeInTheDocument();
    });

    it('displays correct tool count for each category', () => {
      expect(screen.getByText('2 tools')).toBeInTheDocument(); // Development
      expect(screen.getByText('1 tool')).toBeInTheDocument(); // Production
    });

    it('sorts categories alphabetically', () => {
      const categoryHeaders = screen.getAllByText(/^(Development|Production)$/);
      expect(categoryHeaders[0]).toHaveTextContent('Development');
      expect(categoryHeaders[1]).toHaveTextContent('Production');
    });

    it('sorts cards within categories by order', () => {
      const developmentCards = screen
        .getAllByTestId('lab-card')
        .filter((card) => card.getAttribute('data-group') === 'Development');

      expect(developmentCards[0]).toHaveAttribute(
        'data-title',
        'Test Lab Tool 1'
      );
      expect(developmentCards[1]).toHaveAttribute(
        'data-title',
        'Test Lab Tool 2'
      );
    });
  });

  describe('Navigation', () => {
    it('provides admin access link', () => {
      render(<HomePage />);

      const adminLink = screen.getByText('ADMIN');
      expect(adminLink).toBeInTheDocument();
      expect(adminLink.closest('a')).toHaveAttribute('href', '/admin/login');
    });

    it('provides admin access link in no tools message', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockFetchError('Failed to fetch', 500)
      );

      render(<HomePage />);

      await waitFor(() => {
        const adminAccessButton = screen.getByText('Admin Access');
        expect(adminAccessButton).toBeInTheDocument();
        expect(adminAccessButton.closest('a')).toHaveAttribute(
          'href',
          '/admin/login'
        );
      });
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive grid classes', () => {
      render(<HomePage />);

      // Check that responsive grid classes are applied to the loading skeleton grid
      const gridContainer = document.querySelector('.grid');
      expect(gridContainer).toHaveClass(
        'grid',
        'gap-8',
        'md:grid-cols-2',
        'lg:grid-cols-3'
      );
    });
  });

  describe('Error States', () => {
    it('shows appropriate message when no cards are available', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockFetchResponse([]));

      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('No Lab Tools Available')).toBeInTheDocument();
        expect(
          screen.getByText(
            'There are currently no lab tools configured. Please check back later or contact an administrator.'
          )
        ).toBeInTheDocument();
      });
    });

    it('handles network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<HomePage />);

      // Should still render the page structure
      expect(screen.getByText('LAB')).toBeInTheDocument();
      expect(screen.getByText('PORTAL')).toBeInTheDocument();
    });
  });
});
