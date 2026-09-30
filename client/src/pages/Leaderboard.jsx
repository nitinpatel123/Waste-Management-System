import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import PageWrap from '../components/PageWrap';
import { getLevel } from '../utils';

const podiumTone = ['text-amber-300 border-amber-400/40', 'text-slate-300 border-slate-300/40', 'text-orange-300 border-orange-400/40'];

export default function Leaderboard() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  useEffect(() => { api.get('/public/leaderboard').then((r) => setList(r.data)); }, []);
  const top3 = list.slice(0, 3);
  const rest = list.slice(3);

  return (
    <PageWrap>
      <div className="text-center mb-10">
        <div className="icon-tile !w-14 !h-14 mx-auto"><Trophy size={26} /></div>
        <h2 className="font-display text-3xl font-bold mt-4">Eco <span className="text-gradient">leaderboard</span></h2>
        <p className="text-slate-400 mt-2">Earn +10 points for reporting a complaint and +20 when it is resolved.</p>
      </div>

      {list.length === 0 && <p className="text-center text-slate-500">No citizens ranked yet.</p>}

      <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {top3.map((u, i) => (
          <motion.div key={u._id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }}
            className={`glass p-5 text-center border ${podiumTone[i]} ${i === 0 ? 'sm:-translate-y-4' : ''}`}>
            {i === 0 ? <Crown className="mx-auto" size={26} /> : <Medal className="mx-auto" size={24} />}
            <div className="font-display font-bold text-lg mt-2 text-white">{u.name}</div>
            <div className="text-2xl font-extrabold mt-1">{u.points}</div>
            <div className="text-xs text-slate-400">{getLevel(u.points).name}</div>
          </motion.div>
        ))}
      </div>

      <div className="max-w-3xl mx-auto mt-6 space-y-2">
        {rest.map((u, i) => (
          <motion.div key={u._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.05 }}
            className={`glass px-5 py-3 flex items-center gap-4 ${user?.id === u._id ? '!border-emerald-400/50' : ''}`}>
            <span className="w-6 text-slate-500 font-semibold">{i + 4}</span>
            <span className="flex-1 font-medium">{u.name}</span>
            <span className="text-xs text-slate-400">{getLevel(u.points).name}</span>
            <span className="font-bold text-amber-300">{u.points}</span>
          </motion.div>
        ))}
      </div>
    </PageWrap>
  );
}
