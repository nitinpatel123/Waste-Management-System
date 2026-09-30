import { Router } from 'express';
import Complaint, { COMPLAINT_STATUSES, COMPLAINT_TYPES } from '../models/Complaint.js';
import PickupRequest, { PICKUP_STATUSES } from '../models/PickupRequest.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { checkPassword } from './auth.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/security.js';
import { asyncHandler, httpError } from '../utils/http.js';
import { groqJSON, aiConfigured } from '../utils/groq.js';

const router = Router();
router.use(protect, adminOnly);

const PRIORITIES = ['High', 'Medium', 'Low'];
const DAY = 24 * 60 * 60 * 1000;
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const page = (v, def, max) => Math.min(max, Math.max(1, parseInt(v, 10) || def));

async function getStats() {
  const since = new Date(Date.now() - 13 * DAY);
  since.setHours(0, 0, 0, 0);

  const [byStatus, byType, byPriority, hotspots, total, pickups, users, resolvedDocs, daily, highOpen] = await Promise.all([
    Complaint.aggregate([{ $group: { _id: '$status', value: { $sum: 1 } } }]),
    Complaint.aggregate([{ $group: { _id: '$type', value: { $sum: 1 } } }]),
    Complaint.aggregate([{ $group: { _id: '$priority', value: { $sum: 1 } } }]),
    Complaint.aggregate([
      { $match: { 'location.lat': { $type: 'number' }, status: { $ne: 'Resolved' } } },
      { $group: {
          _id: { lat: { $round: ['$location.lat', 3] }, lng: { $round: ['$location.lng', 3] } },
          count: { $sum: 1 },
      } },
      { $sort: { count: -1 } },
      { $limit: 100 },
    ]),
    Complaint.countDocuments(),
    PickupRequest.countDocuments(),
    User.countDocuments({ role: 'citizen' }),
    Complaint.find({ status: 'Resolved', resolvedAt: { $exists: true } }).select('createdAt resolvedAt').limit(500),
    Complaint.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, value: { $sum: 1 } } },
    ]),
    Complaint.countDocuments({ priority: 'High', status: { $ne: 'Resolved' } }),
  ]);

  const map = (arr) => arr.map((x) => ({ name: x._id, value: x.value }));
  const resolved = byStatus.find((x) => x._id === 'Resolved')?.value || 0;
  const avgHours = resolvedDocs.length
    ? Math.round(resolvedDocs.reduce((a, c) => a + (c.resolvedAt - c.createdAt), 0) / resolvedDocs.length / 36e5)
    : 0;

  // Last 14 days, days without complaints count as 0
  const dayMap = Object.fromEntries(daily.map((d) => [d._id, d.value]));
  const trend = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(since.getTime() + i * DAY);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { date: key, label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), value: dayMap[key] || 0 };
  });

  return {
    total, pickups, users, highOpen, avgHours,
    resolutionRate: total ? Math.round((resolved / total) * 100) : 0,
    byStatus: map(byStatus), byType: map(byType), byPriority: map(byPriority), trend,
    hotspots: hotspots.map((h) => ({ lat: h._id.lat, lng: h._id.lng, count: h.count })),
  };
}

router.get('/stats', asyncHandler(async (req, res) => res.json(await getStats())));

// Simple rules used when the AI is not available, so the dashboard never shows an empty box.
function ruleInsights(s) {
  const n = (name) => s.byStatus.find((x) => x.name === name)?.value || 0;
  const top = [...s.byType].sort((a, b) => b.value - a.value)[0];
  const list = [];
  if (!s.total) return ['No complaints yet. Encourage citizens to report issues so trends can be analysed.'];
  list.push(`${n('Pending')} complaints are still pending and ${s.highOpen} of the open ones are high priority. Assign crews to high priority items first.`);
  if (top) list.push(`"${top.name}" is the most common complaint type (${top.value} of ${s.total}). Consider a targeted drive for it.`);
  if (s.hotspots[0]) list.push(`The biggest hotspot has ${s.hotspots[0].count} open complaint(s). Schedule a cleanup and extra bin pickups in that area.`);
  else list.push(`Resolution rate is ${s.resolutionRate}%${s.avgHours ? ` with an average fix time of ${s.avgHours} hours` : ''}. Aim to move pending items to In Progress quickly.`);
  return list;
}

