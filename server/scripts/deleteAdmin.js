// Usage: npm run delete-admin -- admin@example.com
//   Deletes the admin account completely.
// Usage: npm run delete-admin -- admin@example.com --demote
//   Keeps the account but turns it into a normal citizen.
import 'dotenv/config';
import connectDB from '../config/db.js';
import User from '../models/User.js';

const args = process.argv.slice(2);
const demote = args.includes('--demote');
const email = (args.find((a) => !a.startsWith('--')) || '').trim().toLowerCase();
if (!email) {
  console.error('Usage: npm run delete-admin -- admin@example.com [--demote]');
  process.exit(1);
}

await connectDB();
const u = await User.findOne({ email });
if (!u) { console.error(`No user found with email ${email}`); process.exit(1); }
if (u.role !== 'admin') { console.error(`${email} is not an admin.`); process.exit(1); }
if ((await User.countDocuments({ role: 'admin' })) <= 1) {
  console.error('This is the last admin. Create another admin first (npm run create-admin), then delete this one.');
  process.exit(1);
}

if (demote) {
  u.role = 'citizen';
  u.passwordChangedAt = new Date(); // old admin sessions stop working
  await u.save();
  console.log(`${email} is now a normal citizen.`);
} else {
  await u.deleteOne();
  console.log(`Admin deleted: ${email}`);
}
process.exit(0);