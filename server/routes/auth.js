import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import PickupRequest from '../models/PickupRequest.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/security.js';
import { asyncHandler, httpError } from '../utils/http.js';

const router = Router();
const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' });
const pack = (u) => ({
  id: u._id, name: u.name, email: u.email, role: u.role, points: u.points || 0,
  phone: u.phone || '', address: u.address || '', createdAt: u.createdAt, lastLoginAt: u.lastLoginAt,
});
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9 ]{7,15}$/;
const cleanEmail = (e) => String(e || '').trim().toLowerCase();
const str = (v, max) => String(v ?? '').trim().slice(0, max);

// At least 8 characters with a letter and a number.
export const checkPassword = (pw) => {
  const p = String(pw || '');
  if (p.length < 8) throw httpError(400, 'Password must be at least 8 characters');
  if (p.length > 72) throw httpError(400, 'Password is too long (max 72 characters)');
  if (!/[A-Za-z]/.test(p) || !/[0-9]/.test(p)) throw httpError(400, 'Password must contain a letter and a number');
};

// Compared when the email does not exist, so response time does not reveal which emails are registered.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

router.post('/register', authLimiter, asyncHandler(async (req, res) => {
  const name = str(req.body.name, 60);
  const email = cleanEmail(req.body.email);
  const { password } = req.body;

  if (!name || !email || !password) throw httpError(400, 'Please fill in all fields');
  if (!EMAIL_RE.test(email)) throw httpError(400, 'Please enter a valid email');
  checkPassword(password);
  if (await User.findOne({ email })) throw httpError(400, 'Email already registered');

  // Public sign-up always creates a citizen. Admins are created with `npm run create-admin`.
  const user = await User.create({ name, email, password: await bcrypt.hash(String(password), 12), role: 'citizen' });
  res.status(201).json({ token: sign(user._id), user: pack(user) });
}));

router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const email = cleanEmail(req.body.email);
  const user = await User.findOne({ email });
  const ok = await bcrypt.compare(String(req.body.password || ''), user ? user.password : DUMMY_HASH);
  if (!user || !ok) throw httpError(400, 'Wrong email or password');
  if (user.active === false) throw httpError(403, 'This account has been blocked. Contact the administrator.');
  user.lastLoginAt = new Date();
  await user.save();
  res.json({ token: sign(user._id), user: pack(user) });
}));

router.get('/me', protect, (req, res) => res.json(pack(req.user)));

// Profile page data: user + personal activity numbers
router.get('/profile', protect, asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const [complaints, resolved, pending, pickups, recent] = await Promise.all([
    Complaint.countDocuments({ user: uid }),
    Complaint.countDocuments({ user: uid, status: 'Resolved' }),
    Complaint.countDocuments({ user: uid, status: { $ne: 'Resolved' } }),
    PickupRequest.countDocuments({ user: uid }),
    Complaint.find({ user: uid }).sort('-createdAt').limit(5).select('type status priority createdAt'),
  ]);
  const rank = req.user.role === 'citizen'
    ? 1 + await User.countDocuments({ role: 'citizen', active: { $ne: false }, points: { $gt: req.user.points || 0 } })
    : null;
  res.json({ user: pack(req.user), stats: { complaints, resolved, pending, pickups, rank }, recent });
}));

router.put('/profile', protect, asyncHandler(async (req, res) => {
  const name = str(req.body.name, 60);
  const phone = str(req.body.phone, 15);
  const address = str(req.body.address, 200);
  if (!name) throw httpError(400, 'Name is required');
  if (phone && !PHONE_RE.test(phone)) throw httpError(400, 'Please enter a valid phone number');
  req.user.name = name; req.user.phone = phone; req.user.address = address;
  await req.user.save();
  res.json(pack(req.user));
}));

router.put('/password', protect, authLimiter, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const me = await User.findById(req.user._id);
  if (!(await bcrypt.compare(String(currentPassword || ''), me.password))) throw httpError(400, 'Current password is wrong');
  checkPassword(newPassword);
  if (String(newPassword) === String(currentPassword)) throw httpError(400, 'New password must be different');
  me.password = await bcrypt.hash(String(newPassword), 12);
  me.passwordChangedAt = new Date();
  await me.save();
  // Fresh token for this device; every older token is now invalid.
  res.json({ token: sign(me._id), message: 'Password changed' });
}));

export default router;
