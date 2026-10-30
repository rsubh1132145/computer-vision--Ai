import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ScanStudioPage } from './pages/ScanStudioPage';
import { HistoryPage } from './pages/HistoryPage';
import { ReportPage } from './pages/ReportPage';
import { Scan, ShieldCheck, Cpu, Database, HeartHandshake } from 'lucide-react';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
          <Navbar />

          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/scan" element={<ScanStudioPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/report/:id" element={<ReportPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Platform Footer */}
          <footer className="border-t border-slate-800/80 bg-slate-950/90 py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Scan className="w-3.5 h-3.5" />
                </div>
                <span className="font-extrabold text-white">VisionPulse</span>
                <span className="text-slate-600">•</span>
                <span>Computer Vision &amp; Visual Intelligence Platform</span>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Gemini 3.8 Flash Online
                </span>
                <span>•</span>
                <span>Zod Enforced Schema</span>
                <span>•</span>
                <span>JWT/Bcrypt Secured</span>
              </div>

              <div className="text-slate-500 text-[11px]">
                &copy; {new Date().getFullYear()} VisionPulse Platform. Enterprise Automated Inspection.
              </div>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
