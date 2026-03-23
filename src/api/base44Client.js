// Frontend adapter that replaces @base44/sdk
// All calls are proxied to our API server (VPS)

const API_URL = import.meta.env.VITE_API_URL || '';

function getAuthHeaders() {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function handleResponse(response, context) {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    const error = new Error(errorData.message || `${context} failed: ${response.statusText}`);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }
  return await response.json();
}

function createEntityProxy(entityName) {
  const base = `${API_URL}/api/entities/${entityName}`;

  return {
    async list(sortBy, limit) {
      const params = new URLSearchParams();
      if (sortBy) params.set('sort', sortBy);
      if (limit) params.set('limit', String(limit));
      const qs = params.toString();
      const response = await fetch(`${base}${qs ? '?' + qs : ''}`, {
        headers: { ...getAuthHeaders() }
      });
      return handleResponse(response, `${entityName}.list`);
    },

    async filter(filterObj, sortBy, limit) {
      const params = new URLSearchParams();
      if (filterObj) params.set('filter', JSON.stringify(filterObj));
      if (sortBy) params.set('sort', sortBy);
      if (limit) params.set('limit', String(limit));
      const qs = params.toString();
      const response = await fetch(`${base}${qs ? '?' + qs : ''}`, {
        headers: { ...getAuthHeaders() }
      });
      return handleResponse(response, `${entityName}.filter`);
    },

    async get(id) {
      const params = new URLSearchParams();
      params.set('id', String(id));
      const response = await fetch(`${base}?${params.toString()}`, {
        headers: { ...getAuthHeaders() }
      });
      return handleResponse(response, `${entityName}.get`);
    },

    async create(data) {
      const response = await fetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data)
      });
      return handleResponse(response, `${entityName}.create`);
    },

    async update(id, data) {
      const response = await fetch(base, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ id, ...data })
      });
      return handleResponse(response, `${entityName}.update`);
    },

    async delete(id) {
      const response = await fetch(base, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ id })
      });
      return handleResponse(response, `${entityName}.delete`);
    },

    async schema() {
      const response = await fetch(`${base}?schema=true`, {
        headers: { ...getAuthHeaders() }
      });
      return handleResponse(response, `${entityName}.schema`);
    }
  };
}

export const base44 = {
  entities: new Proxy({}, {
    get(_target, entityName) {
      if (typeof entityName !== 'string') return undefined;
      return createEntityProxy(entityName);
    }
  }),

  functions: {
    async invoke(functionName, payload) {
      const response = await fetch(`${API_URL}/api/functions/${functionName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }
        const error = new Error(errorData.message || `Function ${functionName} failed: ${response.statusText}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }
      const data = await response.json();
      return { data };
    }
  },

  auth: {
    async me() {
      const token = localStorage.getItem('auth_token');
      if (!token) return null;
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { ...getAuthHeaders() }
      });
      if (!response.ok) {
        localStorage.removeItem('auth_token');
        return null;
      }
      return await response.json();
    },

    logout(redirectUrl) {
      localStorage.removeItem('auth_token');
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    },

    redirectToLogin(returnUrl) {
      window.location.href = `/login?returnUrl=${encodeURIComponent(returnUrl || window.location.href)}`;
    },

    async login(email, password) {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(error.message || 'Login failed');
      }
      const data = await response.json();
      localStorage.setItem('auth_token', data.token);
      return data.user;
    },

    async register(email, password, fullName) {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName })
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Registration failed' }));
        throw new Error(error.message || 'Registration failed');
      }
      const data = await response.json();
      localStorage.setItem('auth_token', data.token);
      return data.user;
    }
  }
};
