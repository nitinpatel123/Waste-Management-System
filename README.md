# CleanCity: Smart Waste Management System (MERN)

Core: Register/Login, Report Waste Issues (photo + map), Pickup Request, Complaint Tracking,
Admin Dashboard, Waste Awareness.

Also: profile page, hideable sidebar, full admin panel (overview, complaints, pickups, users), security hardening (see PHASE3.md).

Advanced: AI Waste Classifier (Groq vision), AI Insights for admin (Groq), smart complaint
priority scoring, hotspot map, eco points + levels + leaderboard, in-app notifications,
live public impact stats, CSV export. Professional civic-tech UI: dark/light theme, sidebar dashboard layout, Lucide icons and Framer Motion.

## Setup (Node 20.19+ for the client, Node 18+ for the server, MongoDB running)

### Server
```bash
cd server
npm install
cp .env.example .env        # then edit .env (skip if you already have one)
npm run gen-secret          # paste the output as JWT_SECRET in .env
# put your GROQ_API_KEY in .env; keep GROQ_TEXT_MODEL=openai/gpt-oss-120b and GROQ_MODEL=qwen/qwen3.6-27b
npm run seed                # demo data: admin@demo.com / user@demo.com (password Demo@1234)
npm run dev
```
Real admin (no demo data): `npm run create-admin -- "Your Name" you@example.com "StrongPass123"`

### Client (new terminal)
```bash
cd client
npm install
npm run dev
```
Open http://localhost:5173

### Deploy as one website
```bash
cd client && npm run build
cd ../server   # set NODE_ENV=production, CLIENT_URL, TRUST_PROXY=1 (behind a proxy) in .env
npm start
```

## Demo flow
1. Citizen: report complaint (photo, AI identify, pin map) -> gets +10 points, priority auto-set
2. Admin (incognito): dashboard, AI insights, hotspots -> change status with note
3. Citizen: bell notification, animated timeline, +20 points on resolve, leaderboard
