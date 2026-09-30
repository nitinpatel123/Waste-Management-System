import mongoose from 'mongoose';
const notifSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: String,
  read: { type: Boolean, default: false },
}, { timestamps: true });
export default mongoose.model('Notification', notifSchema);
