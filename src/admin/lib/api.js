const API_BASE = '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  resetPassword: (email) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email }) }),

  // Clinic
  getClinic: () => request('/clinic'),
  updateClinic: (data) => request('/clinic', { method: 'PUT', body: JSON.stringify(data) }),
  requestSetup: (data) => request('/clinic/setup-request', { method: 'POST', body: JSON.stringify(data) }),
  updateBranding: (data) => request('/clinic/branding', { method: 'PUT', body: JSON.stringify(data) }),
  saveTelegram: (data) => request('/clinic/telegram', { method: 'PUT', body: JSON.stringify(data) }),
  uploadLogo: async (file) => {
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('logo', file);
    const res = await fetch(`${API_BASE}/clinic/logo`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  },
  getWidgetCode: () => request('/clinic/widget-code'),

  // Conversations
  getConversations: (page = 1, limit = 20) => request(`/clinic/conversations?page=${page}&limit=${limit}`),
  getConversation: (id) => request(`/clinic/conversations/${id}`),

  // Appointments
  getAppointments: (status) => request(`/clinic/appointments${status ? `?status=${status}` : ''}`),
  updateAppointment: (id, status) => request(`/clinic/appointments/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Analytics & Usage
  getAnalytics: (from, to) => request(`/clinic/analytics${from ? `?from=${from}&to=${to}` : ''}`),
  getUsage: () => request('/clinic/usage'),
  getEvents: (limit = 50) => request(`/clinic/events?limit=${limit}`),

  // Payments
  getBalance: () => request('/payments/balance'),
  createPayment: (plan_id, provider) => request('/payments/create', { method: 'POST', body: JSON.stringify({ plan_id, provider }) }),
  topup: (amount_rub, provider) => request('/payments/topup', { method: 'POST', body: JSON.stringify({ amount_rub, provider }) }),
};
