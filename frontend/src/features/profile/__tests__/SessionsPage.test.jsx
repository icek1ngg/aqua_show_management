import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SessionsPage from '../SessionsPage';
import { getSessions, revokeSession, revokeAllOtherSessions } from '../../../services/sessionService';

vi.mock('../../../services/sessionService');
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

const mockSessions = [
  {
    id: '1',
    createdAt: '2026-07-15T12:00:00Z',
    lastSeenAt: '2026-07-15T14:00:00Z',
    device: 'Chrome Windows',
    ipPrefix: '192.168.1.1',
    isCurrent: true
  },
  {
    id: '2',
    createdAt: '2026-07-14T12:00:00Z',
    lastSeenAt: '2026-07-14T14:00:00Z',
    device: 'Safari Mobile',
    ipPrefix: '10.0.0.1',
    isCurrent: false
  }
];

describe('SessionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    getSessions.mockImplementation(() => new Promise(() => {}));
    render(<SessionsPage />);
    expect(screen.getByRole('status', { hidden: true }) || document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders sessions list correctly', async () => {
    getSessions.mockResolvedValue({ data: mockSessions });
    render(<SessionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Desktop Device')).toBeInTheDocument();
      expect(screen.getByText('Mobile Device')).toBeInTheDocument();
      expect(screen.getByText('This device')).toBeInTheDocument();
    });
  });

  it('calls revokeSession when Sign out button is clicked', async () => {
    getSessions.mockResolvedValue({ data: mockSessions });
    revokeSession.mockResolvedValue({});
    
    render(<SessionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Sign out'));
    
    await waitFor(() => {
      expect(revokeSession).toHaveBeenCalledWith('2');
    });
  });
});
