import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGuard } from './components/common/AuthGuard';
import { AdminLayout } from './components/layout/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { POIManagementPage } from './pages/POIManagementPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ToursPage } from './pages/ToursPage';
import { GuestAppPage } from './pages/GuestAppPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/guest" element={<GuestAppPage />} />

          {/* Admin routes (protected) */}
          <Route path="/admin" element={<AuthGuard><AdminLayout /></AuthGuard>}>
            <Route index element={<DashboardPage />} />
            <Route path="pois" element={<POIManagementPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="tours" element={<ToursPage />} />
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
