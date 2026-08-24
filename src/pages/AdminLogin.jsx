import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import './AdminAuth.css'

function AdminLogin() {

  const navigate = useNavigate()
  const { session, loading, signIn, isConfigured, setAuthError, authError } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (loading) {
    return (
      <div className="admin-loading-state">
        <p>Checking authentication...</p>
      </div>
    )
  }

  if (session) {
    return <Navigate to="/admin/dashboard" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!email || !password) {
      setAuthError('Please enter both email and password.')
      return
    }

    try {
      setIsSubmitting(true)
      setAuthError('')

      await signIn({ email, password })

      navigate('/admin/dashboard', { replace: true })

    } catch (error) {
      setAuthError(
        error?.message ||
          'Login failed. Please check your credentials and try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="admin-auth-shell">
      <div className="admin-auth-card">
        <div className="admin-auth-header">
          <p className="admin-eyebrow">6SET JEWELRY</p>
          <h1>Admin Login</h1>
        </div>

        {!isConfigured && (
          <div className="admin-config-warning">
            Supabase environment variables are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to continue.
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-auth-form">
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tabitha@6setjewelry.com"
              autoComplete="email"
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </label>

          {authError && (
            <div className="admin-auth-error">
              {authError}
            </div>
          )}

          <button
            type="submit"
            className="admin-auth-button"
            disabled={isSubmitting || !isConfigured}
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminLogin
