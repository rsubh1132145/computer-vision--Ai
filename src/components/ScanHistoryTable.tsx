import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ScanRecord, InspectionDomain } from '../types';
import {
  Search,
  Filter,
  Trash2,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Factory,
  Activity,
  FileText,
  ShieldAlert,
  Calendar,
  Layers,
} from 'lucide-react';

interface ScanHistoryTableProps {
  scans: ScanRecord[];
  total: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  selectedDomain: string;
  onDomainChange: (domain: string) => void;
  anomalyFilter: string;
  onAnomalyFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (search: string) => void;
  onDeleteScan: (id: number) => Promise<void>;
  isLoading: boolean;
}

export const ScanHistoryTable: React.FC<ScanHistoryTableProps> = ({
  scans,
  total,
  currentPage,
  totalPages,
  onPageChange,
  selectedDomain,
  onDomainChange,
  anomalyFilter,
  onAnomalyFilterChange,
  searchQuery,
  onSearchChange,
  onDeleteScan,
  isLoading,
}) => {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const getDomainBadge = (d: string) => {
    switch (d) {
      case 'industrial':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <Factory className="w-3 h-3" />
            Industrial
          </span>
        );
      case 'medical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/30">
            <Activity className="w-3 h-3" />
            Medical
          </span>
        );
      case 'document':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-500/10 text-sky-300 border border-sky-500/30">
            <FileText className="w-3 h-3" />
            Document
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <ShieldAlert className="w-3 h-3" />
            General
          </span>
        );
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this scan record from database history?')) {
      return;
    }
    setDeletingId(id);
    try {
      await onDeleteScan(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search summaries, defects, or tags..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Domain Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedDomain}
              onChange={(e) => onDomainChange(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Domains</option>
              <option value="industrial" className="bg-slate-900">Industrial QC</option>
              <option value="medical" className="bg-slate-900">Medical Clinical</option>
              <option value="document" className="bg-slate-900">Document Scans</option>
              <option value="general" className="bg-slate-900">General Vision</option>
            </select>
          </div>

          {/* Anomaly Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <select
              value={anomalyFilter}
              onChange={(e) => onAnomalyFilterChange(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Results</option>
              <option value="anomalies" className="bg-slate-900">Anomalies Detected</option>
              <option value="clean" className="bg-slate-900">Clean Passes Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table / Grid Container */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono">Querying PostgreSQL inspection logs...</span>
          </div>
        ) : scans.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-300">No inspection scans found</p>
              <p className="text-xs text-slate-500 mt-1">
                Try adjusting your filters, or launch a new inspection run in Vision Studio.
              </p>
            </div>
            <Link
              to="/scan"
              className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow"
            >
              Launch New Scan
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Visual Payload</th>
                  <th className="py-3.5 px-4">Domain</th>
                  <th className="py-3.5 px-4">Status &amp; Severity</th>
                  <th className="py-3.5 px-4">AI Assessment Summary</th>
                  <th className="py-3.5 px-4">Confidence</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {scans.map((scan) => {
                  const hasAnomalies = scan.raw_analysis?.anomaliesDetected;
                  const regions = scan.raw_analysis?.regions || [];
                  const confidence = scan.raw_analysis?.confidenceScore;

                  return (
                    <tr
                      key={scan.id}
                      className="hover:bg-slate-800/40 transition group"
                    >
                      {/* Image Thumbnail */}
                      <td className="py-3 px-4">
                        <Link to={`/report/${scan.id}`} className="block relative w-16 h-12 rounded-lg overflow-hidden border border-slate-700 bg-black shrink-0 group-hover:border-indigo-500/80 transition">
                          <img
                            src={scan.image_url}
                            alt="Scan thumb"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 right-0 px-1 rounded-tl bg-slate-950/90 text-[9px] font-mono text-slate-300">
                            #{scan.id}
                          </div>
                        </Link>
                      </td>

                      {/* Domain */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getDomainBadge(scan.domain)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {hasAnomalies ? (
                          <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{regions.length} Anomaly {regions.length === 1 ? 'Point' : 'Points'}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Pass Clear</span>
                          </div>
                        )}
                      </td>

                      {/* Summary */}
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-slate-200 line-clamp-2 leading-relaxed">
                          {scan.summary || scan.raw_analysis?.summary}
                        </p>
                      </td>

                      {/* Confidence */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {typeof confidence === 'number' ? `${Math.round(confidence * 100)}%` : '—'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{new Date(scan.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/report/${scan.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 font-medium transition"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(scan.id)}
                            disabled={deletingId === scan.id}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Delete scan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing page <span className="font-bold text-white">{currentPage}</span> of{' '}
              <span className="font-bold text-white">{totalPages}</span> ({total} total inspection records)
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
