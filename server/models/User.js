import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 120 },
  password: { type: String, required: true },
  role: { type: String, enum: ['citizen', 'admin'], default: 'citizen' },
  points: { type: Number, default: 0 },
  phone: { type: String, trim: true, maxlength: 15, default: '' },
  address: { type: String, trim: true, maxlength: 200, default: '' },
  active: { type: Boolean, default: true },          // admin can block an account
  passwordChangedAt: Date,                            // old tokens stop working after a change
  lastLoginAt: Date,
}, { timestamps: true });

export default mongoose.model('User', userSchema);
