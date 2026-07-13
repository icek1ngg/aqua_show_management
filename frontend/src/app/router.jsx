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
import MyTicketsPage from '../features/ticketing/MyTicketsPage.jsx';
import HomePage from '../features/home/HomePage.jsx';
import EditProfilePage from '../features/profile/EditProfilePage.jsx';
import ProfilePage from '../features/profile/ProfilePage.jsx';
import StaffTicketValidationPage from '../features/staff/StaffTicketValidationPage.jsx';
import AdminDashboard from '../features/admin/pages/AdminDashboard.jsx';
import AdminManageRolesPage from '../features/admin/pages/ManageRolesPage.jsx';
import AdminManageUsersPage from '../features/admin/pages/ManageUsersPage.jsx';
import ManagerDashboard from '../features/manager/pages/ManagerDashboard.jsx';
import ManageBookingsPage from '../features/manager/pages/ManageBookingsPage.jsx';
import ManageSchedulesPage from '../features/manager/pages/ManageSchedulesPage.jsx';
import ManageShowsPage from '../features/manager/pages/ManageShowsPage.jsx';
import ReportsPage from '../features/manager/pages/ReportsPage.jsx';
import ShowDetailPage from '../stitch-react/ShowDetailPage.jsx';

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
        path: 'public/shows',
        element: <HomePage />,
      },
      {
        path: 'shows',
        element: <HomePage />,
      },
      {
        path: 'shows/:showId',
        element: <ShowDetailPage />,
      },
      {
        path: 'public/shows/:showId',
        element: <ShowDetailPage />,
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
        element: <CreateBookingPage />,
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
        path: 'my-tickets',
        element: (
          <ProtectedRoute>
            <MyTicketsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'staff/check-in',
        element: (
          <ProtectedRoute allowedRoles={['STAFF']}>
            <StaffTicketValidationPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'staff/validate-ticket',
        element: (
          <ProtectedRoute allowedRoles={['STAFF']}>
            <StaffTicketValidationPage />
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
      {
        path: 'manager/dashboard',
        element: (
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <ManagerDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'manager/shows',
        element: (
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <ManageShowsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'manager/schedules',
        element: (
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <ManageSchedulesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'manager/bookings',
        element: (
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <ManageBookingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'manager/reports',
        element: (
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <ReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/dashboard',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/users',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminManageUsersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/roles',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminManageRolesPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
