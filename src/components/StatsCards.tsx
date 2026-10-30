import React from 'react';
import { Scan, AlertTriangle, CheckCircle, Gauge, Activity, Factory, FileText, ShieldAlert } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    totalScans: number;
    anomaliesCount: number;
    cleanCount: number;
    anomalyRate: number;
    avgConfidence: number;
    domainBreakdown: Record<string, number>;
  };
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const cards = [
    {
      label: 'Total Automated Scans',
      value: stats.totalScans.toLocaleString(),
      subtext: 'Persisted in Relational DB',
      icon: Scan,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      label: 'Anomalies Identified',
      value: stats.anomaliesCount.toLocaleString(),
      subtext: `${stats.anomalyRate}% Anomaly Incident Rate`,
      icon: AlertTriangle,
      color: stats.anomaliesCount > 0 ? 'text-amber-400' : 'text-emerald-400',
      bg: stats.anomaliesCount > 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Clean Pass Verification',
      value: stats.cleanCount.toLocaleString(),
      subtext: `${stats.totalScans > 0 ? Math.round((stats.cleanCount / stats.totalScans) * 100) : 100}% Operational Clearance`,
      icon: CheckCircle,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Mean Model Confidence',
      value: stats.totalScans > 0 ? `${Math.round(stats.avgConfidence * 100)}%` : '98.5%',
      subtext: 'Gemini 3.8 Flash Engine',
      icon: Gauge,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20',
    },
  ];

  const getDomainIcon = (d: string) => {
    switch (d) {
      case 'industrial':
        return <Factory className="w-3.5 h-3.5 text-amber-400" />;
      case 'medical':
        return <Activity className="w-3.5 h-3.5 text-rose-400" />;
      case 'document':
        return <FileText className="w-3.5 h-3.5 text-sky-400" />;
      default:
        return <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden transition hover:border-slate-700"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {c.label}
                </span>
                <div className={`p-2 rounded-xl border ${c.bg}`}>
                  <Icon className={`w-4 h-4 ${c.color}`} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {c.value}
              </div>
              <p className="text-xs text-slate-500 mt-1">{c.subtext}</p>
            </div>
          );
        })}
      </div>

      {/* Domain Distribution Bar */}
      {stats.totalScans > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Domain Intelligence Distribution:</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {Object.entries(stats.domainBreakdown).map(([domain, count]) => (
              <div
                key={domain}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300"
              >
                {getDomainIcon(domain)}
                <span className="capitalize">{domain}:</span>
                <span className="font-mono font-bold text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
