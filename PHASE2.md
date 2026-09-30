# Phase 2: Design system, theme, layout, landing page

## What is new
1. **Design tokens** (client/src/index.css): all colours live in CSS variables. Dark is default, light mode via `<html data-theme="light">`.
2. **Dark / Light toggle** (ThemeContext + ThemeToggle). Choice is saved in localStorage. A small script in index.html applies it before first paint (no flash).
3. **Old pages work in light mode automatically**: in light mode the Tailwind colours (slate, emerald, amber ...) are re-mapped, so no page had to be rewritten.
4. **Sidebar dashboard layout** for logged-in users (AppShell, Sidebar, Topbar). Mobile gets a slide-in drawer. Guests get a clean top navbar.
5. **Sidebar shows** the user card, eco level progress (citizens) and logout. Admin gets an admin menu.
6. **Notification bell** moved to the topbar (own component, click outside closes, no overflow on phones).
7. **New landing page**: hero with dashboard preview, live stats with skeleton loading, feature bento grid, how it works, audience split, final call to action.
8. **Polish**: focus rings, slim scrollbars, selection colour, reduced-motion support, footer, map + charts + toasts follow the theme.

## Files changed
New: context/ThemeContext.jsx, components/{AppShell,Sidebar,Topbar,PublicNav,Footer,Logo,ThemeToggle,NotificationBell}.jsx
Rewritten: index.css, App.jsx, pages/Home.jsx
Edited: index.html, components/PageWrap.jsx, pages/AdminDashboard.jsx (theme colours only)
Removed: components/Navbar.jsx (replaced by Sidebar + Topbar + PublicNav)
