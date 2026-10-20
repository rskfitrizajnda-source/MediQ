import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  QrCode,
  UserPlus,
  Stethoscope,
  Clock,
  FolderHeart,
  Tv, // <--- Sudah ditambahkan di sini
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  const isDoctor = user?.role === 'DOCTOR';

  const doctorLinks = [
    {
      to: '/doctor/dashboard',
      label: 'Ruang Pemeriksaan',
      icon: Stethoscope,
    },
    {
      to: '/doctor/schedule',
      label: 'Jadwal & Kuota',
      icon: Clock,
    },
  ];

  const staffLinks = [
    {
      to: '/admin/dashboard',
      label: 'Dasbor Monitoring',
      icon: LayoutDashboard,
    },
    {
      to: '/admin/scan-checkin',
      label: 'Scan QR Check-in',
      icon: QrCode,
    },
    {
      to: '/admin/walk-in',
      label: 'Pasien Walk-in',
      icon: UserPlus,
    },
    {
      to: '/admin/patients',
      label: 'Riwayat & Data Pasien',
      icon: FolderHeart,
    },
  ];

  const links = isDoctor ? doctorLinks : staffLinks;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Menu {isDoctor ? 'Dokter' : 'Resepsionis'}
          </p>
          <nav className="space-y-1">
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Layar Publik
          </p>
          <a
            href="/display"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Tv className="w-5 h-5 flex-shrink-0 text-amber-500" />
            Layar Smart TV (Live)
          </a>
        </div>
      </div>

      {/* Info Klinik Bawah */}
      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500">
        <p className="font-bold text-slate-700">Klinik Pratama MediQ</p>
        <p className="text-[11px] mt-0.5">Sistem Antrean Cerdas v1.0</p>
      </div>
    </aside>
  );
}