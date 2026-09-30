import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Camera, Truck, ClipboardList, BookOpen, Trophy, LayoutDashboard, Users, User, LogOut, X,
  PanelLeftClose, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getLevel } from '../utils';
import Logo from './Logo';
import Avatar from './Avatar';

const CITIZEN_GROUPS = [
  { title: 'Menu', links: [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/report', label: 'Report issue', icon: Camera },
    { to: '/pickup', label: 'Pickup requests', icon: Truck },
    { to: '/my-complaints', label: 'My complaints', icon: ClipboardList },
  ] },
  { title: 'Community', links: [
    { to: '/awareness', label: 'Awareness', icon: BookOpen },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ] },
  { title: 'Account', links: [{ to: '/profile', label: 'My profile', icon: User }] },
];

const ADMIN_GROUPS = [
  { title: 'Administration', links: [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/complaints', label: 'Complaints', icon: ClipboardList },
    { to: '/admin/pickups', label: 'Pickups', icon: Truck },
    { to: '/admin/users', label: 'Users', icon: Users },
  ] },
  { title: 'Public pages', links: [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/awareness', label: 'Awareness', icon: BookOpen },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ] },
  { title: 'Account', links: [{ to: '/profile', label: 'My profile', icon: User }] },
];

function SidebarContent({ onNavigate, onHide }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const isAdmin = user.role === 'admin';
  const groups = isAdmin ? ADMIN_GROUPS : CITIZEN_GROUPS;
  const lvl = getLevel(user.points || 0);

  return (
    <div className="flex flex-col h-full">
      <div className="h-16 px-4 flex items-center justify-between border-b border-line">
        <Logo />
        {onHide && (
          <button onClick={onHide} title="Hide sidebar (Ctrl+B)" aria-label="Hide sidebar" className="p-2 rounded-lg text-muted hover:bg-surface-hover hover:text-ink transition">
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {groups.map((g) => (
          <div key={g.title} className="space-y-1">
            <div className="px-3 pb-1 text-[11px] uppercase tracking-wider text-faint">{g.title}</div>
            {g.links.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} onClick={onNavigate} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
                <Icon size={18} />{label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-line">
        {!isAdmin && (
          <div className="glass !shadow-none p-3 mb-3">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-brand-ink">{lvl.name}</span>
              <span className="text-amber-300 font-semibold">{user.points || 0} pts</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
              <motion.div className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400" initial={{ width: 0 }} animate={{ width: `${lvl.progress}%` }} transition={{ duration: 0.8 }} />
            </div>
            <div className="text-[11px] text-faint mt-1.5">
              {lvl.next ? `${lvl.next.min - (user.points || 0)} pts to ${lvl.next.name}` : 'Max level reached'}
            </div>
          </div>
        )}

        {/* Touching the profile card opens the profile page */}
        <div className="flex items-center gap-1">
          <NavLink
            to="/profile"
            onClick={onNavigate}
            aria-label="Open my profile"
            className={({ isActive }) => `group flex flex-1 min-w-0 items-center gap-3 p-2 rounded-xl transition hover:bg-surface-hover ${isActive ? 'bg-surface-hover' : ''}`}
          >
            <Avatar name={user.name} size={38} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{user.name}</div>
              <div className="text-xs text-faint capitalize">{user.role}</div>
            </div>
            <ChevronRight size={16} className="text-faint group-hover:text-ink transition" />
          </NavLink>
          <button onClick={() => { logout(); nav('/'); onNavigate?.(); }} title="Logout" aria-label="Logout" className="p-2.5 rounded-lg text-muted hover:bg-surface-hover hover:text-rose-300 transition">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ open, onClose, hidden, onToggle }) {
  return (
    <>
      {/* Desktop: slides away when hidden. `inert` keeps hidden links out of keyboard focus. */}
      <aside
        inert={hidden}
        aria-hidden={hidden}
        className={`hidden lg:block fixed inset-y-0 left-0 w-64 z-40 bg-surface-solid border-r border-line transition-transform duration-300 ease-out ${hidden ? '-translate-x-full' : 'translate-x-0'}`}
      >
        <SidebarContent onHide={onToggle} />
      </aside>

      {/* Mobile: slide-in drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="lg:hidden fixed inset-0 z-[1500] bg-black/60 backdrop-blur-sm" />
            <motion.aside
              initial={{ x: -288 }} animate={{ x: 0 }} exit={{ x: -288 }} transition={{ type: 'tween', duration: 0.25 }}
              className="lg:hidden fixed inset-y-0 left-0 w-72 z-[1600] bg-surface-solid border-r border-line"
            >
              <button onClick={onClose} aria-label="Close menu" className="absolute right-3 top-4 p-1.5 rounded-lg text-muted hover:bg-surface-hover"><X size={18} /></button>
              <SidebarContent onNavigate={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
