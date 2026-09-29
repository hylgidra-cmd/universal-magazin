import { apiRequest, STORAGE_KEYS, handleLogout } from './api';
import { decodeJwt, getUserIdFromToken } from '../utils/jwt';

export const authService = {
  async login(username, password) {
    const res = await apiRequest('/api/token/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    const { access, refresh } = res;
    localStorage.setItem(STORAGE_KEYS.ACCESS, access);
    localStorage.setItem(STORAGE_KEYS.REFRESH, refresh);

    const userId = getUserIdFromToken(access);
    const profile = await apiRequest('/api/user/me/');
    const userWithId = {
      ...profile,
      id: userId,
      user_id: userId,
    };

    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userWithId));
    window.dispatchEvent(new Event('auth-changed'));
    return userWithId;
  },

  getCurrentUser() {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    if (!stored) return null;
    try {
      const user = JSON.parse(stored);
      if (!user.id && !user.user_id) {
        const access = localStorage.getItem(STORAGE_KEYS.ACCESS);
        const uid = getUserIdFromToken(access);
        user.id = uid;
        user.user_id = uid;
      }
      return user;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS);
    return Boolean(token);
  },

  logout() {
    handleLogout();
  },

  isManager(user) {
    const u = user || this.getCurrentUser();
    return u?.role === 'MANAGER' || u?.role === 'OWNER' || u?.role === 'SUPERUSER' || u?.username === 'admin';
  },

  isCashier(user) {
    const u = user || this.getCurrentUser();
    return u?.role === 'CASHIER' || this.isManager(u) || u?.username === 'admin';
  },
};
