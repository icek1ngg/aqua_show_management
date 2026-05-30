import { createBrowserRouter } from 'react-router-dom';

import App from './App.jsx';
import LoginPage from '../features/auth/LoginPage.jsx';
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
        element: <ProfilePage />,
      },
      {
        path: 'profile/edit',
        element: <EditProfilePage />,
      },
      {
        path: 'bookings/create',
        element: <CreateBookingPage />,
      },
      {
        path: 'bookings/:id/pending',
        element: <BookingPendingPage />,
      },
      {
        path: 'bookings/my',
        element: <BookingHistoryPage />,
      },
      {
        path: 'bookings/:id',
        element: <BookingDetailPage />,
      },
      {
        path: 'health',
        element: <HealthPage />,
      },
    ],
  },
]);
