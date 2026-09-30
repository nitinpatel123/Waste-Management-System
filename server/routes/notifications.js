import { Router } from 'express';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();
router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
  res.json(await Notification.find({ user: req.user._id }).sort('-createdAt').limit(20));
}));

router.put('/read', asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ ok: true });
}));

export default router;
