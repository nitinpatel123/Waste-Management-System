import { Router } from 'express';
import PickupRequest, { WASTE_TYPES } from '../models/PickupRequest.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/security.js';
import { asyncHandler, httpError } from '../utils/http.js';

const router = Router();

router.post('/', protect, writeLimiter, asyncHandler(async (req, res) => {
  const address = String(req.body.address || '').trim().slice(0, 200);
  const { wasteType } = req.body;
  const slot = new Date(req.body.slot);

  if (!address) throw httpError(400, 'Pickup address is required');
  if (!WASTE_TYPES.includes(wasteType)) throw httpError(400, 'Invalid waste type');
  if (Number.isNaN(slot.getTime())) throw httpError(400, 'Please choose a valid pickup slot');
  if (slot.getTime() < Date.now() - 5 * 60 * 1000) throw httpError(400, 'Pickup slot cannot be in the past');

  const p = await PickupRequest.create({ user: req.user._id, address, wasteType, slot });
  await Notification.create({ user: req.user._id, message: `Pickup request (${wasteType}) submitted` });
  res.status(201).json(p);
}));

router.get('/mine', protect, asyncHandler(async (req, res) => {
  res.json(await PickupRequest.find({ user: req.user._id }).sort('-createdAt'));
}));

export default router;
