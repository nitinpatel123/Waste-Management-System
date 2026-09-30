import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Truck, User, MapPin, CalendarClock, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../../api';
import PageWrap from '../../components/PageWrap';
import { PageHeader, KpiCard, StatusBadge, EmptyState, ErrorBox } from '../../components/admin/ui';
import { WASTE, TONES, fmtDateTime } from '../../utils';

const STATUSES = ['Pending', 'Scheduled', 'Completed'];

export default function Pickups() {
  const [list, setList] = useState(null);
  const [tab, setTab] = useState('All');
  const [error, setError] = useState('');

  const load = async () => {
    try { const { data } = await api.get('/admin/pickups'); setList(data); setError(''); }
    catch (e) { setError(errMsg(e, 'Could not load pickups')); }
  };
  useEffect(() => { load(); }, []);

  const update = async (id, status) => {
    try {
      await api.patch(`/admin/pickups/${id}`, { status });
      toast.success('Pickup updated. Citizen notified.');
      load();
    } catch (e) { toast.error(errMsg(e)); }
  };

  if (error && !list) return <PageWrap wide><ErrorBox message={error} onRetry={load} /></PageWrap>;
  const count = (s) => list?.filter((p) => p.status === s).length || 0;
  const shown = (list || []).filter((p) => tab === 'All' || p.status === tab);

  return (
    <PageWrap wide>
      <PageHeader icon={Truck} title="Pickup requests" subtitle="Schedule and complete waste pickups">
        <button onClick={load} className="btn btn-ghost !py-2 text-sm"><RefreshCw size={15} /> Refresh</button>
      </PageHeader>

      <div className="grid sm:grid-cols-3 gap-4">
        <KpiCard loading={!list} icon={Clock} label="Pending" value={count('Pending')} tone="amber" />
        <KpiCard loading={!list} icon={CalendarClock} label="Scheduled" value={count('Scheduled')} tone="sky" delay={0.05} />
        <KpiCard loading={!list} icon={CheckCircle2} label="Completed" value={count('Completed')} tone="emerald" delay={0.1} />
      </div>

      <div className="flex gap-2 mt-6 mb-4 flex-wrap">
        {['All', ...STATUSES].map((s) => (
          <button key={s} onClick={() => setTab(s)} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition border ${tab === s ? 'bg-emerald-400/15 text-emerald-300 border-emerald-400/40' : 'bg-surface text-muted border-line hover:text-ink'}`}>{s}</button>
        ))}
      </div>

      {!list ? <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-20" />)}</div> : shown.length === 0 ? (
        <div className="glass"><EmptyState title="No pickup requests" text="Requests from citizens will show up here." /></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {shown.map((p, i) => {
            const w = WASTE.find((x) => x.v === p.wasteType);
            const Icon = w?.icon;
            return (
              <motion.div key={p._id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }} className="glass p-4">
                <div className="flex items-start gap-3">
                  <span className={`tone-tile ${TONES[w?.tone || 'slate']}`}>{Icon && <Icon size={20} />}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{w?.label || p.wasteType} waste</div>
                    <div className="text-xs text-muted flex items-center gap-1.5 mt-1"><User size={12} />{p.user?.name || 'Deleted user'}</div>
                    <div className="text-xs text-muted flex items-center gap-1.5 mt-0.5"><MapPin size={12} className="shrink-0" /><span className="truncate">{p.address}</span></div>
                    <div className="text-xs text-muted flex items-center gap-1.5 mt-0.5"><CalendarClock size={12} />{fmtDateTime(p.slot)}</div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {STATUSES.map((s) => (
                    <button key={s} disabled={p.status === s} onClick={() => update(p._id, s)}
                      className="py-1.5 rounded-lg border border-line text-xs font-semibold text-muted hover:bg-surface-hover hover:text-ink transition disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-emerald-400/10 disabled:text-emerald-300">
                      {s}
                    </button>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </PageWrap>
  );
}
