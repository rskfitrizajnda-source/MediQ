import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Activity, Tv, UserCheck, Stethoscope, LogOut, LogIn, Calendar, Search, History } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-500 flex items-center justify-center text-white shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform">
                <Activity className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1">
                  Medi<span className="text-primary-600">Q</span>
                </span>
              </div>
            </Link>

            {/* Socket Live indicator */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                connected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
              title={connected ? 'Terhubung secara realtime' : 'Menghubungkan ke server...'}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              {connected ? 'Live Sync' : 'Connecting...'}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/patient/booking"
              className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              Booking Pasien
            </Link>
            <Link
              to="/patient/track"
              className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              Lacak Tiket
            </Link>
            <Link
              to="/patient/history"
              className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <History className="w-4 h-4" />
              Riwayat Pasien
            </Link>
            <Link
              to="/display"
              target="_blank"
              className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Tv className="w-4 h-4" />
              Smart TV
            </Link>

            {isAuthenticated && (
              <>
                {user?.role === 'DOCTOR' ? (
                  <Link
                    to="/doctor/dashboard"
                    className="px-3.5 py-2 text-sm font-semibold text-primary-600 bg-primary-50 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Stethoscope className="w-4 h-4" />
                    Panel Dokter
                  </Link>
                ) : user?.role === 'PATIENT' ? (
                  <Link
                    to="/patient/booking"
                    className="px-3.5 py-2 text-sm font-semibold text-primary-600 bg-primary-50 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Calendar className="w-4 h-4" />
                    Portal Pasien
                  </Link>
                ) : (
                  <Link
                    to="/admin/dashboard"
                    className="px-3.5 py-2 text-sm font-semibold text-primary-600 bg-primary-50 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <UserCheck className="w-4 h-4" />
                    Panel Admin
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* User Auth Info / Login */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-800 leading-tight">{user?.name}</p>
                  <p className="text-[11px] font-semibold text-primary-600 uppercase tracking-wider">
                    {user?.role}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Keluar"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Masuk Staff
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

