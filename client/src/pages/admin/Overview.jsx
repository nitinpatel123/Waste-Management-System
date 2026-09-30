import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from 'recharts';
import {
  LayoutDashboard, ClipboardList, Clock, Loader, CheckCircle2, Flame, TrendingUp, Timer, Truck,
  Sparkles, Loader2, RefreshCw, MapPin, Info, ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../../api';
import PageWrap from '../../components/PageWrap';
import { DARK_TILES, TILE_ATTR } from '../../components/LocationPicker';
import { KpiCard, PageHeader, StatusBadge, PriorityBadge, ErrorBox, EmptyState } from '../../components/admin/ui';
import { TYPES, TONES, typeLabel, fmtDateTime } from '../../utils';

const STATUS_COLORS = { Pending: '#fbbf24', 'In Progress': '#38bdf8', Resolved: '#34d399' };
const tip = { contentStyle: { background: 'var(--surface-solid)', border: '1px solid var(--line-strong)', borderRadius: 12, color: 'var(--ink)' }, itemStyle: { color: 'var(--ink)' } };

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState(null); // { insights, source, notice }
  const [aiBusy, setAiBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    try {
      const [s, c] = await Promise.all([api.get('/admin/stats'), api.get('/admin/complaints', { params: { limit: 6 } })]);
      setStats(s.data); setRecent(c.data.items); setError('');
    } catch (e) { setError(errMsg(e, 'Could not load dashboard data')); }
    finally { setBusy(false); }
  };
  useEffect(() => { load(); }, []);

  const genInsights = async () => {
    setAiBusy(true);
    try { const { data } = await api.post('/admin/insights'); setAi(data); }
    catch (e) { toast.error(errMsg(e, 'Could not generate insights')); }
    finally { setAiBusy(false); }
  };

  if (error && !stats) return <PageWrap wide><ErrorBox message={error} onRetry={load} /></PageWrap>;

  const n = (name) => stats?.byStatus.find((x) => x.name === name)?.value || 0;
  const L = !stats;
  const totalTypes = stats ? stats.byType.reduce((a, b) => a + b.value, 0) || 1 : 1;

  return (
    <PageWrap wide>
      <PageHeader icon={LayoutDashboard} title="Command center" subtitle="Live overview of complaints, pickups and city hotspots">
        <button onClick={load} disabled={busy} className="btn btn-ghost !py-2 text-sm">
          <RefreshCw size={15} className={busy ? 'animate-spin' : ''} /> Refresh
        </button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard loading={L} icon={ClipboardList} label="Total complaints" value={stats?.total} tone="sky" delay={0} hint={`${stats?.users ?? 0} citizens registered`} />
        <KpiCard loading={L} icon={Clock} label="Pending" value={n('Pending')} tone="amber" delay={0.05} hint="Waiting for action" />
        <KpiCard loading={L} icon={Loader} label="In progress" value={n('In Progress')} tone="violet" delay={0.1} hint="Being handled" />
        <KpiCard loading={L} icon={CheckCircle2} label="Resolved" value={n('Resolved')} tone="emerald" delay={0.15} hint="Closed complaints" />
        <KpiCard loading={L} icon={Flame} label="High priority open" value={stats?.highOpen} tone="rose" delay={0.2} hint="Needs quick attention" />
        <KpiCard loading={L} icon={TrendingUp} label="Resolution rate" value={stats?.resolutionRate} suffix="%" tone="emerald" delay={0.25} hint="Resolved / total" />
        <KpiCard loading={L} icon={Timer} label="Avg. resolution time" value={stats?.avgHours} suffix=" h" tone="sky" delay={0.3} hint="From report to resolved" />
        <KpiCard loading={L} icon={Truck} label="Pickup requests" value={stats?.pickups} tone="violet" delay={0.35} hint="All time" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="glass p-5 lg:col-span-2">
          <h3 className="font-display font-bold">Complaints, last 14 days</h3>
          <p className="text-xs text-faint mb-3">New complaints reported each day</p>
          <div className="h-64">
            {stats && (
              <ResponsiveContainer>
                <AreaChart data={stats.trend} margin={{ left: -20, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} interval={1} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <RTooltip {...tip} />
                  <Area type="monotone" dataKey="value" name="Complaints" stroke="#10b981" strokeWidth={2.5} fill="url(#trendFill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass p-5">
          <h3 className="font-display font-bold">Status split</h3>
          <div className="h-44 relative">
            {stats && (
              <>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={stats.byStatus} dataKey="value" nameKey="name" innerRadius={52} outerRadius={74} paddingAngle={3} stroke="none">
                      {stats.byStatus.map((x) => <Cell key={x.name} fill={STATUS_COLORS[x.name] || '#94a3b8'} />)}
                    </Pie>
                    <RTooltip {...tip} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="font-display text-2xl font-bold">{stats.total}</div>
                  <div className="text-[11px] text-faint">total</div>
                </div>
              </>
            )}
          </div>
          <ul className="mt-2 space-y-1.5 text-sm">
            {['Pending', 'In Progress', 'Resolved'].map((s) => (
              <li key={s} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[s] }} />
                <span className="text-muted flex-1">{s}</span>
                <span className="font-semibold">{n(s)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="glass p-5">
          <h3 className="font-display font-bold mb-4">By complaint type</h3>
          <ul className="space-y-4">
            {TYPES.map((t) => {
              const v = stats?.byType.find((x) => x.name === t.v)?.value || 0;
              const Icon = t.icon;
              return (
                <li key={t.v}>
                  <div className="flex items-center gap-3">
                    <span className={`tone-tile !w-9 !h-9 ${TONES[t.tone]}`}><Icon size={16} /></span>
                    <span className="text-sm flex-1">{t.label}</span>
                    <span className="font-semibold">{v}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400" initial={{ width: 0 }} animate={{ width: `${(v / totalTypes) * 100}%` }} transition={{ duration: 0.7 }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="glass p-5 lg:col-span-2 border-violet-400/30">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="font-display font-bold flex items-center gap-2"><Sparkles size={18} className="text-violet-300" /> AI insights</h3>
            <button onClick={genInsights} disabled={aiBusy} className="btn btn-ghost !py-1.5 text-sm">
              {aiBusy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} {aiBusy ? 'Analyzing...' : ai ? 'Regenerate' : 'Generate insights'}
            </button>
          </div>
          {!ai && !aiBusy && <p className="text-sm text-faint mt-4">Get 3 short, actionable suggestions based on your current complaint data.</p>}
          <AnimatePresence>
            {ai && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                <ul className="mt-4 space-y-3">
                  {ai.insights.map((t, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }} className="flex gap-3 text-sm">
                      <span className="tone-tile !w-7 !h-7 !rounded-lg text-xs font-bold bg-violet-400/15 text-violet-300 border-violet-400/30">{i + 1}</span>
                      <span className="text-slate-300 pt-0.5">{t}</span>
                    </motion.li>
                  ))}
                </ul>
                {ai.notice && (
                  <p className="mt-4 text-xs text-amber-300 flex items-start gap-1.5"><Info size={14} className="shrink-0 mt-px" />{ai.notice}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="glass p-5 mt-6">
        <h3 className="font-display font-bold mb-1 flex items-center gap-2"><MapPin size={18} className="text-rose-300" /> Open-complaint hotspots</h3>
        <p className="text-xs text-faint mb-3">Bigger circle = more open complaints. Red means 3 or more.</p>
        <MapContainer center={stats?.hotspots[0] ? [stats.hotspots[0].lat, stats.hotspots[0].lng] : [26.4499, 80.3319]} zoom={12} className="h-80 rounded-xl z-0 border border-line" key={stats ? 'ready' : 'wait'}>
          <TileLayer url={DARK_TILES} attribution={TILE_ATTR} />
          {stats?.hotspots.map((h, i) => (
            <CircleMarker key={i} center={[h.lat, h.lng]} radius={8 + h.count * 4} pathOptions={{ color: h.count >= 3 ? '#fb7185' : '#fbbf24', fillOpacity: 0.45 }}>
              <Tooltip>{h.count} open complaint(s)</Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <div className="glass mt-6 overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="font-display font-bold">Latest complaints</h3>
          <Link to="/admin/complaints" className="text-sm text-emerald-300 hover:underline flex items-center gap-1">View all <ArrowRight size={14} /></Link>
        </div>
        {recent.length === 0 ? <EmptyState title="No complaints yet" text="New reports will appear here." /> : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Type</th><th>Citizen</th><th>Priority</th><th>Status</th><th>Reported</th></tr></thead>
              <tbody>
                {recent.map((c) => {
                  const t = TYPES.find((x) => x.v === c.type);
                  const Icon = t?.icon;
                  return (
                    <tr key={c._id}>
                      <td><div className="flex items-center gap-3"><span className={`tone-tile !w-9 !h-9 ${TONES[t?.tone || 'slate']}`}>{Icon && <Icon size={16} />}</span><span className="font-medium whitespace-nowrap">{typeLabel(c.type)}</span></div></td>
                      <td className="text-muted">{c.user?.name || 'Deleted user'}</td>
                      <td><PriorityBadge priority={c.priority} /></td>
                      <td><StatusBadge status={c.status} /></td>
                      <td className="text-faint whitespace-nowrap">{fmtDateTime(c.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrap>
  );
}
