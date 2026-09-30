// Usage: npm run create-admin -- "Full Name" admin@example.com "StrongPass123"
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import { checkPassword } from '../routes/auth.js';

const [name, emailRaw, password] = process.argv.slice(2);
if (!name || !emailRaw || !password) {
  console.error('Usage: npm run create-admin -- "Full Name" admin@example.com "StrongPass123"');
  process.exit(1);
}
const email = emailRaw.trim().toLowerCase();
try { checkPassword(password); } catch (e) { console.error(e.message); process.exit(1); }

await connectDB();
const hash = await bcrypt.hash(password, 12);
const existing = await User.findOne({ email });
if (existing) {
  existing.role = 'admin'; existing.password = hash; existing.active = true; existing.passwordChangedAt = new Date();
  await existing.save();
  console.log(`Updated existing user ${email} -> admin (password reset).`);
} else {
  await User.create({ name, email, password: hash, role: 'admin' });
  console.log(`Admin created: ${email}`);
}
process.exit(0);
