# Phase 3: Profile, pro admin panel, security, AI fix, hideable sidebar

## 1. AI error fixed
`The model llama-3.3-70b-versatile does not exist or you do not have access to it`
is NOT a key problem. Groq shut that model down on 16 Aug 2026. The vision model used by the
waste classifier (`llama-4-scout`) was shut down on 17 Jul 2026, so it would have failed next.

- Text (admin insights): `openai/gpt-oss-120b`  (fallbacks: qwen3.6-27b, gpt-oss-20b)
- Vision (waste classifier): `qwen/qwen3.6-27b`  (fallback: qwen3.8-27b)
- Old ids left in your `.env` are ignored automatically (with a console warning).
- If every listed model fails, the server asks Groq which models your key can use and tries those.
- Admin insights fall back to rule-based tips if the AI is down, so the box is never empty.
- Update these two lines in `server/.env`:
  `GROQ_TEXT_MODEL=openai/gpt-oss-120b` and `GROQ_MODEL=qwen/qwen3.6-27b`

## 2. Profile
Touch the profile card (bottom of sidebar) or the avatar (top right) to open `/profile`:
details, edit name/phone/address, change password, eco level and rank, recent complaints.

## 3. Professional admin panel
Sidebar sections: Overview, Complaints, Pickups, Users.
- Overview: 8 KPI cards, 14-day trend, status donut, type breakdown, AI insights, hotspot map, latest complaints
- Complaints: search, filters, pagination, detail side panel with timeline, status update + note, CSV export
- Pickups: status counters and one-click status buttons
- Users: search, role filter, block / unblock accounts
- Icons and colour-coded badges for type, priority and status everywhere

## 4. Security
- helmet security headers + strict Content-Security-Policy, HSTS when FORCE_HTTPS=true
- CORS only for `CLIENT_URL`
- Rate limits: global, login/register (12 per 15 min), AI, writes
- NoSQL-injection filter on body, query and params
- Passwords: bcrypt cost 12, min 8 chars with letter + number, timing-safe login
- Password change logs out every other device (token invalidation)
- Public sign-up can no longer create admins (the old ADMIN_KEY hole is removed). Use `npm run create-admin`
- Admin can block users; blocked users cannot log in or use old tokens
- Uploads: real file signature check (not only the browser mimetype), random 16-hex names
- 500 errors no longer leak internal messages; JSON body limit 100 kb
- Server refuses to start in production with a weak JWT_SECRET
- `seed.js` refuses to run in production; demo password is now `Demo@1234`
- One-server production mode: `npm run build` in client, then `npm start` in server serves the site

## 5. Sidebar hide
Button in the sidebar header and in the top bar, or press Ctrl+B (Cmd+B on Mac). Remembered after reload.
