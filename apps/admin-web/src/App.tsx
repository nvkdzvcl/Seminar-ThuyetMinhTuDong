import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { UsersPage } from '@/pages/UsersPage'
import { POIPage } from '@/pages/POIPage'
import { POIDetailPage } from '@/pages/POIDetailPage'
import { JobsPage } from '@/pages/JobsPage'
import { AuditLogsPage } from '@/pages/AuditLogsPage'
import SettingsPage from '@/pages/SettingsPage'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="poi" element={<POIPage />} />
          <Route path="poi/:id" element={<POIDetailPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
      <Toaster position="top-right" richColors />
    </>
  )
}
