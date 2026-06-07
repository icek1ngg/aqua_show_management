import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../features/auth/AuthContext.jsx';
import { getPrimaryUserRole } from '../features/auth/authRedirect.js';

export default function App() {
  const { loading, user } = useAuth();
  const location = useLocation();

  if (!loading && getPrimaryUserRole(user) === 'STAFF' && !location.pathname.startsWith('/staff/')) {
    return <Navigate replace to="/staff/check-in" />;
  }

  return <Outlet />;
}
