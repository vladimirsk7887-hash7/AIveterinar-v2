const API_BASE = '/api';

async function request(path, token, options = {}) {
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

export const saApi = {
  getClinics: (token) => request('/admin/clinics', token),
  getClinic: (token, id) => request(`/admin/clinics/${id}`, token),
  createClinic: (token, data) => request('/admin/clinics', token, { method: 'POST', body: JSON.stringify(data) }),
  updateClinic: (token, id, data) => request(`/admin/clinics/${id}`, token, { method: 'PUT', body: JSON.stringify(data) }),
  getStats: (token) => request('/admin/stats', token),
  getEvents: (token, limit = 100) => request(`/admin/events?limit=${limit}`, token),
  getPayments: (token) => request('/admin/payments', token),
  getAiProviders: (token) => request('/admin/ai-providers', token),
  testAiProvider: (token, provider_id, model_id) => request('/admin/ai-providers/test', token, {
    method: 'POST',
    body: JSON.stringify({ provider_id, model_id }),
  }),
};
