import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="border-t border-line mt-16">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Logo />
          <p className="text-xs text-faint mt-2 max-w-xs">Smart waste management and citizen reporting platform.</p>
        </div>
        <div className="flex gap-5 text-sm text-muted">
          <Link to="/awareness" className="hover:text-ink">Awareness</Link>
          <Link to="/leaderboard" className="hover:text-ink">Leaderboard</Link>
          <Link to="/auth" className="hover:text-ink">Login</Link>
        </div>
      </div>
    </footer>
  );
}
