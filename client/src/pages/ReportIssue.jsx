import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, LocateFixed, ImagePlus, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api';
import PageWrap from '../components/PageWrap';
import LocationPicker from '../components/LocationPicker';
import { TYPES } from '../utils';

export default function ReportIssue() {
  const nav = useNavigate();
  const [type, setType] = useState('overflow');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loc, setLoc] = useState(null);
  const [ai, setAi] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const onFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return toast.error('Please select an image file');
    if (f.size > 5 * 1024 * 1024) return toast.error('Image is too large (max 5 MB)');
    setFile(f); setPreview(URL.createObjectURL(f)); setAi(null);
  };

  // Free the memory used by the preview image when it changes or the page closes.
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const classify = async () => {
    if (!file) return toast.error('Select a photo first');
    setAiLoading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/ai/classify', fd);
      setAi(data);
    } catch (err) { toast.error(errMsg(err, 'AI classification failed')); }
    finally { setAiLoading(false); }
  };

  const myLocation = () => {
    if (!navigator.geolocation) return toast.error('Location is not supported in this browser');
    navigator.geolocation.getCurrentPosition(
      (p) => setLoc({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => toast.error('Please allow location access')
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!loc) return toast.error('Pin the location on the map');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('type', type);
      fd.append('description', description);
      fd.append('address', address);
      fd.append('lat', loc.lat);
      fd.append('lng', loc.lng);
      if (ai?.category) fd.append('aiCategory', ai.category);
      if (file) fd.append('image', file);
      await api.post('/complaints', fd);
      toast.success('Complaint submitted! +10 eco points');
      nav('/my-complaints');
    } catch (err) {
      toast.error(errMsg(err));
    } finally { setBusy(false); }
  };

  return (
    <PageWrap>
      <form onSubmit={submit} className="glass p-6 sm:p-8 space-y-6 max-w-3xl mx-auto">
        <div>
          <h2 className="font-display text-2xl font-bold">Report a waste issue</h2>
          <p className="text-sm text-slate-400 mt-1">Priority is set automatically based on issue type, location and nearby complaints.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TYPES.map((t) => {
            const Icon = t.icon;
            const active = type === t.v;
            return (
              <motion.button type="button" key={t.v} whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }} onClick={() => setType(t.v)}
                className={`p-4 rounded-xl border text-sm font-medium flex flex-col items-center gap-2 transition ${active ? 'border-emerald-400 bg-emerald-400/10 text-emerald-200' : 'border-white/10 bg-white/5 text-slate-300'}`}>
                <Icon size={24} />{t.label}
              </motion.button>
            );
          })}
        </div>

        <textarea className="field" rows={3} placeholder="Describe the problem..." value={description} onChange={(e) => setDescription(e.target.value)} required />
        <input className="field" placeholder="Landmark / address" value={address} onChange={(e) => setAddress(e.target.value)} />

        <div>
          <label className="btn btn-ghost cursor-pointer"><ImagePlus size={18} /> {file ? 'Change photo' : 'Upload photo'}
            <input type="file" accept="image/*" onChange={onFile} className="hidden" />
          </label>
          <AnimatePresence>
            {preview && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 flex flex-wrap items-center gap-4">
                <img src={preview} alt="preview" className="h-32 rounded-xl object-cover border border-white/10" />
                <button type="button" onClick={classify} disabled={aiLoading} className="btn btn-ghost !border-violet-400/40 !text-violet-300">
                  {aiLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} {aiLoading ? 'Analyzing...' : 'Identify waste with AI'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {ai && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-xl bg-violet-400/10 border border-violet-400/30 text-sm">
                <div className="flex items-center gap-2 font-semibold text-violet-200"><Sparkles size={16} /> AI result: {ai.category} waste ({ai.confidence}%)</div>
                <p className="text-slate-300 mt-1">{ai.tip}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-300">Pin location (click on map)</span>
            <button type="button" onClick={myLocation} className="flex items-center gap-1 text-emerald-300 text-sm font-semibold"><LocateFixed size={16} /> Use my location</button>
          </div>
          <LocationPicker value={loc} onChange={setLoc} />
        </div>

        <button disabled={busy} className="btn btn-primary w-full">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} {busy ? 'Submitting...' : 'Submit complaint'}
        </button>
      </form>
    </PageWrap>
  );
}
