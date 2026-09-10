import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from './Layout'
import { LoginPage } from '../features/auth/LoginPage'
import { ForbiddenPage } from '../features/auth/ForbiddenPage'
import { ProtectedRoute } from '../features/auth/ProtectedRoute'
import { TableMapPage } from '../features/order/TableMapPage'
import { OrderPage } from '../features/order/OrderPage'
import { KdsPage } from '../features/kds/KdsPage'
import { BilliardPage } from '../features/billiard/BilliardPage'
import { DashboardPage } from '../features/report/DashboardPage'
import { MenuPage } from '../features/menu/MenuPage'
import { BilliardPricingPage } from '../features/billiard/BilliardPricingPage'
import { HistoryPage } from '../features/history/HistoryPage'
import { OrderDetailPage } from '../features/history/OrderDetailPage'
import { StaffPage } from '../features/staff/StaffPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '403',
        element: <ForbiddenPage />
      },
      {
        index: true,
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'WAITER', 'CASHIER']}>
            <TableMapPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'order/:tableId',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'WAITER', 'CASHIER']}>
            <OrderPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'kds',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'BARTENDER', 'WAITER', 'CASHIER']}>
            <KdsPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'billiard',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'WAITER', 'CASHIER']}>
            <BilliardPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'menu',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <MenuPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'pricing',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <BilliardPricingPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'history',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'CASHIER']}>
            <HistoryPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'history/:id',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'CASHIER']}>
            <OrderDetailPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'staff',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <StaffPage />
          </ProtectedRoute>
        )
      },
      {
        path: '*',
        element: <Navigate to="/403" replace />
      }
    ]
  }
])
