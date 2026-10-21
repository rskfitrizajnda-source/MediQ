const configuredApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
const API_BASE = `${configuredApiUrl}/api`;

/**
 * Helper request fetch wrapper dengan otomatis header Authorization Bearer token.
 * API_BASE tetap /api saat development lokal menggunakan proxy Vite.
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('mediq_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Permintaan gagal dengan status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Autentikasi
  auth: {
    login: (credentials) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    me: () => request('/auth/me'),
  },

  // Antrean
  queues: {
    getToday: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/queues${query ? `?${query}` : ''}`);
    },
    checkIn: (bookingCode) =>
      request('/queues/check-in', {
        method: 'POST',
        body: JSON.stringify({ bookingCode }),
      }),
    walkIn: (payload) =>
      request('/queues/walk-in', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    call: (queueId) => request(`/queues/${queueId}/call`, { method: 'POST' }),
    recall: (queueId) => request(`/queues/${queueId}/recall`, { method: 'POST' }),
    start: (queueId) => request(`/queues/${queueId}/start`, { method: 'POST' }),
    finish: (queueId, diagnosisNotes) =>
      request(`/queues/${queueId}/finish`, {
        method: 'POST',
        body: JSON.stringify({ diagnosisNotes }),
      }),
    skip: (queueId) => request(`/queues/${queueId}/skip`, { method: 'POST' }),
    getTvDisplay: () => request('/queues/display'),
    track: (code) => request(`/queues/track/${code}`),
  },

  // Pasien
  patients: {
    book: (data) =>
      request('/patients/book', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getTicket: (bookingCode) => request(`/patients/ticket/${bookingCode}`),
    getHistory: (nik) => request(`/patients/history/${nik}`),
    getHistoryById: (id) => request(`/patients/details/${id}`),
    search: (query) => request(`/patients/search?q=${encodeURIComponent(query)}`),
  },

  // Dokter
  doctors: {
    getQueues: () => request('/doctors/queues'),
    getSchedule: () => request('/doctors/schedule'),
    updateSchedule: (data) =>
      request('/doctors/schedule', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // Klinik
  clinic: {
    getPolyclinics: () => request('/clinic/polyclinics'),
    getDoctors: () => request('/clinic/doctors'),
    getSettings: () => request('/clinic/settings'),
    updateSettings: (data) =>
      request('/clinic/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getOverview: () => request('/clinic/overview'),
  },
};
