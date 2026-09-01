import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles, requiredPermission }) {
  const { user, userData, loading, effectiveRole } = useAuth()
  const location = useLocation()

  if (loading) return null

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If roles are specified, check if effectiveRole is authorized
  if (allowedRoles && !allowedRoles.includes(effectiveRole)) {
    console.warn(`🚫 [ProtectedRoute] Acesso negado para rota: ${location.pathname}. Papel atual: ${effectiveRole}. Permitidos: ${allowedRoles.join(', ')}`)
    return <Navigate to="/" replace />
  }

  // Verifica permissão específica (RBAC)
  const isActuallyAdmin = userData?.role === 'admin' || userData?.roles?.admin || effectiveRole === 'admin'
  if (requiredPermission && !isActuallyAdmin && userData?.permissions) {
    if (!userData.permissions[requiredPermission]) {
       console.warn(`🚫 [ProtectedRoute] Acesso negado por falta de permissão '${requiredPermission}' para rota: ${location.pathname}`)
       return <Navigate to="/" replace />
    }
  }

  return children
}
