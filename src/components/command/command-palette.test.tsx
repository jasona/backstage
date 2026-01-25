'use client';

/**
 * Tests for command palette component.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommandPalette } from './command-palette';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock use-sonos hook
const mockPauseAll = jest.fn();
const mockResumeAll = jest.fn();
const mockPlayPause = jest.fn();
const mockSetAllVolume = jest.fn();

jest.mock('@/hooks/use-sonos', () => ({
  useDevices: () => ({
    devices: [
      {
        id: '1',
        roomName: 'Living Room',
        playbackState: 'PLAYING',
        volume: 50,
        muted: false,
        modelName: 'Sonos One',
        nowPlaying: { title: 'Test Song', artist: 'Test Artist' },
      },
      {
        id: '2',
        roomName: 'Bedroom',
        playbackState: 'PAUSED_PLAYBACK',
        volume: 30,
        muted: false,
        modelName: 'Sonos Five',
      },
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
  }),
  usePauseAll: () => ({
    mutate: mockPauseAll,
    isPending: false,
  }),
  useResumeAll: () => ({
    mutate: mockResumeAll,
    isPending: false,
  }),
  usePlayPause: () => ({
    mutate: mockPlayPause,
    isPending: false,
  }),
  useSetAllVolume: () => ({
    mutate: mockSetAllVolume,
    isPending: false,
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('CommandPalette', () => {
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open', () => {
    render(
      <CommandPalette open={true} onOpenChange={mockOnOpenChange} />,
      { wrapper }
    );

    expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <CommandPalette open={false} onOpenChange={mockOnOpenChange} />,
      { wrapper }
    );

    expect(screen.queryByPlaceholderText(/type a command/i)).not.toBeInTheDocument();
  });

  it('shows quick action commands', () => {
    render(
      <CommandPalette open={true} onOpenChange={mockOnOpenChange} />,
      { wrapper }
    );

    expect(screen.getByText('Pause All')).toBeInTheDocument();
    expect(screen.getByText('Resume All')).toBeInTheDocument();
  });

  it('shows volume preset commands', () => {
    render(
      <CommandPalette open={true} onOpenChange={mockOnOpenChange} />,
      { wrapper }
    );

    expect(screen.getByText('Mute All')).toBeInTheDocument();
    expect(screen.getByText('Set All to 25%')).toBeInTheDocument();
    expect(screen.getByText('Set All to 50%')).toBeInTheDocument();
    expect(screen.getByText('Set All to 75%')).toBeInTheDocument();
  });

  it('shows navigation commands', () => {
    render(
      <CommandPalette open={true} onOpenChange={mockOnOpenChange} />,
      { wrapper }
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Diagnostics')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('shows playing devices', () => {
    render(
      <CommandPalette open={true} onOpenChange={mockOnOpenChange} />,
      { wrapper }
    );

    expect(screen.getByText('Pause Living Room')).toBeInTheDocument();
  });

  it('shows paused devices', () => {
    render(
      <CommandPalette open={true} onOpenChange={mockOnOpenChange} />,
      { wrapper }
    );

    expect(screen.getByText('Resume Bedroom')).toBeInTheDocument();
  });

  it('shows all devices in the devices section', () => {
    render(
      <CommandPalette open={true} onOpenChange={mockOnOpenChange} />,
      { wrapper }
    );

    expect(screen.getByText('Living Room')).toBeInTheDocument();
    expect(screen.getByText('Bedroom')).toBeInTheDocument();
  });

  it('calls pauseAll when Pause All is selected', async () => {
    render(
      <CommandPalette open={true} onOpenChange={mockOnOpenChange} />,
      { wrapper }
    );

    const pauseAllItem = screen.getByText('Pause All').closest('[cmdk-item]');
    if (pauseAllItem) {
      fireEvent.click(pauseAllItem);
    }

    await waitFor(() => {
      expect(mockPauseAll).toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('calls setAllVolume with 50 when Set All to 50% is selected', async () => {
    render(
      <CommandPalette open={true} onOpenChange={mockOnOpenChange} />,
      { wrapper }
    );

    const volumeItem = screen.getByText('Set All to 50%').closest('[cmdk-item]');
    if (volumeItem) {
      fireEvent.click(volumeItem);
    }

    await waitFor(() => {
      expect(mockSetAllVolume).toHaveBeenCalledWith(50);
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('shows keyboard shortcut hints', () => {
    render(
      <CommandPalette open={true} onOpenChange={mockOnOpenChange} />,
      { wrapper }
    );

    // Check for keyboard shortcut indicators
    expect(screen.getByText('⌘⇧P')).toBeInTheDocument();
    expect(screen.getByText('⌘⇧R')).toBeInTheDocument();
    expect(screen.getByText('⌘,')).toBeInTheDocument();
  });

  it('filters commands based on search input', async () => {
    render(
      <CommandPalette open={true} onOpenChange={mockOnOpenChange} />,
      { wrapper }
    );

    const input = screen.getByPlaceholderText(/type a command/i);
    fireEvent.change(input, { target: { value: 'pause' } });

    await waitFor(() => {
      expect(screen.getByText('Pause All')).toBeInTheDocument();
      expect(screen.getByText('Pause Living Room')).toBeInTheDocument();
    });
  });
});
