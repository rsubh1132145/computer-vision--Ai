import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ReportView } from '../components/ReportView';
import { ScanRecord } from '../types';
import { AlertCircle, ArrowLeft, Zap } from 'lucide-react';

export const ReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, authFetch, quickDemoLogin } = useAuth();
  const navigate = useNavigate();
  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchScan() {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await authFetch(`/api/scans/${id}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Inspection report not found.');
        }
        const data = await res.json();
        setScan(data.scan);
      } catch (err: any) {
        console.error('Failed to retrieve scan report:', err);
        setError(err.message || 'Inspection report not found or access denied.');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchScan();
    }
  }, [id, user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
        <h2 className="text-lg font-bold text-white">Operator Authentication Required</h2>
        <p className="text-xs text-slate-400">
          This inspection report requires an authenticated operator session.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={quickDemoLogin}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950"
          >
            1-Click Demo Login
          </button>
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl text-xs bg-slate-800 text-slate-200"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono">Retrieving inspection audit #{id} from database...</span>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="max-w-lg mx-auto my-16 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Inspection Report Unavailable</h2>
        <p className="text-xs text-rose-300">
          {error || 'Unable to locate this inspection record.'}
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => navigate('/history')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Inspection Archives</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ReportView scan={scan} onBack={() => navigate('/history')} />
    </div>
  );
};
