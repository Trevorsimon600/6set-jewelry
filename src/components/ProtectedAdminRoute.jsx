import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

export default function ProtectedAdminRoute({ children }) {

  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="admin-loading-state">
        <p>Checking your session...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  return children
}
