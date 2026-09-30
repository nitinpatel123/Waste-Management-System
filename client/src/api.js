import axios from 'axios';

const api = axios.create({ baseURL: '/api', timeout: 30000 });

api.interceptors.request.use((c) => {
  const t = localStorage.getItem('token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

// If the token expires, log the user out cleanly instead of showing broken pages.
api.interceptors.response.use(
  (r) => r,
  (err) => {
    const blocked = err.response?.status === 403 && /blocked/i.test(err.response?.data?.message || '');
    if ((err.response?.status === 401 || blocked) && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      if (!window.location.pathname.startsWith('/auth')) window.location.assign('/auth');
    }
    return Promise.reject(err);
  }
);

// One place to turn any error into a friendly message.
export const errMsg = (err, fallback = 'Something went wrong') =>
  err?.response?.data?.message ||
  (err?.code === 'ERR_NETWORK' ? 'Cannot reach the server. Is the backend running?' : fallback);

export default api;
