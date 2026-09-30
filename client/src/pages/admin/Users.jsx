import { useEffect, useState } from 'react';
import { Users as UsersIcon, Search, Ban, UserCheck, ShieldCheck, Leaf } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../../api';
import { useAuth } from '../../context/AuthContext';
import PageWrap from '../../components/PageWrap';
import Avatar from '../../components/Avatar';
import Badge from '../../components/Badge';
import { PageHeader, KpiCard, EmptyState, ErrorBox, useDebounced } from '../../components/admin/ui';
import { TONES, getLevel, fmtDate } from '../../utils';

export default function Users() {
  const { user: me } = useAuth();
  const [list, setList] = useState(null);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const dq = useDebounced(q);

  const load = async () => {
    try { const { data } = await api.get('/admin/users', { params: { q: dq, role } }); setList(data); setError(''); }
    catch (e) { setError(errMsg(e, 'Could not load users')); }
  };
  useEffect(() => { load(); }, [dq, role]);

  const toggle = async (u) => {
    const next = u.active === false; // blocked -> unblock
    if (!next && !window.confirm(`Block ${u.name}? They will not be able to log in.`)) return;
    try {
      await api.patch(`/admin/users/${u._id}/active`, { active: next });
      toast.success(next ? 'User unblocked' : 'User blocked');
      load();
    } catch (e) { toast.error(errMsg(e)); }
  };

  if (error && !list) return <PageWrap wide><ErrorBox message={error} onRetry={load} /></PageWrap>;
  const citizens = list?.filter((u) => u.role === 'citizen').length || 0;
  const blocked = list?.filter((u) => u.active === false).length || 0;

  return (
    <PageWrap wide>
      <PageHeader icon={UsersIcon} title="Users" subtitle="Citizens and administrators" />

      <div className="grid sm:grid-cols-3 gap-4">
        <KpiCard loading={!list} icon={UsersIcon} label="Accounts shown" value={list?.length} tone="sky" />
        <KpiCard loading={!list} icon={Leaf} label="Citizens" value={citizens} tone="emerald" delay={0.05} />
        <KpiCard loading={!list} icon={Ban} label="Blocked" value={blocked} tone="rose" delay={0.1} />
      </div>

      <div className="glass p-3 my-4 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input className="field !pl-9 !py-2 text-sm" placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} maxLength={60} />
        </div>
        <select className="field !w-auto !py-2 !px-3 text-sm" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role filter">
          <option value="">All roles</option><option value="citizen">Citizens</option><option value="admin">Admins</option>
        </select>
      </div>

      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>User</th><th>Role</th><th>Eco level</th><th>Complaints</th><th>Joined</th><th>Status</th><th className="text-right">Action</th></tr></thead>
            <tbody>
              {!list && [0, 1, 2, 3].map((i) => <tr key={i}><td colSpan={7}><div className="skeleton h-9" /></td></tr>)}
              {list?.map((u) => {
                const isAdmin = u.role === 'admin';
                const off = u.active === false;
                return (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <Avatar name={u.name} size={36} />
                        <div className="min-w-0">
                          <div className="font-medium truncate">{u.name} {u._id === me.id && <span className="text-xs text-faint">(you)</span>}</div>
                          <div className="text-xs text-faint truncate">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><Badge cls={isAdmin ? TONES.violet : TONES.emerald}>{isAdmin ? <ShieldCheck size={12} /> : <Leaf size={12} />}{isAdmin ? 'Admin' : 'Citizen'}</Badge></td>
                    <td className="text-muted whitespace-nowrap">{isAdmin ? '-' : `${getLevel(u.points).name} · ${u.points} pts`}</td>
                    <td className="text-muted">{u.complaints}</td>
                    <td className="text-faint whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                    <td><Badge cls={off ? TONES.rose : TONES.emerald}>{off ? 'Blocked' : 'Active'}</Badge></td>
                    <td className="text-right">
                      {!isAdmin && (
                        <button onClick={() => toggle(u)} className={`btn btn-ghost !py-1.5 !px-3 text-xs ${off ? '' : 'hover:!border-rose-400 hover:!text-rose-300'}`}>
                          {off ? <><UserCheck size={14} /> Unblock</> : <><Ban size={14} /> Block</>}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {list?.length === 0 && <EmptyState title="No users found" text="Try a different search." />}
      </div>
    </PageWrap>
  );
}
