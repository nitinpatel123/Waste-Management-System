import { Router } from 'express';
import Complaint from '../models/Complaint.js';
import PickupRequest from '../models/PickupRequest.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

router.get('/stats', asyncHandler(async (req, res) => {
  const [total, resolved, citizens, pickups] = await Promise.all([
    Complaint.countDocuments(),
    Complaint.countDocuments({ status: 'Resolved' }),
    User.countDocuments({ role: 'citizen' }),
    PickupRequest.countDocuments(),
  ]);
  res.json({ total, resolved, citizens, pickups });
}));

router.get('/leaderboard', asyncHandler(async (req, res) => {
  const top = await User.find({ role: 'citizen', active: { $ne: false } }).sort('-points').limit(10).select('name points');
  res.json(top);
}));

export default router;
