import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function NotificationBell() {
  const { user, refresh } = useAuth();
  const [notes, setNotes] = useState([]);
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  const load = () => {
    api.get('/notifications').then((r) => setNotes(r.data)).catch(() => {});
    refresh();
  };

  // Poll every 15 seconds so new notifications appear without a page reload.
  useEffect(() => {
    if (!user) return;
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [user?.id]);

  // Close the panel when clicking anywhere outside it.
  useEffect(() => {
    const away = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, []);

  const unread = notes.filter((n) => !n.read).length;

  const toggle = async () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && unread) {
      await api.put('/notifications/read').catch(() => {});
      setTimeout(() => setNotes((n) => n.map((x) => ({ ...x, read: true }))), 2500);
    }
  };

  return (
    <div ref={box} className="relative">
      <button onClick={toggle} aria-label="Notifications" className="relative p-2 rounded-lg text-muted hover:bg-surface-hover hover:text-ink transition">
        <Bell size={18} />
        {unread > 0 && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-0.5 -right-0.5 bg-rose-500 text-[#fff] text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
            {unread}
          </motion.span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }}
            className="glass glass-solid absolute right-0 top-12 w-80 max-w-[90vw] p-2 max-h-96 overflow-auto z-50"
          >
            <div className="px-2 py-1.5 text-xs uppercase tracking-wider text-faint">Notifications</div>
            {notes.length === 0 && <p className="p-3 text-sm text-faint">No notifications yet</p>}
            {notes.map((n) => (
              <div key={n._id} className={`p-2.5 rounded-lg text-xs mb-1 ${n.read ? 'text-muted' : 'bg-emerald-400/10 text-ink'}`}>
                {n.message}
                <div className="text-faint mt-1">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
