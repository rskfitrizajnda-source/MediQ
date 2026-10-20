import React from 'react';

const statusConfig = {
  PENDING: {
    label: 'Menunggu Check-in',
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  CHECKED_IN: {
    label: 'Menunggu Dipanggil',
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500 animate-pulse',
  },
  CALLING: {
    label: 'Sedang Dipanggil',
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-2 ring-indigo-300',
    dot: 'bg-indigo-600 animate-ping',
  },
  IN_CONSULTATION: {
    label: 'Dalam Pemeriksaan',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  COMPLETED: {
    label: 'Selesai',
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  },
  SKIPPED: {
    label: 'Dilewati',
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
  CANCELLED: {
    label: 'Dibatalkan',
    bg: 'bg-gray-100 text-gray-500 border-gray-200',
    dot: 'bg-gray-400',
  },
};

export default function Badge({ status, className = '' }) {
  const config = statusConfig[status] || {
    label: status,
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

