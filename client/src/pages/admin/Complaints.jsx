import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Search, Download, X, MapPin, ExternalLink, Sparkles, User, Clock, Eye, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../../api';
import PageWrap from '../../components/PageWrap';
import { PageHeader, StatusBadge, PriorityBadge, Pagination, EmptyState, ErrorBox, useDebounced } from '../../components/admin/ui';
import { TYPES, TONES, typeLabel, fmtDateTime, STATUS_ICON, STATUS_STYLE } from '../../utils';

const STATUSES = ['Pending', 'In Progress', 'Resolved'];
const sel = 'field !w-auto !py-2 !px-3 text-sm';

// Stops Excel from running text that starts with = + - @ as a formula
const cell = (v) => {
  let s = String(v ?? '');
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export default function Complaints() {
  const [filter, setFilter] = useState({ q: '', status: '', priority: '', type: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);       // complaint shown in the side panel
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const q = useDebounced(filter.q);

  const params = { q, status: filter.status, priority: filter.priority, type: filter.type };

  const load = async () => {
    setLoading(true);
    try {
      const { data: d } = await api.get('/admin/complaints', { params: { ...params, page, limit: 10 } });
      setData(d); setError('');
    } catch (e) { setError(errMsg(e, 'Could not load complaints')); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [q, filter.status, filter.priority, filter.type, page]);
  useEffect(() => { setPage(1); }, [q, filter.status, filter.priority, filter.type]);

  const openPanel = (c) => { setOpen(c); setNewStatus(''); setNote(''); };

  const save = async () => {
    setSaving(true);
    try {
      const { data: updated } = await api.patch(`/admin/complaints/${open._id}`, { status: newStatus, note });
      toast.success('Status updated. Citizen notified.');
      setOpen({ ...open, ...updated, user: open.user });
      setNewStatus(''); setNote('');
      load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSaving(false); }
  };

  const exportCSV = async () => {
    try {
      const { data: rows } = await api.get('/admin/complaints/export', { params });
      const head = ['ID', 'Type', 'Priority', 'Status', 'Citizen', 'Email', 'Description', 'Address', 'Lat', 'Lng', 'Created'];
      const lines = [head, ...rows.map((c) => [
        c._id, c.type, c.priority, c.status, c.user?.name || '', c.user?.email || '', c.description || '',
        c.location?.address || '', c.location?.lat ?? '', c.location?.lng ?? '', new Date(c.createdAt).toISOString(),
      ])];
      const blob = new Blob([`\ufeff${lines.map((r) => r.map(cell).join(',')).join('\n')}`], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'complaints.csv'; a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) { toast.error(errMsg(e, 'Export failed')); }
  };

  return (
    <PageWrap wide>
      <PageHeader icon={ClipboardList} title="Complaints" subtitle="Search, filter and update citizen complaints">
        <button onClick={exportCSV} className="btn btn-ghost !py-2 text-sm"><Download size={15} /> Export CSV</button>
      </PageHeader>

      <div className="glass p-3 mb-4 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input className="field !pl-9 !py-2 text-sm" placeholder="Search description, address, citizen name or email" value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} maxLength={60} />
        </div>
        <select className={sel} value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} aria-label="Status filter">
          <option value="">All status</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className={sel} value={filter.priority} onChange={(e) => setFilter({ ...filter, priority: e.target.value })} aria-label="Priority filter">
          <option value="">All priority</option><option>High</option><option>Medium</option><option>Low</option>
        </select>
        <select className={sel} value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })} aria-label="Type filter">
          <option value="">All types</option>{TYPES.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
        </select>
      </div>

      {error ? <ErrorBox message={error} onRetry={load} /> : (
        <div className="glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Complaint</th><th>Citizen</th><th>Priority</th><th>Status</th><th>Reported</th><th className="text-right">Action</th></tr></thead>
              <tbody>
                {loading && [0, 1, 2, 3, 4].map((i) => <tr key={i}><td colSpan={6}><div className="skeleton h-9" /></td></tr>)}
                {!loading && data.items.map((c) => {
                  const t = TYPES.find((x) => x.v === c.type);
                  const Icon = t?.icon;
                  return (
                    <tr key={c._id} className="cursor-pointer" onClick={() => openPanel(c)}>
                      <td>
                        <div className="flex items-center gap-3 min-w-[220px]">
                          {c.image
                            ? <img src={c.image} alt="" className="w-10 h-10 rounded-xl object-cover border border-line shrink-0" />
                            : <span className={`tone-tile ${TONES[t?.tone || 'slate']}`}>{Icon && <Icon size={18} />}</span>}
                          <div className="min-w-0">
                            <div className="font-medium">{typeLabel(c.type)} <span className="text-xs text-faint font-normal">#{c._id.slice(-6).toUpperCase()}</span></div>
                            <div className="text-xs text-faint truncate max-w-[280px]">{c.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-muted whitespace-nowrap">{c.user?.name || 'Deleted user'}</td>
                      <td><PriorityBadge priority={c.priority} /></td>
                      <td><StatusBadge status={c.status} /></td>
                      <td className="text-faint whitespace-nowrap">{fmtDateTime(c.createdAt)}</td>
                      <td className="text-right">
                        <button className="btn btn-ghost !py-1.5 !px-3 text-xs" onClick={(e) => { e.stopPropagation(); openPanel(c); }}><Eye size={14} /> Manage</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!loading && data.items.length === 0 && <EmptyState title="No complaints found" text="Try changing the search or filters." />}
          <Pagination page={page} pages={data.pages} total={data.total} onChange={setPage} />
        </div>
      )}

      {/* Side panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)} className="fixed inset-0 z-[1700] bg-black/60 backdrop-blur-sm" />
            <motion.aside
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 right-0 z-[1800] w-full max-w-md bg-surface-solid border-l border-line flex flex-col"
              role="dialog" aria-label="Complaint details"
            >
              <div className="h-16 px-5 flex items-center justify-between border-b border-line shrink-0">
                <div>
                  <div className="font-display font-bold">{typeLabel(open.type)}</div>
                  <div className="text-xs text-faint">#{open._id.slice(-6).toUpperCase()}</div>
                </div>
                <button onClick={() => setOpen(null)} aria-label="Close" className="p-2 rounded-lg text-muted hover:bg-surface-hover"><X size={18} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <div className="flex gap-2"><StatusBadge status={open.status} /><PriorityBadge priority={open.priority} /></div>
                {open.image && <img src={open.image} alt="Complaint" className="w-full max-h-56 object-cover rounded-xl border border-line" />}
                <p className="text-sm text-slate-300">{open.description}</p>

                <ul className="space-y-2.5 text-sm text-muted">
                  <li className="flex items-center gap-2"><User size={15} className="text-faint" />{open.user?.name || 'Deleted user'} {open.user?.email && <span className="text-faint">({open.user.email})</span>}</li>
                  <li className="flex items-center gap-2"><Clock size={15} className="text-faint" />{fmtDateTime(open.createdAt)}</li>
                  {open.location?.lat != null && (
                    <li className="flex items-center gap-2">
                      <MapPin size={15} className="text-faint shrink-0" />
                      <span className="truncate">{open.location.address || `${open.location.lat.toFixed(4)}, ${open.location.lng.toFixed(4)}`}</span>
                      <a href={`https://www.openstreetmap.org/?mlat=${open.location.lat}&mlon=${open.location.lng}#map=17/${open.location.lat}/${open.location.lng}`} target="_blank" rel="noopener noreferrer" className="text-emerald-300 flex items-center gap-1 shrink-0 hover:underline">Map <ExternalLink size={12} /></a>
                    </li>
                  )}
                  {open.aiCategory && <li className="flex items-center gap-2 text-violet-300"><Sparkles size={15} />AI detected: {open.aiCategory} waste</li>}
                </ul>

                <div>
                  <div className="text-xs uppercase tracking-wider text-faint mb-2">Timeline</div>
                  <div className="border-l-2 border-emerald-400/30 pl-4 space-y-3">
                    {(open.timeline || []).map((t, i) => (
                      <div key={i} className="text-sm">
                        <div className="font-medium">{t.status}</div>
                        <div className="text-xs text-muted">{t.note}</div>
                        <div className="text-[11px] text-faint">{fmtDateTime(t.at)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-line shrink-0 space-y-3">
                <div className="text-xs uppercase tracking-wider text-faint">Update status</div>
                <div className="grid grid-cols-3 gap-2">
                  {STATUSES.map((s) => {
                    const Icon = STATUS_ICON[s];
                    const current = open.status === s;
                    return (
                      <button key={s} disabled={current} onClick={() => setNewStatus(s)}
                        className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${newStatus === s ? STATUS_STYLE[s] : 'border-line text-muted hover:bg-surface-hover'}`}>
                        <Icon size={16} />{s}
                      </button>
                    );
                  })}
                </div>
                {newStatus && (
                  <>
                    <textarea className="field text-sm" rows={2} maxLength={300} placeholder="Note for the citizen (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
                    <button onClick={save} disabled={saving} className="btn btn-primary w-full">
                      {saving ? <Loader2 size={16} className="animate-spin" /> : null} Mark as {newStatus} and notify
                    </button>
                  </>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </PageWrap>
  );
}
