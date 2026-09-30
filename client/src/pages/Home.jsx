import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ClipboardList, CheckCircle2, TrendingUp, Users, Camera, Truck, MapPinned,
  Sparkles, Flame, Trophy, Send, Wrench, PartyPopper, Bell, ShieldCheck, Clock,
} from 'lucide-react';
import PageWrap from '../components/PageWrap';
import CountUp from '../components/CountUp';
import Badge from '../components/Badge';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { STATUS_STYLE, PRIORITY_STYLE } from '../utils';

const features = [
  { icon: Sparkles, title: 'AI waste classifier', desc: 'Snap a photo and AI tells you the waste type (wet, dry, hazardous, e-waste) with a confidence score and a disposal tip.', to: '/report', wide: true },
  { icon: MapPinned, title: 'Live tracking', desc: 'A clear status timeline for every complaint, from submitted to resolved.', to: '/my-complaints' },
  { icon: Camera, title: 'Photo and map reports', desc: 'Report with a photo and an exact map pin in under a minute.', to: '/report' },
  { icon: Flame, title: 'Hotspot intelligence', desc: 'Smart priority scoring and hotspot maps show admins where to act first.' },
  { icon: Truck, title: 'Pickup scheduling', desc: 'Book a slot for wet, dry, hazardous or e-waste collection.', to: '/pickup' },
  { icon: Trophy, title: 'Eco rewards and levels', desc: 'Earn points for reporting and for resolved issues, level up from Seedling to Green Guardian and climb the leaderboard.', to: '/leaderboard', wide: true },
  { icon: Bell, title: 'Instant notifications', desc: 'Get notified the moment your complaint or pickup status changes.' },
];

const steps = [
  [Send, 'Report', 'Take a photo, pin the location and submit.'],
  [Wrench, 'Action', 'Admin reviews the priority and assigns a team.'],
  [PartyPopper, 'Resolved', 'You get notified and earn eco points.'],
];

const citizens = ['Report issues with photo and map pin', 'Track every complaint live', 'Book waste pickups in seconds', 'Earn eco points and badges'];
const admins = ['One command center for all complaints', 'Hotspot map and priority scoring', 'AI generated insights and CSV export', 'Update status and notify citizens instantly'];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0 } };

