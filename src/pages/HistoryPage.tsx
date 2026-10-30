import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { ScanHistoryTable } from '../components/ScanHistoryTable';
import { ScanRecord } from '../types';
import { Link } from 'react-router-dom';
import { History, Plus, Database, Sparkles, Zap, ShieldCheck } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { user, authFetch, quickDemoLogin } = useAuth();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [anomalyFilter, setAnomalyFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchScans = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        domain: selectedDomain,
        anomaly: anomalyFilter,
        search: searchQuery,
      });

      const res = await authFetch(`/api/scans?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setScans(data.scans || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch scans:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, currentPage, selectedDomain, anomalyFilter, searchQuery]);

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  const handleDeleteScan = async (id: number) => {
    try {
      const res = await authFetch(`/api/scans/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchScans();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-2 border border-indigo-500/20">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Relational Audit Archives</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Inspection History &amp; Audit Logs
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Query past computer vision audits with bounding-box metadata, confidence levels, and anomaly flags.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/scan"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Scan</span>
          </Link>
        </div>
      </div>

      {!user ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Operator Authentication Required</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Inspection logs are strictly isolated per authenticated user in PostgreSQL. Sign in or initialize a demo operator session to access records.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={quickDemoLogin}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition"
            >
              1-Click Demo Login
            </button>
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
            >
              Sign In with Account
            </Link>
          </div>
        </div>
      ) : (
        <ScanHistoryTable
          scans={scans}
          total={total}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          selectedDomain={selectedDomain}
          onDomainChange={(d) => {
            setSelectedDomain(d);
            setCurrentPage(1);
          }}
          anomalyFilter={anomalyFilter}
          onAnomalyFilterChange={(a) => {
            setAnomalyFilter(a);
            setCurrentPage(1);
          }}
          searchQuery={searchQuery}
          onSearchChange={(s) => {
            setSearchQuery(s);
            setCurrentPage(1);
          }}
          onDeleteScan={handleDeleteScan}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
