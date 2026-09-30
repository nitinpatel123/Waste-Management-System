import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail, Phone, MapPin, Calendar, Clock, Save, KeyRound, Eye, EyeOff, ShieldCheck, Leaf, Trophy,
  ClipboardList, CheckCircle2, Loader, Truck, User as UserIcon, LayoutDashboard, Users, Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import PageWrap from '../components/PageWrap';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import CountUp from '../components/CountUp';
import { getLevel, fmtDate, fmtDateTime, typeLabel, STATUS_STYLE, TYPES, TONES } from '../utils';

// 0-4 score for the strength bar
const strength = (p) => {
  let s = 0;
  if (p.length >= 8) s += 1;
  if (p.length >= 12) s += 1;
  if (/[A-Za-z]/.test(p) && /[0-9]/.test(p)) s += 1;
  if (/[^A-Za-z0-9]/.test(p) && /[A-Z]/.test(p)) s += 1;
  return s;
};
const STRENGTH = [['Too weak', 'bg-rose-400'], ['Weak', 'bg-rose-400'], ['Okay', 'bg-amber-400'], ['Good', 'bg-emerald-400'], ['Strong', 'bg-emerald-400']];

function Field({ icon: Icon, label, children }) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted mb-1.5"><Icon size={13} />{label}</span>
      {children}
    </label>
  );
}

