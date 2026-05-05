import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Predictor from './pages/Predictor';
import Documents from './pages/Documents';
import Institute from './pages/Institute';
import StudentDashboard from './pages/StudentDashboard';
import CounselorDashboard from './pages/CounselorDashboard';
import AboutCounselor from './pages/AboutCounselor';
import OnlineGuidance from './pages/OnlineGuidance';
import Auth from './pages/Auth';
import Pricing from './pages/Pricing';
import './index.css';

console.log("Laxmi Education: Initializing React App...");

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="auth" element={<Auth />} />
          <Route path="predictor" element={<Predictor />} />
          <Route path="online-guidance" element={<OnlineGuidance />} />
          <Route path="documents" element={<Documents />} />
          <Route path="institute" element={<Institute />} />
          <Route path="settings" element={<StudentDashboard />} />
          <Route path="counselor" element={<CounselorDashboard />} />
          <Route path="about" element={<AboutCounselor />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
