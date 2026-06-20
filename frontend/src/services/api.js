const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  const token = localStorage.getItem('smartfisio_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('smartfisio_token');
    localStorage.removeItem('smartfisio_user');
    window.location.href = '/';
    return;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Erro desconhecido' }));
    throw new Error(err.detail || 'Erro na requisição');
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  auth: {
    login: (email, password) => {
      return fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }).then(async res => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Credenciais inválidas');
        }
        return res.json();
      });
    },
    register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request('/auth/me'),
  },
  exercises: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/exercises${qs ? '?' + qs : ''}`);
    },
    get: (id) => request(`/exercises/${id}`),
  },
  sessions: {
    create: (data) => request('/sessions', { method: 'POST', body: JSON.stringify(data) }),
    history: (exerciseId) => request(`/sessions/history${exerciseId ? '?exercise_id=' + exerciseId : ''}`),
    createAlert: (data) => request('/sessions/alerts', { method: 'POST', body: JSON.stringify(data) }),
  },
  users: {
    patients: () => request('/users/patients'),
  },
};

export default api;
