import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Sparkles, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import PageWrap from '../components/PageWrap';
import Badge from '../components/Badge';
import { STATUS_STYLE, PRIORITY_STYLE, typeLabel, getLevel, TYPES } from '../utils';

const STEPS = ['Pending', 'In Progress', 'Resolved'];

export default function MyComplaints() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/complaints/mine')
      .then((r) => setList(r.data))
      .catch((e) => toast.error(errMsg(e, 'Could not load complaints')))
      .finally(() => setLoading(false));
  }, []);
  const lvl = getLevel(user?.points || 0);

  return (
    <PageWrap>
      <div className="glass p-5 mb-8 flex flex-wrap items-center gap-5">
        <div className="icon-tile !w-14 !h-14"><Trophy size={26} /></div>
        <div className="flex-1 min-w-[200px]">
          <div className="text-xs text-slate-400">Your eco level</div>
          <div className="font-display text-xl font-bold">{lvl.name} <span className="text-amber-300 text-sm font-semibold">{user?.points || 0} pts</span></div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden mt-2">
            <motion.div className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400" initial={{ width: 0 }} animate={{ width: `${lvl.progress}%` }} transition={{ duration: 0.9 }} />
          </div>
          <div className="text-xs text-slate-500 mt-1">{lvl.next ? `${lvl.next.min - (user?.points || 0)} pts to ${lvl.next.name}` : 'Max level reached'}</div>
        </div>
      </div>

      <h2 className="font-display text-2xl font-bold mb-6">My complaints</h2>
      {loading && <p className="text-slate-500">Loading...</p>}
      {!loading && list.length === 0 && <p className="text-slate-500">No complaints yet.</p>}
      <div className="grid md:grid-cols-2 gap-6">
        {list.map((c, i) => {
          const idx = STEPS.indexOf(c.status);
          const Icon = TYPES.find((t) => t.v === c.type)?.icon;
          return (
            <motion.div key={c._id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} whileHover={{ y: -4 }} className="glass p-5">
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3">
                  <div className="icon-tile !w-10 !h-10 !rounded-lg">{Icon && <Icon size={18} />}</div>
                  <div>
                    <div className="font-semibold">{typeLabel(c.type)}</div>
                    <div className="text-xs text-slate-500">#{c._id.slice(-6).toUpperCase()}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge cls={STATUS_STYLE[c.status]}>{c.status}</Badge>
                  <Badge cls={PRIORITY_STYLE[c.priority]}>{c.priority} priority</Badge>
                </div>
              </div>
              <p className="text-sm text-slate-300 mt-3">{c.description}</p>
              {c.image && <img src={c.image} alt="" className="mt-3 h-36 w-full object-cover rounded-xl border border-white/10" />}
              {c.aiCategory && <div className="text-xs mt-2 text-violet-300 flex items-center gap-1"><Sparkles size={12} /> AI: {c.aiCategory} waste</div>}

              <div className="mt-5">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400" initial={{ width: 0 }} animate={{ width: `${(idx / (STEPS.length - 1)) * 100}%` }} transition={{ duration: 0.8 }} />
                </div>
                <div className="flex justify-between text-[11px] mt-1 text-slate-500">
                  {STEPS.map((s, k) => <span key={s} className={k <= idx ? 'text-emerald-300 font-semibold' : ''}>{s}</span>)}
                </div>
              </div>

              <div className="mt-4 border-l-2 border-emerald-400/30 pl-4 space-y-2">
                {c.timeline.map((t, k) => (
                  <motion.div key={k} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + k * 0.1 }} className="text-xs text-slate-300">
                    <b>{t.status}</b>: {t.note}
                    <div className="text-slate-500 flex items-center gap-1"><Clock size={10} />{new Date(t.at).toLocaleString()}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </PageWrap>
  );
}
