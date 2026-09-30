import { Link, useLocation } from 'react-router-dom';
import { Menu, Trophy, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import Avatar from './Avatar';

const TITLES = {
  '/': 'Home',
  '/report': 'Report an issue',
  '/pickup': 'Pickup requests',
  '/my-complaints': 'My complaints',
  '/awareness': 'Awareness',
  '/leaderboard': 'Leaderboard',
  '/profile': 'My profile',
  '/admin': 'Overview',
  '/admin/complaints': 'Complaints',
  '/admin/pickups': 'Pickups',
  '/admin/users': 'Users',
};

export default function Topbar({ onMenu, sidebarHidden, onToggleSidebar }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const isAdmin = user.role === 'admin';
  const inAdmin = pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center gap-2 px-4 lg:px-8 bg-page/80 backdrop-blur-xl border-b border-line">
      {/* Phone: opens the drawer */}
      <button onClick={onMenu} aria-label="Open menu" className="lg:hidden p-2 -ml-2 rounded-lg text-muted hover:bg-surface-hover">
        <Menu size={20} />
      </button>
      {/* Desktop: hide / show the sidebar */}
      <button
        onClick={onToggleSidebar}
        title={sidebarHidden ? 'Show sidebar (Ctrl+B)' : 'Hide sidebar (Ctrl+B)'}
        aria-label={sidebarHidden ? 'Show sidebar' : 'Hide sidebar'}
        className="hidden lg:flex p-2 -ml-2 rounded-lg text-muted hover:bg-surface-hover hover:text-ink transition"
      >
        {sidebarHidden ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
      </button>

      <div className="min-w-0">
        {inAdmin && <div className="text-[10px] uppercase tracking-wider text-faint leading-none mb-0.5">Admin</div>}
        <h1 className="font-display font-bold text-lg truncate leading-tight">{TITLES[pathname] || 'CleanCity'}</h1>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {!isAdmin && (
          <Link to="/leaderboard" className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-amber-300 bg-amber-400/10 border border-amber-400/25 rounded-full px-3 py-1.5 mr-1">
            <Trophy size={14} />{user.points} pts
          </Link>
        )}
        <ThemeToggle />
        <NotificationBell />
        {/* Touching the avatar opens the profile */}
        <Link to="/profile" title="My profile" aria-label="Open my profile" className="flex items-center gap-2 ml-1 pl-1 pr-1 md:pr-3 py-1 rounded-full hover:bg-surface-hover transition">
          <Avatar name={user.name} size={32} />
          <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">{user.name}</span>
        </Link>
      </div>
    </header>
  );
}
