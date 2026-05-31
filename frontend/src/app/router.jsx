import { createBrowserRouter } from 'react-router-dom';

import App from './App.jsx';
import LoginPage from '../features/auth/LoginPage.jsx';
import ProtectedRoute from '../features/auth/ProtectedRoute.jsx';
import RegisterPage from '../features/auth/RegisterPage.jsx';
import BookingDetailPage from '../features/booking/BookingDetailPage.jsx';
import BookingHistoryPage from '../features/booking/BookingHistoryPage.jsx';
import BookingPendingPage from '../features/booking/BookingPendingPage.jsx';
import CreateBookingPage from '../features/booking/CreateBookingPage.jsx';
import HealthPage from '../features/health/HealthPage.jsx';
import HomePage from '../features/home/HomePage.jsx';
import EditProfilePage from '../features/profile/EditProfilePage.jsx';
import ProfilePage from '../features/profile/ProfilePage.jsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile/edit',
        element: (
          <ProtectedRoute>
            <EditProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'bookings/create',
        element: (
          <ProtectedRoute>
            <CreateBookingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'bookings/:id/pending',
        element: (
          <ProtectedRoute>
            <BookingPendingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'bookings/my',
        element: (
          <ProtectedRoute>
            <BookingHistoryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'bookings/:id',
        element: (
          <ProtectedRoute>
            <BookingDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'health',
        element: <HealthPage />,
      },
    ],
  },
]);
