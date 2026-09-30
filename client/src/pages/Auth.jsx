import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Recycle, ShieldCheck, Sparkles, Trophy, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';
import PageWrap from '../components/PageWrap';

const perks = [
  [Sparkles, 'AI waste classifier'],
  [ShieldCheck, 'Secure, role-based access'],
  [Trophy, 'Eco points and leaderboard'],
];

export default function Auth() {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const from = useLocation().state?.from;
  const [isLogin, setIsLogin] = useState(true);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = isLogin ? await login(form.email, form.password) : await register(form);
      toast.success(`Welcome, ${u.name}`);
      nav(u.role === 'admin' ? '/admin' : from || '/', { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
    } finally { setBusy(false); }
  };

  const demo = (email) => { setIsLogin(true); setForm({ ...form, email, password: 'Demo@1234' }); };

  return (
    <PageWrap>
      <div className="grid md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
        <div className="hidden md:block">
          <div className="icon-tile !w-14 !h-14"><Recycle size={28} /></div>
          <h2 className="font-display text-4xl font-extrabold mt-6">Join the <span className="text-gradient">clean city</span> movement</h2>
          <p className="text-slate-400 mt-3">Report issues, track resolution and earn rewards for keeping your city clean.</p>
          <ul className="mt-6 space-y-3">
            {perks.map(([Icon, t]) => (
              <li key={t} className="flex items-center gap-3 text-slate-300"><span className="icon-tile !w-9 !h-9 !rounded-lg"><Icon size={16} /></span>{t}</li>
            ))}
          </ul>
        </div>

        <motion.form layout onSubmit={submit} className="glass p-8 space-y-4">
          <h2 className="font-display text-2xl font-bold">{isLogin ? 'Welcome back' : 'Create account'}</h2>
          <AnimatePresence initial={false}>
            {!isLogin && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                <input className="field" placeholder="Full name" value={form.name} onChange={set('name')} maxLength={60} required autoComplete="name" />
              </motion.div>
            )}
          </AnimatePresence>
          <input className="field" type="email" placeholder="Email" value={form.email} onChange={set('email')} required autoComplete="email" />
          <div className="relative">
            <input
              className="field !pr-11" type={show ? 'text' : 'password'} value={form.password} onChange={set('password')} required
              minLength={isLogin ? undefined : 7} maxLength={72} autoComplete={isLogin ? 'current-password' : 'new-password'}
              placeholder={isLogin ? 'Password' : 'Password (8+ characters, letters and numbers)'}
            />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-ink">
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button disabled={busy} className="btn btn-primary w-full">
            {isLogin ? <><LogIn size={18} /> Login</> : <><UserPlus size={18} /> Register</>}
          </button>
          <p className="text-center text-sm text-slate-400">
            {isLogin ? 'New here?' : 'Already have an account?'}{' '}
            <button type="button" className="text-emerald-300 font-semibold" onClick={() => setIsLogin(!isLogin)}>{isLogin ? 'Register' : 'Login'}</button>
          </p>
          <div className="pt-3 border-t border-white/10 text-xs text-slate-500 flex flex-wrap gap-2 items-center">
            Demo:
            <button type="button" onClick={() => demo('user@demo.com')} className="text-emerald-300 hover:underline">Citizen</button>
            <button type="button" onClick={() => demo('admin@demo.com')} className="text-emerald-300 hover:underline">Admin</button>
            <span>(after seeding)</span>
          </div>
        </motion.form>
      </div>
    </PageWrap>
  );
}
