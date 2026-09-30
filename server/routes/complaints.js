import { Router } from 'express';
import fs from 'fs';
import Complaint, { COMPLAINT_TYPES } from '../models/Complaint.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { uploadDisk, verifyDiskImage } from '../middleware/upload.js';
import { writeLimiter } from '../middleware/security.js';
import { asyncHandler, httpError } from '../utils/http.js';

const router = Router();
const AI_CATEGORIES = ['wet', 'dry', 'hazardous', 'e-waste', 'mixed'];

// Smart priority: complaint type weight + nearby unresolved complaints (~150m) + hazardous waste
async function computePriority({ type, lat, lng, aiCategory }) {
  let near = 0;
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    const d = 0.0015;
    near = await Complaint.countDocuments({
      status: { $ne: 'Resolved' },
      'location.lat': { $gte: lat - d, $lte: lat + d },
      'location.lng': { $gte: lng - d, $lte: lng + d },
    });
  }
  const weight = { dumping: 3, overflow: 2, roadGarbage: 2, missed: 1 }[type] || 1;
  let score = weight + near * 2;
  if (['hazardous', 'e-waste'].includes(aiCategory)) score += 3;
  return score >= 6 ? 'High' : score >= 3 ? 'Medium' : 'Low';
}

const toNum = (v) => (v === undefined || v === null || v === '' ? undefined : Number(v));

router.post('/', protect, writeLimiter, uploadDisk.single('image'), asyncHandler(async (req, res) => {
  try {
    verifyDiskImage(req.file);
    const { type } = req.body;
    const address = String(req.body.address || '').trim().slice(0, 200);
    const description = String(req.body.description || '').trim().slice(0, 1000);
    const aiCategory = AI_CATEGORIES.includes(req.body.aiCategory) ? req.body.aiCategory : undefined;
    const lat = toNum(req.body.lat);
    const lng = toNum(req.body.lng);

    if (!COMPLAINT_TYPES.includes(type)) throw httpError(400, 'Invalid complaint type');
    if (!description) throw httpError(400, 'Please describe the problem');
    if (lat === undefined || lng === undefined) throw httpError(400, 'Please pin the location on the map');
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)
      throw httpError(400, 'Invalid location');

    const priority = await computePriority({ type, lat, lng, aiCategory });
    const c = await Complaint.create({
      user: req.user._id,
      type,
      description,
      image: req.file ? `/uploads/${req.file.filename}` : '',
      location: { lat, lng, address },
      aiCategory,
      priority,
      timeline: [{ status: 'Pending', note: 'Complaint submitted' }],
    });
    await User.findByIdAndUpdate(req.user._id, { $inc: { points: 10 } });
    await Notification.create({
      user: req.user._id,
      message: `Complaint #${c._id.toString().slice(-6).toUpperCase()} received (+10 eco points)`,
    });
    res.status(201).json(c);
  } catch (e) {
    // Validation failed after the photo was already saved: do not leave orphan files.
    if (req.file) fs.unlink(req.file.path, () => {});
    throw e;
  }
}));

router.get('/mine', protect, asyncHandler(async (req, res) => {
  res.json(await Complaint.find({ user: req.user._id }).sort('-createdAt'));
}));

export default router;
