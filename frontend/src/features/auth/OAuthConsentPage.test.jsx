import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import OAuthConsentPage from './OAuthConsentPage.jsx';
import { AuthProvider } from './AuthContext.jsx';
import * as authService from '../../services/authService.js';
import { vi } from 'vitest';

vi.mock('../../services/authService.js', () => ({
  completeOAuth: vi.fn(),
  getCurrentUser: vi.fn(),
  refreshAccessToken: vi.fn(),
}));

describe('OAuthConsentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders invalid request if no code is provided', () => {
    render(
      <MemoryRouter initialEntries={['/oauth2/consent']}>
        <AuthProvider>
          <OAuthConsentPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Invalid Request/i)).toBeInTheDocument();
  });

  it('shows error if terms are not accepted', async () => {
    render(
      <MemoryRouter initialEntries={['/oauth2/consent?code=testcode']}>
        <AuthProvider>
          <OAuthConsentPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Complete Sign Up/i }));

    expect(await screen.findByText(/You must accept the terms/i)).toBeInTheDocument();
  });

  it('calls completeOAuthConsent when terms are accepted', async () => {
    authService.completeOAuth.mockResolvedValue({
      accessToken: 'token123',
      expiresIn: 3600,
      user: { email: 'test@example.com' }
    });
    authService.getCurrentUser.mockResolvedValue({
      user: { email: 'test@example.com' }
    });

    render(
      <MemoryRouter initialEntries={['/oauth2/consent?code=testcode']}>
        <AuthProvider>
          <OAuthConsentPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Complete Sign Up/i }));

    await waitFor(() => {
      expect(authService.completeOAuth).toHaveBeenCalledWith({
        code: 'testcode',
        acceptedTerms: true,
        legalDocumentVersion: '2026-07-15'
      });
    });
  });
});
