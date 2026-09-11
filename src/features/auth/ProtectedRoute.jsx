import React, { useEffect } from 'react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { getValidToken } from '../../shared/lib/api'
import { useAuthStore } from '../../app/store'

export function ProtectedRoute({ allowedRoles, children }) {
  const token = getValidToken()
  const user = useAuthStore(state => state.user)
  const logout = useAuthStore(state => state.logout)
  const location = useLocation()
  const unauthorized = !token || !user

  useEffect(() => {
    if (unauthorized) logout()
  }, [unauthorized, logout])

  if (unauthorized) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />
  }

  return children ? children : <Outlet />
}
