# Phase 1: Bug fixes

## Backend
1. Server could crash on one bad request (async routes had no error handling). Added asyncHandler + central error middleware.
2. Invalid status in admin update (complaint or pickup) crashed the server or returned wrong data. Now validated.
3. Pickup update on a missing id crashed (null.user). Now returns 404.
4. Eco points exploit: re-opening and re-resolving a complaint gave +20 again and again. Added `pointsAwarded` flag.
5. Upload folder path depended on where you started the server. Now absolute path.
6. Any file type could be uploaded. Now images only, safe random file names, 5 MB limit.
7. Orphan photos were left on disk when validation failed. Now deleted.
8. Complaint had no validation (type, description, location). Added.
9. Pickup slot could be in the past or invalid. Added checks.
10. Email was not normalised (Test@x.com vs test@x.com), no password length check. Fixed.
11. AI output was trusted blindly. Now cleaned (category, confidence, tip). Clear message when GROQ_API_KEY is missing. 25s timeout.
12. Server started even if MONGO_URI/JWT_SECRET missing, and Mongo errors were unfriendly. Added checks and clear messages.
13. Added /api/health, 404 handler, JSON limit.
14. seed.js only cleared complaints; now also clears demo pickups and notifications, spreads dates, adds demo pickups.

## Frontend
1. Map reset zoom on every click in Report page (map re-mounted). Fixed.
2. Server offline logged the user out (any error removed token). Now only a 401 does.
3. Expired token left broken pages. Added 401 interceptor.
4. Login redirect ignored the page you wanted. Now returns you there.
5. Leaderboard highlighted by name (two users with same name both highlighted). Now by id.
6. Admin dashboard spun forever if the API failed. Now shows error + retry.
7. Actions without try/catch (status update, pickup update, load lists) now show proper messages.
8. CSV export broke on commas in names and allowed Excel formula injection. Fixed, UTF-8 BOM added.
9. Image preview memory leak fixed, file type and size checked before upload.
10. Geolocation support check, past-date blocked in pickup form, min password length in form.
11. Notification bell closes when you click outside.
12. Node version: Vite 7 needs Node 20.19+, README said 18+. Fixed.
13. Map showed "API KEY REQUIRED" (CARTO dark tiles now need a key). Switched to key-free OpenStreetMap tiles with a CSS dark filter.
