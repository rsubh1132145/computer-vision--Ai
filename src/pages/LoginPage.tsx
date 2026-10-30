import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthForm } from '../components/AuthForm';
import { Scan, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center py-12 px-4 sm:px-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 mb-3 shadow-lg shadow-indigo-500/10">
          <Scan className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Operator Authentication
        </h1>
        <p className="text-xs text-slate-400 mt-1.5 max-w-sm">
          Enter credentials to authenticate into the VisionPulse Computer Vision engine.
        </p>
      </div>

      <AuthForm initialMode="login" onSuccess={() => navigate('/scan')} />

      <div className="mt-6 text-center text-xs text-slate-500 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>End-to-end encrypted with bcrypt password hashes &amp; JWT auth tokens</span>
      </div>
    </div>
  );
};
