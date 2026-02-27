const API_BASE = '/api';

class ApiService {
  constructor() {
    this.token = sessionStorage.getItem('token') || localStorage.getItem('token');
  }

  setToken(token, persist = false) {
    this.token = token;
    sessionStorage.setItem('token', token);
    if (persist) localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    sessionStorage.removeItem('token');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }

  async request(path, options = {}) {
    const headers = { ...options.headers };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

    if (res.status === 401) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.token}`;
        return fetch(`${API_BASE}${path}`, { ...options, headers });
      }
      this.clearToken();
      window.location.href = '/login';
      return;
    }

    return res;
  }

  async tryRefresh() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      if (!res.ok) return false;
      const data = await res.json();
      this.setToken(data.data.token, true);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      return true;
    } catch { return false; }
  }

  async get(path) {
    const res = await this.request(path);
    return res?.json();
  }

  async post(path, body) {
    const res = await this.request(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
    return res?.json();
  }

  async put(path, body) {
    const res = await this.request(path, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
    return res?.json();
  }

  async del(path) {
    const res = await this.request(path, { method: 'DELETE' });
    return res?.json();
  }

  async upload(path, file, params = {}) {
    const formData = new FormData();
    formData.append('file', file);
    const query = new URLSearchParams(params).toString();
    const res = await this.request(`${path}?${query}`, { method: 'POST', body: formData });
    return res?.json();
  }

  async downloadBlob(path) {
    const res = await this.request(path);
    if (!res || !res.ok) {
      const errorText = await res?.text().catch(() => '');
      throw new Error(errorText || `HTTP ${res?.status}`);
    }
    return res.blob();
  }
}

export const api = new ApiService();
export default api;
