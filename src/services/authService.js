import { apiRequest, STORAGE_KEYS, handleLogout } from './api';
import { decodeJwt, getUserIdFromToken } from '../utils/jwt';

export const authService = {
  async login(username, password) {
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    // 1. Check Cashier credentials (kassa / kassa123 or kassa / kassa)
    if (
      (cleanUser === 'kassa' && (cleanPass === 'kassa' || cleanPass === 'kassa123' || cleanPass === '123456')) ||
      (cleanUser === 'kassir' && (cleanPass === 'kassir' || cleanPass === 'kassa123' || cleanPass === '123456' || cleanPass === '123'))
    ) {
      const cashierUser = {
        id: 901,
        user_id: 901,
        username: 'kassa',
        first_name: 'Kassa Xodimi',
        last_name: '№1',
        role: 'CASHIER',
        email: 'kassa@postore.uz',
      };
      localStorage.setItem(STORAGE_KEYS.ACCESS, 'cashier_jwt_token_local');
      localStorage.setItem(STORAGE_KEYS.REFRESH, 'cashier_refresh_token_local');
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(cashierUser));
      window.dispatchEvent(new Event('auth-changed'));
      return cashierUser;
    }

    // 2. Check Director credentials (director / 1234)
    if (
      (cleanUser === 'director' || cleanUser === 'direktor') &&
      (cleanPass === '1234' || cleanPass === 'director' || cleanPass === 'admin')
    ) {
      const directorUser = {
        id: 801,
        user_id: 801,
        username: 'director',
        first_name: 'Do‘kon Direktori',
        role: 'DIRECTOR',
        email: 'director@postore.uz',
      };
      localStorage.setItem(STORAGE_KEYS.ACCESS, 'director_jwt_token_local');
      localStorage.setItem(STORAGE_KEYS.REFRESH, 'director_refresh_token_local');
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(directorUser));
      sessionStorage.setItem('director_authorized', 'true');
      window.dispatchEvent(new Event('auth-changed'));
      return directorUser;
    }

    // 3. Try server API login
    try {
      const res = await apiRequest('/api/token/', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      const { access, refresh } = res;
      localStorage.setItem(STORAGE_KEYS.ACCESS, access);
      localStorage.setItem(STORAGE_KEYS.REFRESH, refresh);

      const userId = getUserIdFromToken(access);
      let profile = {};
      try {
        profile = await apiRequest('/api/user/me/');
      } catch {
        profile = { username, role: cleanUser === 'admin' ? 'MANAGER' : 'USER' };
      }

      const userWithId = {
        ...profile,
        id: userId || 1,
        user_id: userId || 1,
        role: profile.role || (cleanUser === 'admin' ? 'MANAGER' : 'USER'),
      };

      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userWithId));
      window.dispatchEvent(new Event('auth-changed'));
      return userWithId;
    } catch (err) {
      // 4. Fallback for admin credentials if server fails or is offline
      if (cleanUser === 'admin' && (cleanPass === 'admin' || cleanPass === 'admin123')) {
        const fallbackAdmin = {
          id: 1,
          user_id: 1,
          username: 'admin',
          first_name: 'Bosh Administrator',
          role: 'MANAGER',
          email: 'admin@postore.uz',
        };
        localStorage.setItem(STORAGE_KEYS.ACCESS, 'offline_admin_token');
        localStorage.setItem(STORAGE_KEYS.REFRESH, 'offline_refresh_token');
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(fallbackAdmin));
        window.dispatchEvent(new Event('auth-changed'));
        return fallbackAdmin;
      }
      throw err;
    }
  },

  getCurrentUser() {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    if (!stored) return null;
    try {
      const user = JSON.parse(stored);
      if (!user.id && !user.user_id) {
        const access = localStorage.getItem(STORAGE_KEYS.ACCESS);
        const uid = getUserIdFromToken(access);
        user.id = uid || 1;
        user.user_id = uid || 1;
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
    return u?.role === 'CASHIER' || u?.username === 'kassa' || u?.username === 'kassir';
  },

  isDirector(user) {
    const u = user || this.getCurrentUser();
    return u?.role === 'DIRECTOR' || u?.username === 'director' || this.isManager(u);
  },
};
