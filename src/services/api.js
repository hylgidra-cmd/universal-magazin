import { decodeJwt } from '../utils/jwt';

// Empty string allows Vite dev proxy to route /api -> https://postore-phi.vercel.app with NO CORS
export const BASE_URL = '';

export const STORAGE_KEYS = {
  ACCESS: 'postore_access_token',
  REFRESH: 'postore_refresh_token',
  USER: 'postore_user_profile',
  DEVICE_ID: 'postore_device_id',
};

export function getDeviceId() {
  let id = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!id) {
    id = 'kassa-' + Math.random().toString(36).substring(2, 8);
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
  }
  return id;
}

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

export function ensureTrailingSlash(path) {
  if (path.includes('?')) {
    const [pathname, search] = path.split('?');
    const cleanPath = pathname.endsWith('/') ? pathname : `${pathname}/`;
    return `${cleanPath}?${search}`;
  }
  return path.endsWith('/') ? path : `${path}/`;
}

export async function apiRequest(endpoint, options = {}) {
  let path = endpoint.startsWith('http')
    ? endpoint.replace('https://postore-phi.vercel.app', '')
    : endpoint;
  path = ensureTrailingSlash(path);
  const fullUrl = `${BASE_URL}${path}`;

  const access = localStorage.getItem(STORAGE_KEYS.ACCESS);

  const headers = {
    'Content-Type': 'application/json',
    ...(access ? { Authorization: `Bearer ${access}` } : {}),
    ...options.headers,
  };

  if (options.method === 'GET' && !options.body) {
    delete headers['Content-Type'];
  }

  try {
    const res = await fetch(fullUrl, { ...options, headers });

    if (res.status === 204) return { success: true };

    if (res.status === 401 && !path.includes('/api/token/') && !path.includes('/api/refresh/')) {
      const refresh = localStorage.getItem(STORAGE_KEYS.REFRESH);
      if (!refresh) {
        handleLogout();
        throw new Error("Sessiya muddati tugadi. Qayta kiring.");
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newAccess) => {
          return apiRequest(endpoint, {
            ...options,
            headers: { ...options.headers, Authorization: `Bearer ${newAccess}` },
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshRes = await fetch(`${BASE_URL}/api/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh }),
        });

        if (!refreshRes.ok) throw new Error('Refresh failed');

        const data = await refreshRes.json();
        const newAccess = data.access;
        localStorage.setItem(STORAGE_KEYS.ACCESS, newAccess);

        processQueue(null, newAccess);
        isRefreshing = false;

        return apiRequest(endpoint, {
          ...options,
          headers: { ...options.headers, Authorization: `Bearer ${newAccess}` },
        });
      } catch (err) {
        processQueue(err, null);
        isRefreshing = false;
        handleLogout();
        throw new Error("Sessiya yangilanmadi. Qayta login qiling.");
      }
    }

    let data = null;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      let errorMessage = 'Xatolik yuz berdi';
      if (data && typeof data === 'object') {
        if (data.detail) {
          errorMessage = data.detail;
        } else {
          const errors = Object.entries(data)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join('; ');
          errorMessage = errors || `HTTP ${res.status} Xatolik`;
        }
      }
      const errorObj = new Error(errorMessage);
      errorObj.status = res.status;
      errorObj.data = data;
      throw errorObj;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export function handleLogout() {
  localStorage.removeItem(STORAGE_KEYS.ACCESS);
  localStorage.removeItem(STORAGE_KEYS.REFRESH);
  localStorage.removeItem(STORAGE_KEYS.USER);
  window.dispatchEvent(new Event('auth-changed'));
}