// AI insights for the admin. Falls back to rule-based tips if the AI is unavailable.
router.post('/insights', aiLimiter, asyncHandler(async (req, res) => {
  const s = await getStats();
  if (!aiConfigured()) {
    return res.json({ insights: ruleInsights(s), source: 'rules', notice: 'AI is not configured. Showing rule-based tips. Add GROQ_API_KEY for AI insights.' });
  }
  const summary = {
    total: s.total, pickups: s.pickups, resolutionRate: s.resolutionRate, avgResolveHours: s.avgHours,
    highPriorityOpen: s.highOpen, byStatus: s.byStatus, byType: s.byType,
    byPriority: s.byPriority, topOpenHotspots: s.hotspots.slice(0, 5),
  };
  try {
    const out = await groqJSON({
      kind: 'text',
      temperature: 0.4,
      max_tokens: 1200,
      messages: [
        { role: 'system', content: 'You are a smart-city waste management analyst. Reply in simple English.' },
        { role: 'user', content: `Data: ${JSON.stringify(summary)}\nGive exactly 3 short, actionable insights for the municipal admin. Reply ONLY as JSON: {"insights":["...","...","..."]}` },
      ],
    });
    const insights = Array.isArray(out.insights) ? out.insights.map((x) => String(x).slice(0, 300)).slice(0, 5) : [];
    if (!insights.length) throw httpError(502, 'AI returned no insights');
    res.json({ insights, source: 'ai' });
  } catch (e) {
    res.json({ insights: ruleInsights(s), source: 'rules', notice: `${e.message} Showing rule-based tips instead.` });
  }
}));

router.get('/complaints', asyncHandler(async (req, res) => {
  const q = {};
  const { status, type, priority } = req.query;
  if (COMPLAINT_STATUSES.includes(status)) q.status = status;
  if (COMPLAINT_TYPES.includes(type)) q.type = type;
  if (PRIORITIES.includes(priority)) q.priority = priority;

  const search = String(req.query.q || '').trim().slice(0, 60);
  if (search) {
    const rx = new RegExp(esc(search), 'i');
    const users = await User.find({ $or: [{ name: rx }, { email: rx }] }).select('_id').limit(50);
    q.$or = [{ description: rx }, { 'location.address': rx }, { user: { $in: users.map((u) => u._id) } }];
  }

  const limit = page(req.query.limit, 10, 50);
  const pg = page(req.query.page, 1, 10000);
  const [items, total] = await Promise.all([
    Complaint.find(q).populate('user', 'name email').sort('-createdAt').skip((pg - 1) * limit).limit(limit),
    Complaint.countDocuments(q),
  ]);
  res.json({ items, total, page: pg, pages: Math.max(1, Math.ceil(total / limit)) });
}));

// Full list for CSV export (respects the same filters, max 2000 rows)
router.get('/complaints/export', asyncHandler(async (req, res) => {
  const q = {};
  const { status, type, priority } = req.query;
  if (COMPLAINT_STATUSES.includes(status)) q.status = status;
  if (COMPLAINT_TYPES.includes(type)) q.type = type;
  if (PRIORITIES.includes(priority)) q.priority = priority;
  res.json(await Complaint.find(q).populate('user', 'name email').sort('-createdAt').limit(2000));
}));

