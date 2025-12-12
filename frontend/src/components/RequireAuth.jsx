import React, { useContext } from 'react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export default function RequireAuth({ children }) {
  const { authenticated, loading } = useContext(AuthContext)
  const location = useLocation()

  if (loading) return <div>Checking authentication…</div> // or spinner component

  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If you passed children, render them; otherwise allow nested routes via <Outlet/>
  return children ?? <Outlet />
}
