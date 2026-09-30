import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, MapPin, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api';
import PageWrap from '../components/PageWrap';
import Badge from '../components/Badge';
import { WASTE, STATUS_STYLE } from '../utils';

export default function PickupRequest() {
  const [form, setForm] = useState({ address: '', wasteType: 'wet', slot: '' });
  const [list, setList] = useState([]);
  const load = () => api.get('/pickups/mine').then((r) => setList(r.data)).catch((e) => toast.error(errMsg(e, 'Could not load requests')));
  const minSlot = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/pickups', form);
      toast.success('Pickup request submitted');
      setForm({ address: '', wasteType: 'wet', slot: '' });
      load();
    } catch (err) { toast.error(errMsg(err)); }
  };

  return (
    <PageWrap>
      <div className="grid md:grid-cols-2 gap-8">
        <form onSubmit={submit} className="glass p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="font-display text-2xl font-bold">Waste pickup request</h2>
            <p className="text-sm text-slate-400 mt-1">Choose a slot and we will collect your waste.</p>
          </div>
          <input className="field" placeholder="Pickup address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            {WASTE.map((w) => {
              const Icon = w.icon;
              const active = form.wasteType === w.v;
              return (
                <motion.button type="button" key={w.v} whileTap={{ scale: 0.95 }} onClick={() => setForm({ ...form, wasteType: w.v })}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition ${active ? 'border-emerald-400 bg-emerald-400/10 text-emerald-200' : 'border-white/10 bg-white/5 text-slate-300'}`}>
                  <Icon size={18} />{w.label}
                </motion.button>
              );
            })}
          </div>
          <input className="field" type="datetime-local" min={minSlot} value={form.slot} onChange={(e) => setForm({ ...form, slot: e.target.value })} required />
          <button className="btn btn-primary w-full"><Truck size={18} /> Request pickup</button>
        </form>

        <div className="space-y-3">
          <h3 className="font-display font-bold text-lg">My pickup requests</h3>
          {list.length === 0 && <p className="text-slate-500 text-sm">No requests yet.</p>}
          {list.map((p, i) => (
            <motion.div key={p._id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="glass p-4 flex justify-between items-center gap-3">
              <div>
                <div className="font-semibold capitalize">{p.wasteType} waste</div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-1"><MapPin size={12} />{p.address}</div>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><CalendarClock size={12} />{new Date(p.slot).toLocaleString()}</div>
              </div>
              <Badge cls={STATUS_STYLE[p.status]}>{p.status}</Badge>
            </motion.div>
          ))}
        </div>
      </div>
    </PageWrap>
  );
}
