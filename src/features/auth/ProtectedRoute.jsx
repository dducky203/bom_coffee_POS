import React from 'react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { getToken } from '../../shared/lib/api'
import { useAuthStore } from '../../app/store'

export function ProtectedRoute({ allowedRoles, children }) {
  const token = getToken()
  const user = useAuthStore(state => state.user)
  const location = useLocation()

  // 1. Nếu không có token hoặc không có thông tin user -> chuyển hướng về trang login
  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // 2. Nếu có yêu cầu role mà role của user không nằm trong danh sách được phép -> chuyển hướng về trang không có quyền (403)
  if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />
  }

  return children ? children : <Outlet />
}
