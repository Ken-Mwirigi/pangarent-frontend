import axios from 'axios';

// 1. Use the environment variable from your .env file
// If the variable is missing, it falls back to localhost:8000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/` 
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    // 2. This is your "Security Guard" pinning the ID card to the request
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 3. This handles "Expired IDs". If Django says "Your ID is too old" (401), 
    // it automatically logs you out so you can sign back in for a new ID.
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_name');
      // Only redirect if we aren't already on the login page to avoid loops
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;