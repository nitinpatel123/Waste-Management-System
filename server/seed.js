import 'dotenv/config';
import bcrypt from 'bcryptjs';
import connectDB from './config/db.js';
import User from './models/User.js';
import Complaint from './models/Complaint.js';
import PickupRequest from './models/PickupRequest.js';
import Notification from './models/Notification.js';

if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
  console.error('Refusing to seed in production: demo accounts have a known password. Use "npm run create-admin" instead.');
  process.exit(1);
}

await connectDB();

// Clean old demo data (only demo users' data is removed)
const oldDemo = await User.find({ email: { $regex: '@demo\\.com$' } }).select('_id');
const oldIds = oldDemo.map((u) => u._id);
await Complaint.deleteMany({});
await PickupRequest.deleteMany({ user: { $in: oldIds } });
await Notification.deleteMany({ user: { $in: oldIds } });
await User.deleteMany({ _id: { $in: oldIds } });

const DEMO_PASSWORD = 'Demo@1234';
const pw = await bcrypt.hash(DEMO_PASSWORD, 12);
await User.create({ name: 'Demo Admin', email: 'admin@demo.com', password: pw, role: 'admin' });
const user = await User.create({ name: 'Demo User', email: 'user@demo.com', password: pw, points: 120 });

const extra = [['Aarav Sharma', 340], ['Priya Singh', 265], ['Rohan Verma', 190], ['Sneha Gupta', 85], ['Vikas Yadav', 40]];
for (const [name, points] of extra) {
  await User.create({ name, email: `${name.split(' ')[0].toLowerCase()}@demo.com`, password: pw, points });
}

const types = ['overflow', 'roadGarbage', 'missed', 'dumping'];
const statuses = ['Pending', 'In Progress', 'Resolved'];
const priorities = ['High', 'Medium', 'Low'];
const centers = [[26.4499, 80.3319], [26.467, 80.35], [26.43, 80.31]];
const DAY = 24 * 60 * 60 * 1000;

const docs = Array.from({ length: 16 }, (_, i) => {
  const c = centers[i % 3];
  const status = statuses[i % 3];
  const createdAt = new Date(Date.now() - (16 - i) * DAY * 0.8); // spread over ~2 weeks
  return {
    user: user._id,
    type: types[i % 4],
    description: `Demo complaint ${i + 1}`,
    priority: priorities[(i * 7) % 3],
    location: { lat: c[0] + (Math.random() - 0.5) * 0.002, lng: c[1] + (Math.random() - 0.5) * 0.002, address: 'Demo area' },
    status,
    pointsAwarded: status === 'Resolved',
    resolvedAt: status === 'Resolved' ? new Date(createdAt.getTime() + DAY) : undefined,
    createdAt,
    timeline: [
      { status: 'Pending', note: 'Complaint submitted', at: createdAt },
      ...(status !== 'Pending' ? [{ status, note: `Marked ${status}`, at: new Date(createdAt.getTime() + DAY) }] : []),
    ],
  };
});
await Complaint.insertMany(docs);

await PickupRequest.insertMany([
  { user: user._id, address: '12 Civil Lines', wasteType: 'wet', slot: new Date(Date.now() + DAY), status: 'Scheduled' },
  { user: user._id, address: '45 Swaroop Nagar', wasteType: 'e-waste', slot: new Date(Date.now() + 3 * DAY), status: 'Pending' },
]);

console.log(`Seeded! admin@demo.com / user@demo.com (password: ${DEMO_PASSWORD})`);
process.exit(0);
