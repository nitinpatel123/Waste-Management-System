import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import { UPLOAD_DIR } from './middleware/upload.js';
import { notFound, errorHandler } from './middleware/error.js';
import { sanitizeInput, globalLimiter } from './middleware/security.js';
import authRoutes from './routes/auth.js';
import complaintRoutes from './routes/complaints.js';
import pickupRoutes from './routes/pickups.js';
import notifRoutes from './routes/notifications.js';
import aiRoutes from './routes/ai.js';
import adminRoutes from './routes/admin.js';
import publicRoutes from './routes/public.js';

const isProd = process.env.NODE_ENV === 'production';

// ---- Startup checks ----
const missing = ['MONGO_URI', 'JWT_SECRET'].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing in server/.env: ${missing.join(', ')}`);
  process.exit(1);
}
const weakSecret = process.env.JWT_SECRET.length < 32 || /changeThis|secret123|your_/i.test(process.env.JWT_SECRET);
if (weakSecret) {
  const help = 'Generate one with: npm run gen-secret  (then paste it as JWT_SECRET in server/.env)';
  if (isProd) { console.error(`JWT_SECRET is weak. ${help}`); process.exit(1); }
  console.warn(`\n[security] JWT_SECRET is weak. Fine for local testing, NOT for a real website.\n           ${help}\n`);
}

await connectDB();
const app = express();

if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1); // behind Nginx / Render / Railway
app.disable('x-powered-by');

// ---- Security headers ----
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
      'img-src': ["'self'", 'data:', 'blob:', 'https://tile.openstreetmap.org', 'https://*.tile.openstreetmap.org'],
      'connect-src': ["'self'"],
      'object-src': ["'none'"],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'upgrade-insecure-requests': process.env.FORCE_HTTPS === 'true' ? [] : null,
    },
  },
  hsts: isProd && process.env.FORCE_HTTPS === 'true',
  crossOriginEmbedderPolicy: false,
}));

// ---- CORS: only your own site(s) may call the API from a browser ----
const allowed = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => (!origin || allowed.includes(origin) ? cb(null, true) : cb(null, false)),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));

app.use('/api', globalLimiter);
app.use(express.json({ limit: '100kb' }));
app.use(sanitizeInput);

app.use('/uploads', express.static(UPLOAD_DIR, {
  index: false, dotfiles: 'deny', maxAge: '7d',
  setHeaders: (res) => res.setHeader('Content-Disposition', 'inline'),
}));

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/pickups', pickupRoutes);
app.use('/api/notifications', notifRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);
app.use('/api', notFound);

// ---- Production: serve the built React app from the same server (one website, one origin) ----
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(path.join(DIST, 'index.html'))) {
  app.use(express.static(DIST, { index: false, maxAge: '1h' }));
  app.get(/^(?!\/api|\/uploads).*/, (req, res) => res.sendFile(path.join(DIST, 'index.html')));
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}${fs.existsSync(DIST) ? ' (serving client build)' : ''}`));
