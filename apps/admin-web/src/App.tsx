import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { UsersPage } from '@/pages/UsersPage'
import { POIPage } from '@/pages/POIPage'
import { POIDetailPage } from '@/pages/POIDetailPage'
import { POIMapPage } from '@/pages/POIMapPage'
import { JobsPage } from '@/pages/JobsPage'
import { AuditLogsPage } from '@/pages/AuditLogsPage'
import SettingsPage from '@/pages/SettingsPage'
import LoginPage from '@/pages/LoginPage'
import { isAdminAuthenticated } from '@/lib/auth'

function ProtectedRoute() {
  const location = useLocation()

  if (!isAdminAuthenticated()) {
    const from = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to="/login" state={{ from }} replace />
  }

  return <Outlet />
}

function GuestOnlyRoute() {
  const location = useLocation()

  if (isAdminAuthenticated()) {
    const from = (location.state as { from?: string } | null)?.from
    const redirectTo = from && from !== '/login' ? from : '/dashboard'
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<GuestOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="poi" element={<POIPage />} />
            <Route path="poi-map" element={<POIMapPage />} />
            <Route path="poi/:id" element={<POIDetailPage />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route
          path="*"
          element={<Navigate to={isAdminAuthenticated() ? '/dashboard' : '/login'} replace />}
        />
      </Routes>
      <Toaster position="top-right" richColors />
    </>
  )
}
