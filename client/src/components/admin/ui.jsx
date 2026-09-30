import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import CountUp from '../CountUp';
import Badge from '../Badge';
import { TONES, STATUS_STYLE, STATUS_ICON, PRIORITY_STYLE, PRIORITY_ICON } from '../../utils';

export function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

export function PageHeader({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <span className={`tone-tile !w-12 !h-12 ${TONES.emerald}`}><Icon size={22} /></span>
      <div className="flex-1 min-w-[200px]">
        <h2 className="font-display text-2xl font-bold">{title}</h2>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function KpiCard({ icon: Icon, label, value, suffix = '', tone = 'emerald', hint, delay = 0, loading }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} whileHover={{ y: -3 }} className="glass p-4 flex items-start gap-3">
      <span className={`tone-tile ${TONES[tone]}`}><Icon size={20} /></span>
      <div className="min-w-0">
        <div className="text-xs text-muted">{label}</div>
        <div className="font-display text-2xl font-bold leading-tight mt-0.5">
          {loading ? <span className="skeleton inline-block w-12 h-7" /> : <CountUp to={value} suffix={suffix} />}
        </div>
        {hint && <div className="text-[11px] text-faint mt-0.5 truncate">{hint}</div>}
      </div>
    </motion.div>
  );
}

export function StatusBadge({ status }) {
  const Icon = STATUS_ICON[status];
  return <Badge cls={STATUS_STYLE[status]}>{Icon && <Icon size={12} />}{status}</Badge>;
}

export function PriorityBadge({ priority }) {
  const Icon = PRIORITY_ICON[priority];
  return <Badge cls={PRIORITY_STYLE[priority]}>{Icon && <Icon size={12} />}{priority}</Badge>;
}

export function EmptyState({ title = 'Nothing here yet', text }) {
  return (
    <div className="py-14 text-center">
      <span className={`tone-tile !w-12 !h-12 mx-auto ${TONES.slate}`}><Inbox size={22} /></span>
      <div className="font-semibold mt-3">{title}</div>
      {text && <p className="text-sm text-faint mt-1">{text}</p>}
    </div>
  );
}

export function Pagination({ page, pages, total, onChange }) {
  if (total === 0) return null;
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-line text-sm text-muted">
      <span>{total} result{total === 1 ? '' : 's'}</span>
      <div className="flex items-center gap-2">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page" className="p-1.5 rounded-lg border border-line hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft size={16} /></button>
        <span>Page {page} of {pages}</span>
        <button disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page" className="p-1.5 rounded-lg border border-line hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="glass p-6 text-center max-w-md mx-auto">
      <p className="text-rose-300">{message}</p>
      {onRetry && <button onClick={onRetry} className="btn btn-ghost mt-4">Try again</button>}
    </div>
  );
}