export default function Profile() {
  const { user, refresh } = useAuth();
  const isAdmin = user.role === 'admin';
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('details');
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '', address: user.address || '' });
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    api.get('/auth/profile')
      .then((r) => {
        setData(r.data);
        setForm({ name: r.data.user.name, phone: r.data.user.phone || '', address: r.data.user.address || '' });
      })
      .catch((e) => toast.error(errMsg(e, 'Could not load profile')));
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/auth/profile', form);
      toast.success('Profile updated');
      refresh();
    } catch (err) { toast.error(errMsg(err)); }
    finally { setSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) return toast.error('New passwords do not match');
    setPwBusy(true);
    try {
      const { data: res } = await api.put('/auth/password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      localStorage.setItem('token', res.token); // other devices are logged out, this one stays in
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password changed. Other devices were logged out.');
    } catch (err) { toast.error(errMsg(err)); }
    finally { setPwBusy(false); }
  };

  const u = data?.user || user;
  const stats = data?.stats;
  const lvl = getLevel(u.points || 0);
  const score = strength(pw.newPassword);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const tiles = [
    [ClipboardList, 'Complaints', stats?.complaints, 'sky'],
    [CheckCircle2, 'Resolved', stats?.resolved, 'emerald'],
    [Loader, 'Open', stats?.pending, 'amber'],
    [Truck, 'Pickups', stats?.pickups, 'violet'],
  ];

  return (
    <PageWrap>
      {/* Header card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-emerald-500/30 via-cyan-500/20 to-violet-500/20" />
        <div className="px-6 pb-6 -mt-10 flex flex-wrap items-end gap-5">
          <div className="ring-4 ring-[var(--surface-solid)] rounded-full"><Avatar name={u.name} size={84} /></div>
          <div className="flex-1 min-w-[220px] pt-10 sm:pt-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-2xl font-bold">{u.name}</h2>
              <Badge cls={isAdmin ? TONES.violet : TONES.emerald}>
                {isAdmin ? <ShieldCheck size={12} /> : <Leaf size={12} />}{isAdmin ? 'Administrator' : lvl.name}
              </Badge>
            </div>
            <div className="text-sm text-muted mt-1 flex flex-wrap gap-x-5 gap-y-1">
              <span className="flex items-center gap-1.5"><Mail size={14} />{u.email}</span>
              <span className="flex items-center gap-1.5"><Calendar size={14} />Joined {fmtDate(u.createdAt)}</span>
              {u.lastLoginAt && <span className="flex items-center gap-1.5"><Clock size={14} />Last login {fmtDateTime(u.lastLoginAt)}</span>}
            </div>
          </div>
          {!isAdmin && (
            <div className="flex gap-3">
              <div className="text-center px-4 py-2 rounded-xl bg-amber-400/10 border border-amber-400/25">
                <div className="font-display text-xl font-bold text-amber-300"><CountUp to={u.points || 0} /></div>
                <div className="text-[11px] text-muted">Eco points</div>
              </div>
              {stats?.rank && (
                <Link to="/leaderboard" className="text-center px-4 py-2 rounded-xl bg-surface border border-line hover:border-emerald-400/40 transition">
                  <div className="font-display text-xl font-bold flex items-center justify-center gap-1"><Trophy size={16} className="text-amber-300" />#{stats.rank}</div>
                  <div className="text-[11px] text-muted">Rank</div>
                </Link>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Activity numbers (citizens) or admin shortcuts */}
      {isAdmin ? (
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <Link to="/admin" className="glass glass-hover p-5 flex items-center gap-4">
            <span className={`tone-tile ${TONES.emerald}`}><LayoutDashboard size={20} /></span>
            <div><div className="font-semibold">Admin overview</div><div className="text-xs text-muted">Live statistics, hotspots and AI insights</div></div>
          </Link>
          <Link to="/admin/users" className="glass glass-hover p-5 flex items-center gap-4">
            <span className={`tone-tile ${TONES.sky}`}><Users size={20} /></span>
            <div><div className="font-semibold">Manage users</div><div className="text-xs text-muted">See citizens and block misuse</div></div>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {tiles.map(([Icon, label, val, tone], i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass p-4 flex items-center gap-3">
                <span className={`tone-tile ${TONES[tone]}`}><Icon size={18} /></span>
                <div>
                  <div className="font-display text-2xl font-bold leading-none">{stats ? <CountUp to={val} /> : <span className="skeleton inline-block w-8 h-6" />}</div>
                  <div className="text-xs text-muted mt-1">{label}</div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="glass p-5 mt-4">
            <div className="flex justify-between text-sm">
              <span className="font-semibold">{lvl.name}</span>
              <span className="text-muted">{lvl.next ? `${lvl.next.min - (u.points || 0)} pts to ${lvl.next.name}` : 'Max level reached'}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mt-2">
              <motion.div className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400" initial={{ width: 0 }} animate={{ width: `${lvl.progress}%` }} transition={{ duration: 0.9 }} />
            </div>
          </div>
        </>
      )}

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 glass p-6">
          <div className="flex gap-2 mb-6">
            {[['details', 'Personal details', UserIcon], ['security', 'Security', Lock]].map(([k, label, Icon]) => (
              <button key={k} onClick={() => setTab(k)} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition border ${tab === k ? 'bg-emerald-400/15 text-emerald-300 border-emerald-400/40' : 'bg-surface text-muted border-line hover:text-ink'}`}>
                <Icon size={14} />{label}
              </button>
            ))}
          </div>

          {tab === 'details' && (
            <form onSubmit={saveProfile} className="space-y-4">
              <Field icon={UserIcon} label="Full name"><input className="field" value={form.name} onChange={set('name')} maxLength={60} required autoComplete="name" /></Field>
              <Field icon={Mail} label="Email (cannot be changed)"><input className="field opacity-70" value={u.email} disabled /></Field>
              <Field icon={Phone} label="Phone (optional)"><input className="field" value={form.phone} onChange={set('phone')} maxLength={15} inputMode="tel" placeholder="+91 98765 43210" autoComplete="tel" /></Field>
              <Field icon={MapPin} label="Address (optional)"><textarea className="field" rows={2} value={form.address} onChange={set('address')} maxLength={200} placeholder="House no., area, city" /></Field>
              <button disabled={saving} className="btn btn-primary">{saving ? 'Saving...' : <><Save size={16} /> Save changes</>}</button>
            </form>
          )}

          {tab === 'security' && (
            <form onSubmit={changePassword} className="space-y-4 max-w-md">
              <Field icon={KeyRound} label="Current password">
                <input className="field" type={showPw ? 'text' : 'password'} value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required autoComplete="current-password" />
              </Field>
              <Field icon={Lock} label="New password (8+ characters, letters and numbers)">
                <div className="relative">
                  <input className="field !pr-11" type={showPw ? 'text' : 'password'} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required minLength={8} maxLength={72} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Hide passwords' : 'Show passwords'} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-ink">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
              {pw.newPassword && (
                <div>
                  <div className="flex gap-1">{[0, 1, 2, 3].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i < score ? STRENGTH[score][1] : 'bg-white/10'}`} />)}</div>
                  <div className="text-xs text-muted mt-1">{STRENGTH[score][0]}</div>
                </div>
              )}
              <Field icon={Lock} label="Confirm new password">
                <input className="field" type={showPw ? 'text' : 'password'} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required autoComplete="new-password" />
              </Field>
              <button disabled={pwBusy} className="btn btn-primary">{pwBusy ? 'Updating...' : <><KeyRound size={16} /> Change password</>}</button>
              <p className="text-xs text-faint">After a change, every other device where you are logged in is signed out.</p>
            </form>
          )}
        </div>

        <div className="glass p-6">
          <h3 className="font-display font-bold mb-4">{isAdmin ? 'Account' : 'Recent complaints'}</h3>
          {isAdmin ? (
            <ul className="space-y-3 text-sm text-muted">
              <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-300" />Full access to the admin panel</li>
              <li className="flex items-center gap-2"><Lock size={16} className="text-emerald-300" />Use a strong, unique password</li>
            </ul>
          ) : !data ? (
            <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-12" />)}</div>
          ) : data.recent.length === 0 ? (
            <p className="text-sm text-faint">No complaints yet. <Link to="/report" className="text-emerald-300 hover:underline">Report one</Link></p>
          ) : (
            <ul className="space-y-3">
              {data.recent.map((c) => {
                const t = TYPES.find((x) => x.v === c.type);
                const Icon = t?.icon;
                return (
                  <li key={c._id} className="flex items-center gap-3">
                    <span className={`tone-tile !w-9 !h-9 ${TONES[t?.tone || 'slate']}`}>{Icon && <Icon size={16} />}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{typeLabel(c.type)}</div>
                      <div className="text-xs text-faint">{fmtDate(c.createdAt)}</div>
                    </div>
                    <Badge cls={STATUS_STYLE[c.status]}>{c.status}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </PageWrap>
  );
}
