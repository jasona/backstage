'use client';

/**
 * Tests for bulk actions component.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BulkActions } from './bulk-actions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock use-sonos hook
const mockPauseAll = jest.fn();
const mockResumeAll = jest.fn();
const mockSetAllVolume = jest.fn();

jest.mock('@/hooks/use-sonos', () => ({
  useDevices: () => ({
    devices: [
      { id: '1', roomName: 'Living Room', playbackState: 'PLAYING', volume: 50 },
      { id: '2', roomName: 'Bedroom', playbackState: 'PAUSED_PLAYBACK', volume: 30 },
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

describe('BulkActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders pause all button', () => {
    render(<BulkActions />, { wrapper });
    expect(screen.getByText('Pause All')).toBeInTheDocument();
  });

  it('renders resume all button', () => {
    render(<BulkActions />, { wrapper });
    expect(screen.getByText('Resume All')).toBeInTheDocument();
  });

  it('renders volume dropdown', () => {
    render(<BulkActions />, { wrapper });
    expect(screen.getByText('Volume')).toBeInTheDocument();
  });

  it('calls pauseAll when Pause All is clicked', async () => {
    render(<BulkActions />, { wrapper });

    const pauseButton = screen.getByText('Pause All');
    fireEvent.click(pauseButton);

    await waitFor(() => {
      expect(mockPauseAll).toHaveBeenCalled();
    });
  });

  it('calls resumeAll when Resume All is clicked', async () => {
    render(<BulkActions />, { wrapper });

    const resumeButton = screen.getByText('Resume All');
    fireEvent.click(resumeButton);

    await waitFor(() => {
      expect(mockResumeAll).toHaveBeenCalled();
    });
  });

  it('shows volume options when Volume dropdown is clicked', async () => {
    render(<BulkActions />, { wrapper });

    const volumeButton = screen.getByText('Volume');
    fireEvent.click(volumeButton);

    await waitFor(() => {
      expect(screen.getByText('Mute All')).toBeInTheDocument();
      expect(screen.getByText('Set All to 25%')).toBeInTheDocument();
      expect(screen.getByText('Set All to 50%')).toBeInTheDocument();
      expect(screen.getByText('Set All to 75%')).toBeInTheDocument();
      expect(screen.getByText('Set All to 100%')).toBeInTheDocument();
    });
  });

  it('shows confirmation dialog for mute action', async () => {
    render(<BulkActions />, { wrapper });

    // Open volume dropdown
    const volumeButton = screen.getByText('Volume');
    fireEvent.click(volumeButton);

    await waitFor(() => {
      expect(screen.getByText('Mute All')).toBeInTheDocument();
    });

    // Click mute all
    const muteOption = screen.getByText('Mute All');
    fireEvent.click(muteOption);

    // Should show confirmation dialog
    await waitFor(() => {
      expect(screen.getByText('Mute All Devices?')).toBeInTheDocument();
    });
  });

  it('executes mute action after confirmation', async () => {
    render(<BulkActions />, { wrapper });

    // Open volume dropdown
    const volumeButton = screen.getByText('Volume');
    fireEvent.click(volumeButton);

    await waitFor(() => {
      expect(screen.getByText('Mute All')).toBeInTheDocument();
    });

    // Click mute all
    const muteOption = screen.getByText('Mute All');
    fireEvent.click(muteOption);

    // Click confirm
    await waitFor(() => {
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockSetAllVolume).toHaveBeenCalledWith(0, expect.any(Object));
    });
  });

  it('cancels confirmation dialog when Cancel is clicked', async () => {
    render(<BulkActions />, { wrapper });

    // Open volume dropdown
    const volumeButton = screen.getByText('Volume');
    fireEvent.click(volumeButton);

    await waitFor(() => {
      expect(screen.getByText('Mute All')).toBeInTheDocument();
    });

    // Click mute all
    const muteOption = screen.getByText('Mute All');
    fireEvent.click(muteOption);

    // Click cancel
    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByText('Mute All Devices?')).not.toBeInTheDocument();
    });

    // Action should not be called
    expect(mockSetAllVolume).not.toHaveBeenCalled();
  });

  it('sets volume directly without confirmation for 50% and above', async () => {
    render(<BulkActions />, { wrapper });

    // Open volume dropdown
    const volumeButton = screen.getByText('Volume');
    fireEvent.click(volumeButton);

    await waitFor(() => {
      expect(screen.getByText('Set All to 50%')).toBeInTheDocument();
    });

    // Click 50%
    const fiftyOption = screen.getByText('Set All to 50%');
    fireEvent.click(fiftyOption);

    // Should call setAllVolume directly without confirmation
    await waitFor(() => {
      expect(mockSetAllVolume).toHaveBeenCalledWith(50, expect.any(Object));
    });
  });
});
