# CleanCity: Smart Waste Management System (MERN)

Citizens report waste issues (photo + map), book pickups and track complaints live.
Municipal admins get one command center with hotspots, smart priorities and AI insights.

## Features

**Citizens:** register/login, report a complaint (photo, AI waste identify, map pin), pickup request,
complaint tracking with timeline, eco points + levels + leaderboard, notifications, profile page, waste awareness.

**Admins:** overview dashboard (KPIs, 14-day trend, status/type charts, hotspot map, AI insights),
complaints (search, filters, status update with note, CSV export), pickups, users (block, delete, add admin).

**Smart parts:**
- Priority scoring: complaint type + unresolved complaints within ~150 m + hazardous/e-waste (AI) -> High / Medium / Low.
- AI Waste Classifier (Groq vision) and AI Insights for admin (Groq, with rule-based fallback).
- Dark/light theme, hideable sidebar (Ctrl+B / Cmd+B), mobile drawer.

## Setup

Node 20.19+ for the client, Node 18+ for the server, MongoDB running.

### Server
```bash
cd server
npm install
cp .env.example .env        # then edit .env (skip if you already have one)
npm run gen-secret          # paste the output as JWT_SECRET in .env
# put your GROQ_API_KEY in .env
# GROQ_TEXT_MODEL=openai/gpt-oss-120b
# GROQ_MODEL=qwen/qwen3.6-27b
npm run seed                # demo data: admin@demo.com / user@demo.com (password Demo@1234)
npm run dev
```

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
cd ../server   # set NODE_ENV=production, CLIENT_URL, app.set('trust proxy', 1); (behind a proxy) in .env
npm start
```

## Admin management

Public sign-up always creates a citizen. Admins are created in one of these ways:

| Task | How |
|---|---|
| Create an admin (repeat for as many as you need) | `npm run create-admin -- "Name" you@example.com "StrongPass123"` |
| Create an admin from the panel | Admin panel -> Users -> **Add admin** |
| Delete an admin from the panel | Admin panel -> Users -> **Delete** |
| Delete an admin from the terminal | `npm run delete-admin -- admin@example.com` |
| Only remove admin power (keep account) | `npm run delete-admin -- admin@example.com --demote` |

Rules: you cannot delete your own account, and the last remaining admin can never be deleted.
If the email already exists, `create-admin` turns that user into an admin and resets the password.

## Security

- helmet headers + strict CSP, CORS only for `CLIENT_URL`, rate limits (global, login/register, AI, writes)
- NoSQL-injection filter, bcrypt cost 12, password min 8 chars with letter + number, timing-safe login
- Password change logs out all other devices; blocked users cannot log in or use old tokens
- Uploads: real file signature check, random file names, 5 MB limit, images only
- 500 errors do not leak internals; server refuses to start in production with a weak `JWT_SECRET`
- `seed.js` refuses to run in production

## Groq models (important)

`llama-3.3-70b-versatile` (shut down 16 Aug 2026) and `llama-4-scout` (shut down 17 Jul 2026) no longer work.
Use `openai/gpt-oss-120b` for text and `qwen/qwen3.6-27b` for vision. Old ids in `.env` are ignored with a warning.
If every listed model fails, the server asks Groq which models your key can use. Admin insights fall back to rule-based tips.

## Demo flow
1. Citizen: report complaint (photo, AI identify, pin map) -> +10 points, priority auto-set
2. Admin (incognito): dashboard, AI insights, hotspots -> change status with note
3. Citizen: bell notification, animated timeline, +20 points on resolve, leaderboard

## Project history

**Phase 1: bug fixes.** Async error handling, input validation on complaints/pickups/admin updates, eco-points
exploit fixed (`pointsAwarded` flag), safe uploads, email normalisation, AI output cleaning, startup checks,
`/api/health`, CSV export fixes (commas, formula injection), map tiles switched to key-free OpenStreetMap.

**Phase 2: design.** CSS design tokens, dark/light toggle (saved in localStorage, no flash), sidebar dashboard layout,
notification bell in the topbar, new landing page, footer, polish (focus rings, scrollbars, reduced motion).

**Phase 3: profile, admin panel, security.** Profile page, full admin panel (Overview, Complaints, Pickups, Users),
security hardening, AI model fix, hideable sidebar. Later: add/delete admins, Awareness cards open independently.