import mongoose from 'mongoose';

export const COMPLAINT_TYPES = ['overflow', 'roadGarbage', 'missed', 'dumping'];
export const COMPLAINT_STATUSES = ['Pending', 'In Progress', 'Resolved'];

const complaintSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: COMPLAINT_TYPES, required: true },
  description: { type: String, trim: true, maxlength: 1000 },
  image: String,
  location: { lat: Number, lng: Number, address: { type: String, trim: true, maxlength: 200 } },
  aiCategory: String,
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  status: { type: String, enum: COMPLAINT_STATUSES, default: 'Pending', index: true },
  // Prevents the "+20 points" reward from being given twice for one complaint.
  pointsAwarded: { type: Boolean, default: false },
  resolvedAt: Date,
  timeline: [{ status: String, note: String, at: { type: Date, default: Date.now } }],
}, { timestamps: true });

export default mongoose.model('Complaint', complaintSchema);
