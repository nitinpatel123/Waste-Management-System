// Applies the saved theme before the page paints (prevents a flash).
// Kept as a separate file so the strict Content-Security-Policy can stay "script-src 'self'".
try { document.documentElement.dataset.theme = localStorage.getItem('theme') || 'dark'; } catch (e) {}
