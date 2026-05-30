import { createBrowserRouter } from 'react-router-dom';

import App from './App.jsx';
import HomePage from '../features/home/HomePage.jsx';
import HealthPage from '../features/health/HealthPage.jsx';

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
        path: 'health',
        element: <HealthPage />,
      },
    ],
  },
]);
