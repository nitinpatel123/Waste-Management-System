import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import ThemeProvider from './context/ThemeContext';
import AuthProvider from './context/AuthContext';
import AppShell from './components/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Auth from './pages/Auth';
import ReportIssue from './pages/ReportIssue';
import PickupRequest from './pages/PickupRequest';
import MyComplaints from './pages/MyComplaints';
import Awareness from './pages/Awareness';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import AdminOverview from './pages/admin/Overview';
import AdminComplaints from './pages/admin/Complaints';
import AdminPickups from './pages/admin/Pickups';
import AdminUsers from './pages/admin/Users';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/awareness" element={<Awareness />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/report" element={<ProtectedRoute><ReportIssue /></ProtectedRoute>} />
        <Route path="/pickup" element={<ProtectedRoute><PickupRequest /></ProtectedRoute>} />
        <Route path="/my-complaints" element={<ProtectedRoute><MyComplaints /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute admin><AdminOverview /></ProtectedRoute>} />
        <Route path="/admin/complaints" element={<ProtectedRoute admin><AdminComplaints /></ProtectedRoute>} />
        <Route path="/admin/pickups" element={<ProtectedRoute admin><AdminPickups /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute admin><AdminUsers /></ProtectedRoute>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          {/* reducedMotion="user": people who turned off animations in their OS get no animations */}
          <MotionConfig reducedMotion="user">
            <AppShell>
              <AnimatedRoutes />
            </AppShell>
            <Toaster
              position="top-center"
              toastOptions={{ style: { background: 'var(--surface-solid)', color: 'var(--ink)', border: '1px solid var(--line-strong)' } }}
            />
          </MotionConfig>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
