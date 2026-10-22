import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import InstallPWABanner from './components/InstallPWABanner';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Booking from './pages/patient/Booking';
import TicketView from './pages/patient/TicketView';
import TrackQueue from './pages/patient/TrackQueue';
import PatientHistory from './pages/patient/PatientHistory';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorSchedule from './pages/doctor/DoctorSchedule';
import AdminDashboard from './pages/admin/AdminDashboard';
import CheckInScanner from './pages/admin/CheckInScanner';
import WalkInRegistration from './pages/admin/WalkInRegistration';
import PatientHistoryLookup from './pages/admin/PatientHistoryLookup';
import TvDisplay from './pages/display/TvDisplay';

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Memeriksa hak akses...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  const location = useLocation();

  // Layar Smart TV Display tampil full-screen tanpa Navbar & Sidebar standar
  const isTvDisplay = location.pathname === '/display';

  if (isTvDisplay) {
    return <TvDisplay />;
  }

  const isStaffDashboard =
    location.pathname.startsWith('/admin') || location.pathname.startsWith('/doctor');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        {isStaffDashboard && <Sidebar />}

        <main className={`flex-1 ${isStaffDashboard ? 'p-4 sm:p-6 lg:p-8 max-w-7xl' : ''}`}>
          <Routes>
            {/* Halaman Beranda Publik */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />

            {/* Portal Pasien (PWA-Ready) */}
            <Route path="/patient/booking" element={<Booking />} />
            <Route path="/patient/ticket/:bookingCode" element={<TicketView />} />
            <Route path="/patient/track" element={<TrackQueue />} />
            <Route path="/patient/history" element={<PatientHistory />} />

            {/* Portal Dokter */}
            <Route
              path="/doctor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/schedule"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                  <DoctorSchedule />
                </ProtectedRoute>
              }
            />

            {/* Portal Admin & Resepsionis */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/scan-checkin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST']}>
                  <CheckInScanner />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/walk-in"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST']}>
                  <WalkInRegistration />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/patients"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST', 'DOCTOR']}>
                  <PatientHistoryLookup />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Banner Pasang Aplikasi di HP (PWA) */}
      <InstallPWABanner />
    </div>
  );
}

