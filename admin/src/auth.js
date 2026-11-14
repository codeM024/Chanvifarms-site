import axios from 'axios';

const STORAGE_KEY = 'adminAuth';
const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Returns the stored admin session, or null if missing/expired/from the old client-side login
export const getAdminAuth = () => {
  try {
    const auth = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!auth?.token || !auth.expiresAt || auth.expiresAt <= Date.now()) return null;
    return auth;
  } catch {
    return null;
  }
};

export const setAdminAuth = ({ token, email, expiresAt }) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, email, expiresAt, isAuthenticated: true }));
};

export const clearAdminAuth = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const loginAdmin = async (email, password) => {
  const { data } = await axios.post(`${backendUrl}/api/admin/login`, { email, password });
  if (!data?.success) throw new Error(data?.message || 'Login failed');
  setAdminAuth(data);
  return data;
};

const isBackendRequest = (config) => {
  const target = config.url || '';
  return target.startsWith('/') || (backendUrl && target.startsWith(backendUrl));
};

// Attach the admin token to every backend request and send the user back to
// the login page when the server says the session is invalid or expired.
export const setupAdminAxios = () => {
  axios.interceptors.request.use((config) => {
    const auth = getAdminAuth();
    if (auth && isBackendRequest(config)) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${auth.token}`;
    }
    return config;
  });

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      const isLogin = (error.config?.url || '').includes('/api/admin/login');
      if (status === 401 && !isLogin && error.config && isBackendRequest(error.config)) {
        clearAdminAuth();
        if (!window.location.pathname.startsWith('/login')) {
          window.location.assign('/login?expired=1');
        }
      }
      return Promise.reject(error);
    }
  );
};
