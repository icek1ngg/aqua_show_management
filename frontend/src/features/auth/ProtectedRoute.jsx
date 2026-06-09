import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from './AuthContext.jsx';
import { getRedirectPathByRole, getPrimaryUserRole } from './authRedirect.js';

function getUserRoles(user) {
  const roleValues = [user?.role, ...(Array.isArray(user?.roles) ? user.roles : [])]
    .filter(Boolean)
    .map((role) => String(role).replace(/^ROLE_/, '').toUpperCase());

  return [...new Set(roleValues)];
}

export default function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  const isDevMockPaymentRoute =
    import.meta.env.DEV &&
    (
      location.pathname === '/bookings/mock/payment' ||
      (location.pathname === '/payments/result' && (location.search.includes('mock=true') || location.search.includes('bookingId=mock')))
    );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cyan-50 px-4">
        <div className="rounded-3xl border border-cyan-100 bg-white px-8 py-6 text-center shadow-lg shadow-cyan-950/10">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-600" />
          <p className="text-sm font-semibold text-slate-600">Checking your AquaPulse session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isDevMockPaymentRoute) {
    return <Navigate replace to="/login" state={{ from: location }} />;
  }

  if (allowedRoles?.length && !isDevMockPaymentRoute) {
    const userRoles = getUserRoles(user);
    const canAccess = allowedRoles.some((role) => userRoles.includes(String(role).replace(/^ROLE_/, '').toUpperCase()));

    if (!canAccess) {
      return <Navigate replace to={getRedirectPathByRole(getPrimaryUserRole(user))} />;
    }
  }

  return children;
}
