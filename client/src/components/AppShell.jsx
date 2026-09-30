import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import PublicNav from './PublicNav';
import Footer from './Footer';

const KEY = 'sidebar-hidden';

// Guests see a top navigation bar. Logged-in users get the sidebar dashboard layout.
export default function AppShell({ children }) {
  const { user, loading } = useAuth();
  const [drawer, setDrawer] = useState(false);
  // Desktop sidebar can be hidden. The choice is remembered.
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
  });
  const { pathname } = useLocation();

  const toggleSidebar = useCallback(() => {
    setHidden((h) => {
      const next = !h;
      try { localStorage.setItem(KEY, next ? '1' : '0'); } catch { /* ignore */ }
      return next;
    });
  }, []);

  useEffect(() => { setDrawer(false); window.scrollTo(0, 0); }, [pathname]);

  // Ctrl+B (Cmd+B on Mac) toggles the sidebar, like in VS Code.
  useEffect(() => {
    if (!user) return undefined;
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') { e.preventDefault(); toggleSidebar(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [user, toggleSidebar]);

  // While we check the saved token, show nothing (prevents the guest layout flashing).
  if (loading) return <div className="min-h-screen" />;

  if (!user) {
    return (
      <>
        <PublicNav />
        <main>{children}</main>
        <Footer />
      </>
    );
  }

  return (
    <div className={`min-h-screen transition-[padding] duration-300 ease-out ${hidden ? 'lg:pl-0' : 'lg:pl-64'}`}>
      <Sidebar open={drawer} onClose={() => setDrawer(false)} hidden={hidden} onToggle={toggleSidebar} />
      <Topbar onMenu={() => setDrawer(true)} sidebarHidden={hidden} onToggleSidebar={toggleSidebar} />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