router.patch('/complaints/:id', asyncHandler(async (req, res) => {
  const { status } = req.body;
  const note = String(req.body.note || '').trim().slice(0, 300);
  if (!COMPLAINT_STATUSES.includes(status)) throw httpError(400, 'Invalid status');

  const c = await Complaint.findById(req.params.id);
  if (!c) throw httpError(404, 'Complaint not found');
  if (c.status === status) throw httpError(400, `Complaint is already "${status}"`);

  c.status = status;
  c.timeline.push({ status, note: note || `Status: ${status}` });

  let giveReward = false;
  if (status === 'Resolved') {
    c.resolvedAt = new Date();
    // Reward only once per complaint, even if it is re-opened and resolved again.
    if (!c.pointsAwarded) { c.pointsAwarded = true; giveReward = true; }
  }
  await c.save();

  let msg = `Complaint #${c._id.toString().slice(-6).toUpperCase()} is now "${status}"${note ? ': ' + note : ''}`;
  if (giveReward) {
    await User.findByIdAndUpdate(c.user, { $inc: { points: 20 } });
    msg += ' (+20 eco points)';
  }
  await Notification.create({ user: c.user, message: msg });
  res.json(c);
}));

router.get('/pickups', asyncHandler(async (req, res) => {
  const q = {};
  if (PICKUP_STATUSES.includes(req.query.status)) q.status = req.query.status;
  res.json(await PickupRequest.find(q).populate('user', 'name email').sort('-createdAt').limit(500));
}));

router.patch('/pickups/:id', asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!PICKUP_STATUSES.includes(status)) throw httpError(400, 'Invalid status');
  const p = await PickupRequest.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!p) throw httpError(404, 'Pickup request not found');
  await Notification.create({ user: p.user, message: `Your pickup request is now "${p.status}"` });
  res.json(p);
}));

// ---- Users ----
router.get('/users', asyncHandler(async (req, res) => {
  const q = {};
  if (['citizen', 'admin'].includes(req.query.role)) q.role = req.query.role;
  const search = String(req.query.q || '').trim().slice(0, 60);
  if (search) { const rx = new RegExp(esc(search), 'i'); q.$or = [{ name: rx }, { email: rx }]; }

  const users = await User.find(q).select('-password').sort('-createdAt').limit(300).lean();
  const counts = await Complaint.aggregate([{ $group: { _id: '$user', n: { $sum: 1 } } }]);
  const byUser = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  res.json(users.map((u) => ({ ...u, complaints: byUser[String(u._id)] || 0 })));
}));

router.patch('/users/:id/active', asyncHandler(async (req, res) => {
  const active = Boolean(req.body.active);
  if (String(req.params.id) === String(req.user._id)) throw httpError(400, 'You cannot block your own account');
  const u = await User.findById(req.params.id);
  if (!u) throw httpError(404, 'User not found');
  if (u.role === 'admin') throw httpError(400, 'Admin accounts cannot be blocked here');
  u.active = active;
  await u.save();
  res.json({ id: u._id, active: u.active });
}));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Create a new admin (only an existing admin can do this). You can add as many admins as you want.
router.post('/users/admin', asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim().slice(0, 60);
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = req.body.password;
  if (!name || !email || !password) throw httpError(400, 'Please fill in all fields');
  if (!EMAIL_RE.test(email)) throw httpError(400, 'Please enter a valid email');
  checkPassword(password);
  if (await User.findOne({ email })) throw httpError(400, 'Email already registered');
  const u = await User.create({ name, email, password: await bcrypt.hash(String(password), 12), role: 'admin' });
  res.status(201).json({ id: u._id, name: u.name, email: u.email, role: u.role });
}));

// Delete an account. An admin can delete other admins, but never their own account,
// and the last remaining admin can never be deleted (otherwise nobody could log in to the panel).
router.delete('/users/:id', asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) throw httpError(400, 'You cannot delete your own account');
  const u = await User.findById(req.params.id);
  if (!u) throw httpError(404, 'User not found');
  if (u.role === 'admin' && (await User.countDocuments({ role: 'admin' })) <= 1)
    throw httpError(400, 'Cannot delete the last admin');
  await Promise.all([
    Notification.deleteMany({ user: u._id }),
    // Citizen data is kept unless the request says otherwise, so complaint history is not lost by accident.
    ...(req.query.withData === 'true' ? [Complaint.deleteMany({ user: u._id }), PickupRequest.deleteMany({ user: u._id })] : []),
  ]);
  await u.deleteOne();
  res.json({ message: 'User deleted' });
}));

export default router;