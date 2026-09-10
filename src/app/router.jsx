import { createBrowserRouter } from 'react-router-dom'
import { Layout } from './Layout'
import { LoginPage } from '../features/auth/LoginPage'
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
    element: <Layout />,
    children: [
      {
        index: true,
        element: <TableMapPage />
      },
      {
        path: 'order/:tableId',
        element: <OrderPage />
      },
      {
        path: 'kds',
        element: <KdsPage />
      },
      {
        path: 'billiard',
        element: <BilliardPage />
      },
      {
        path: 'dashboard',
        element: <DashboardPage />
      },
      {
        path: 'menu',
        element: <MenuPage />
      },
      {
        path: 'pricing',
        element: <BilliardPricingPage />
      },
      {
        path: 'history',
        element: <HistoryPage />
      },
      {
        path: 'history/:id',
        element: <OrderDetailPage />
      },
      {
        path: 'staff',
        element: <StaffPage />
      }
    ]
  }
])
