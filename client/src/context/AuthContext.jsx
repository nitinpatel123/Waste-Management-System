import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const Ctx = createContext();
export const useAuth = () => useContext(Ctx);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('token')) { setLoading(false); return; }
    api.get('/auth/me')
      .then((r) => setUser(r.data))
      .catch((e) => { if (e.response?.status === 401) localStorage.removeItem('token'); })
      .finally(() => setLoading(false));
  }, []);

  const authCall = async (url, body) => {
    const { data } = await api.post(url, body);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  };
  const login = (email, password) => authCall('/auth/login', { email, password });
  const register = (form) => authCall('/auth/register', form);
  const logout = () => { localStorage.removeItem('token'); setUser(null); };
  const refresh = () => {
    if (!localStorage.getItem('token')) return;
    api.get('/auth/me').then((r) => setUser(r.data)).catch(() => {});
  };

  return <Ctx.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</Ctx.Provider>;
}
