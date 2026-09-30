import mongoose from 'mongoose';

export const WASTE_TYPES = ['wet', 'dry', 'hazardous', 'e-waste'];
export const PICKUP_STATUSES = ['Pending', 'Scheduled', 'Completed'];

const pickupSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  address: { type: String, required: true, trim: true, maxlength: 200 },
  wasteType: { type: String, enum: WASTE_TYPES, required: true },
  slot: { type: Date, required: true },
  status: { type: String, enum: PICKUP_STATUSES, default: 'Pending' },
}, { timestamps: true });
export default mongoose.model('PickupRequest', pickupSchema);