// A small illustrated dashboard shown in the hero. The numbers are sample data.
function HeroPreview() {
  const bars = [38, 62, 45, 78, 55, 88, 70];
  const rows = [
    ['Overflowing Bin', 'Civil Lines', 'High', 'In Progress'],
    ['Missed Collection', 'Swaroop Nagar', 'Medium', 'Pending'],
    ['Garbage on Road', 'Kakadeo', 'Low', 'Resolved'],
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 30, rotate: 1 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: 0.25, duration: 0.6 }} className="relative">
      <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 blur-2xl rounded-[2rem]" />
      <div className="glass glass-solid relative p-4 sm:p-5">
        <div className="flex items-center gap-1.5 mb-4">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-3 text-[11px] text-faint">Dashboard preview (sample data)</span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {[['Open', '24', 'text-amber-300'], ['In progress', '9', 'text-sky-300'], ['Resolved', '87%', 'text-emerald-300']].map(([l, v, c]) => (
            <div key={l} className="rounded-xl border border-line bg-white/5 p-3">
              <div className={`font-display text-xl font-bold ${c}`}>{v}</div>
              <div className="text-[11px] text-faint">{l}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-xl border border-line bg-white/5 p-3">
          <div className="text-[11px] text-faint mb-2">Complaints this week</div>
          <div className="flex items-end gap-2 h-20">
            {bars.map((h, i) => (
              <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: 0.5 + i * 0.07, duration: 0.6 }} className="flex-1 rounded-t-md bg-gradient-to-t from-emerald-500 to-cyan-400" />
            ))}
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {rows.map(([t, place, p, st], i) => (
            <motion.div key={t} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 + i * 0.12 }} className="flex items-center gap-3 rounded-xl border border-line bg-white/5 px-3 py-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate">{t}</div>
                <div className="text-[11px] text-faint truncate">{place}</div>
              </div>
              <Badge cls={PRIORITY_STYLE[p]}>{p}</Badge>
              <span className="hidden sm:inline-flex"><Badge cls={STATUS_STYLE[st]}>{st}</Badge></span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [s, setS] = useState(null);
  useEffect(() => { api.get('/public/stats').then((r) => setS(r.data)).catch(() => {}); }, []);
  const rate = s && s.total ? Math.round((s.resolved / s.total) * 100) : 0;
  const stats = [
    [ClipboardList, 'Issues reported', s?.total, ''],
    [CheckCircle2, 'Resolved', s?.resolved, ''],
    [TrendingUp, 'Resolution rate', s ? rate : undefined, '%'],
    [Users, 'Active citizens', s?.citizens, ''],
  ];
  const primaryTo = user ? (user.role === 'admin' ? '/admin' : '/report') : '/auth';
  const primaryLabel = user ? (user.role === 'admin' ? 'Open command center' : 'Report an issue') : 'Get started free';

  return (
    <PageWrap>
      {/* HERO */}
      <section className="relative pt-6 sm:pt-12 pb-10">
        <div className="bg-grid absolute inset-x-0 -top-8 h-[28rem] pointer-events-none" />
        <div className="relative grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-300 bg-emerald-400/10 border border-emerald-400/25 rounded-full px-4 py-1.5">
              <Sparkles size={14} /> AI-powered civic platform
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-display text-4xl sm:text-5xl xl:text-6xl font-extrabold mt-6 leading-[1.08]">
              Cleaner cities,<br /><span className="text-gradient">powered by citizens.</span>
            </motion.h2>
            <p className="mt-5 text-muted max-w-lg text-base sm:text-lg">
              Report waste, book pickups and track your complaint live. Municipal teams get one command center with hotspots, smart priorities and AI insights.
            </p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-8 flex flex-wrap gap-3">
              <Link to={primaryTo} className="btn btn-primary">{primaryLabel} <ArrowRight size={18} /></Link>
              <Link to="/awareness" className="btn btn-ghost">Learn segregation</Link>
            </motion.div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted">
              {[[ShieldCheck, 'Secure role-based access'], [Clock, 'Report in under a minute'], [Sparkles, 'AI classification']].map(([Icon, t]) => (
                <span key={t} className="inline-flex items-center gap-1.5"><Icon size={14} className="text-brand-ink" />{t}</span>
              ))}
            </div>
          </div>
          <HeroPreview />
        </div>
      </section>

      {/* LIVE STATS */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(([Icon, label, val, suffix]) => (
          <motion.div key={label} variants={item} className="glass p-5">
            <div className="flex items-center justify-between">
              <Icon size={20} className="text-emerald-300" />
              <span className="flex items-center gap-1 text-[10px] text-faint"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />LIVE</span>
            </div>
            <div className="font-display text-3xl font-bold mt-3">
              {val === undefined ? <div className="skeleton h-9 w-20" /> : <CountUp to={val} suffix={suffix} />}
            </div>
            <div className="text-xs text-muted mt-1">{label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* FEATURES */}
      <section className="mt-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="text-xs font-semibold text-brand-ink tracking-wider uppercase">Features</div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mt-2">Everything a smart city needs, <span className="text-gradient">in one platform</span></h2>
        </div>
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc, to, wide }) => {
            const body = (
              <>
                <div className="icon-tile"><Icon size={22} /></div>
                <h3 className="font-display font-bold text-lg mt-4">{title}</h3>
                <p className="text-muted text-sm mt-1.5">{desc}</p>
                {to && <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-ink mt-4">Open <ArrowRight size={13} /></span>}
              </>
            );
            const cls = `glass p-6 h-full block ${to ? 'glass-hover' : ''}`;
            return (
              <motion.div key={title} variants={item} whileHover={{ y: -5 }} className={wide ? 'lg:col-span-2' : ''}>
                {to ? <Link to={to} className={cls}>{body}</Link> : <div className={cls}>{body}</div>}
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mt-20">
        <div className="text-center mb-10">
          <div className="text-xs font-semibold text-brand-ink tracking-wider uppercase">How it works</div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mt-2">From report to resolved in 3 steps</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5 relative">
          {steps.map(([Icon, title, desc], i) => (
            <motion.div key={title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="glass p-6 text-center relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 text-[#03110c] text-xs font-bold flex items-center justify-center">{i + 1}</div>
              <div className="icon-tile mx-auto mt-2"><Icon size={22} /></div>
              <h3 className="font-display font-bold text-lg mt-4">{title}</h3>
              <p className="text-muted text-sm mt-1">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TWO AUDIENCES */}
      <section className="mt-20 grid md:grid-cols-2 gap-5">
        {[
          ['For citizens', Users, citizens],
          ['For municipal teams', ShieldCheck, admins],
        ].map(([title, Icon, list], k) => (
          <motion.div key={title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: k * 0.1 }} className="glass p-7">
            <div className="flex items-center gap-3">
              <div className="icon-tile"><Icon size={22} /></div>
              <h3 className="font-display font-bold text-xl">{title}</h3>
            </div>
            <ul className="mt-5 space-y-3">
              {list.map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm text-muted">
                  <CheckCircle2 size={18} className="text-emerald-300 shrink-0 mt-0.5" />{t}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </section>

      {/* FINAL CTA */}
      <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-20 relative overflow-hidden rounded-3xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/15 to-cyan-500/15 p-8 sm:p-12 text-center">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl" />
        <div className="relative">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold">Ready to make your city <span className="text-gradient">cleaner</span>?</h2>
          <p className="text-muted mt-3 max-w-xl mx-auto">Join the movement. One report can start a cleanup for your whole neighbourhood.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to={primaryTo} className="btn btn-primary">{primaryLabel} <ArrowRight size={18} /></Link>
            <Link to="/leaderboard" className="btn btn-ghost"><Trophy size={18} /> See leaderboard</Link>
          </div>
        </div>
      </motion.section>
    </PageWrap>
  );
}
