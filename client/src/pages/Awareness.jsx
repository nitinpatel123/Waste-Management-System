import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Recycle, FlaskConical, Cpu, ChevronDown, Lightbulb } from 'lucide-react';
import PageWrap from '../components/PageWrap';

const data = [
  { title: 'Wet Waste', icon: Leaf, tone: 'text-emerald-300 border-emerald-400/30', bin: 'Green bin', items: 'Vegetable and fruit peels, leftover food, tea leaves, flowers', tips: 'Compost it to make natural fertilizer. Do not put it in plastic bags.' },
  { title: 'Dry Waste', icon: Recycle, tone: 'text-sky-300 border-sky-400/30', bin: 'Blue bin', items: 'Paper, cardboard, plastic bottles, glass, metal cans', tips: 'Keep it clean and dry so it can be recycled.' },
  { title: 'Hazardous Waste', icon: FlaskConical, tone: 'text-rose-300 border-rose-400/30', bin: 'Red bin', items: 'Batteries, paint, chemicals, expired medicines, sanitary waste', tips: 'Wrap it separately in paper. Never mix it with regular waste.' },
  { title: 'E-Waste', icon: Cpu, tone: 'text-violet-300 border-violet-400/30', bin: 'Authorised e-waste center', items: 'Purane phones, chargers, bulbs, computers', tips: 'Give it to a recycler or a collection drive. Do not throw it away.' },
];

const facts = [
  'Segregation can significantly improve recycling efficiency.',
  'A plastic bottle can take 400+ years to decompose naturally.',
  'Wet waste can be composted at home.',
];

export default function Awareness() {
  const [open, setOpen] = useState(null);
  return (
    <PageWrap>
      <h2 className="font-display text-3xl font-bold">Waste <span className="text-gradient">awareness</span></h2>
      <p className="text-slate-400 mt-2 mb-8">Proper segregation means a cleaner city. Click a card to see details.</p>

      <div className="grid sm:grid-cols-2 gap-5">
        {data.map((d, i) => {
          const Icon = d.icon;
          return (
            <motion.div key={d.title} layout initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              onClick={() => setOpen(open === i ? null : i)} className="glass p-6 cursor-pointer hover:border-white/20 transition">
              <div className="flex items-center gap-4">
                <div className={`icon-tile ${d.tone}`}><Icon size={22} /></div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-lg">{d.title}</h3>
                  <div className="text-xs text-slate-400">{d.bin}</div>
                </div>
                <motion.div animate={{ rotate: open === i ? 180 : 0 }}><ChevronDown size={18} className="text-slate-400" /></motion.div>
              </div>
              <AnimatePresence>
                {open === i && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden text-sm mt-4 space-y-2 text-slate-300">
                    <p><b className="text-white">What goes in:</b> {d.items}</p>
                    <p><b className="text-white">Tip:</b> {d.tips}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <div className="glass p-6 mt-10">
        <h3 className="font-display font-bold mb-3 flex items-center gap-2"><Lightbulb size={18} className="text-amber-300" /> Did you know?</h3>
        {facts.map((f, i) => (
          <motion.p key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="text-sm text-slate-400 mb-2">{f}</motion.p>
        ))}
      </div>
    </PageWrap>
  );
}
