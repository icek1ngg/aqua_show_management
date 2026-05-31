import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from './AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

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

  if (!isAuthenticated) {
    return <Navigate replace to="/login" state={{ from: location }} />;
  }

  return children;
}
