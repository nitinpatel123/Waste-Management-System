import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

const links = [
  ['/', 'Home', true],
  ['/awareness', 'Awareness'],
  ['/leaderboard', 'Leaderboard'],
];

export default function PublicNav() {
  const cls = ({ isActive }) =>
    `px-3 py-1.5 rounded-lg text-sm transition ${isActive ? 'bg-surface-hover text-brand-ink' : 'text-muted hover:text-ink'}`;

  return (
    <motion.header initial={{ y: -60 }} animate={{ y: 0 }} className="sticky top-0 z-40 bg-page/80 backdrop-blur-xl border-b border-line">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">
        <Logo />
        <nav className="hidden sm:flex items-center gap-1 ml-6">
          {links.map(([to, label, end]) => <NavLink key={to} to={to} end={end} className={cls}>{label}</NavLink>)}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Link to="/auth" className="btn btn-primary !py-1.5 !px-4 text-sm">Login</Link>
        </div>
      </div>
    </motion.header>
  );
}
