import {
  Trash2, Construction, Truck, AlertTriangle, Leaf, Recycle, FlaskConical, Cpu,
  Clock, Loader, CheckCircle2, CalendarClock, Flame, Activity, ArrowDown,
} from 'lucide-react';

export const STATUS_STYLE = {
  Pending: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  'In Progress': 'bg-sky-400/15 text-sky-300 border-sky-400/30',
  Resolved: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  Scheduled: 'bg-sky-400/15 text-sky-300 border-sky-400/30',
  Completed: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
};
export const STATUS_ICON = {
  Pending: Clock, 'In Progress': Loader, Resolved: CheckCircle2, Scheduled: CalendarClock, Completed: CheckCircle2,
};
export const PRIORITY_STYLE = {
  High: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
  Medium: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  Low: 'bg-slate-400/15 text-slate-300 border-slate-400/30',
};
export const PRIORITY_ICON = { High: Flame, Medium: Activity, Low: ArrowDown };

// Colour tones for icon tiles (work in dark and light mode)
export const TONES = {
  emerald: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  sky: 'bg-sky-400/15 text-sky-300 border-sky-400/30',
  amber: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  rose: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
  violet: 'bg-violet-400/15 text-violet-300 border-violet-400/30',
  slate: 'bg-slate-400/15 text-slate-300 border-slate-400/30',
};

export const TYPES = [
  { v: 'overflow', label: 'Overflowing Bin', icon: Trash2, tone: 'amber' },
  { v: 'roadGarbage', label: 'Garbage on Road', icon: Construction, tone: 'sky' },
  { v: 'missed', label: 'Missed Collection', icon: Truck, tone: 'violet' },
  { v: 'dumping', label: 'Illegal Dumping', icon: AlertTriangle, tone: 'rose' },
];
export const WASTE = [
  { v: 'wet', label: 'Wet', icon: Leaf, tone: 'emerald' },
  { v: 'dry', label: 'Dry', icon: Recycle, tone: 'sky' },
  { v: 'hazardous', label: 'Hazardous', icon: FlaskConical, tone: 'rose' },
  { v: 'e-waste', label: 'E-Waste', icon: Cpu, tone: 'violet' },
];
export const typeLabel = (v) => TYPES.find((t) => t.v === v)?.label || v;

export const LEVELS = [
  { min: 0, name: 'Seedling' },
  { min: 50, name: 'Sprout' },
  { min: 150, name: 'Eco Warrior' },
  { min: 300, name: 'Green Guardian' },
];
export const getLevel = (points = 0) => {
  let idx = 0;
  LEVELS.forEach((l, i) => { if (points >= l.min) idx = i; });
  const cur = LEVELS[idx];
  const next = LEVELS[idx + 1] || null;
  const progress = next ? Math.round(((points - cur.min) / (next.min - cur.min)) * 100) : 100;
  return { ...cur, next, progress };
};

export const initials = (name = '') =>
  name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-');
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-');
