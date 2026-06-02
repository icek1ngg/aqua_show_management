import { createBrowserRouter } from 'react-router-dom';

import App from './App.jsx';
import ForgotPasswordPage from '../features/auth/ForgotPasswordPage.jsx';
import LoginPage from '../features/auth/LoginPage.jsx';
import OAuthSuccessPage from '../features/auth/OAuthSuccessPage.jsx';
import ProtectedRoute from '../features/auth/ProtectedRoute.jsx';
import RegisterPage from '../features/auth/RegisterPage.jsx';
import ResetPasswordPage from '../features/auth/ResetPasswordPage.jsx';
import BookingDetailPage from '../features/booking/BookingDetailPage.jsx';
import BookingHistoryPage from '../features/booking/BookingHistoryPage.jsx';
import CreateBookingPage from '../features/booking/CreateBookingPage.jsx';
import MockPayosCheckoutPage from '../features/payment/MockPayosCheckoutPage.jsx';
import PaymentPage from '../features/payment/PaymentPage.jsx';
import PaymentResultPage from '../features/payment/PaymentResultPage.jsx';
import HomePage from '../features/home/HomePage.jsx';
import EditProfilePage from '../features/profile/EditProfilePage.jsx';
import ProfilePage from '../features/profile/ProfilePage.jsx';
import StaffTicketValidationPage from '../features/staff/StaffTicketValidationPage.jsx';

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
        path: 'forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: 'reset-password',
        element: <ResetPasswordPage />,
      },
      {
        path: 'oauth2/success',
        element: <OAuthSuccessPage />,
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
        path: 'bookings/:bookingId/payment',
        element: (
          <ProtectedRoute>
            <PaymentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'mock/payos-checkout',
        element: <MockPayosCheckoutPage />,
      },
      {
        path: 'payments/result',
        element: (
          <ProtectedRoute>
            <PaymentResultPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'staff/tickets/validate',
        element: (
          <ProtectedRoute allowedRoles={['STAFF']}>
            <StaffTicketValidationPage />
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
    ],
  },
]);
