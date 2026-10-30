import React, { useState } from 'react';
import { ScanRecord, Region, SeverityLevel } from '../types';
import { AnalysisCanvas } from './AnalysisCanvas';
import {
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Gauge,
  Calendar,
  Layers,
  ArrowLeft,
  Share2,
  Code2,
  ShieldCheck,
  ListChecks,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface ReportViewProps {
  scan: ScanRecord;
  onBack?: () => void;
}

const SEVERITY_BADGE_STYLE: Record<SeverityLevel, { bg: string; text: string; border: string }> = {
  Critical: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/40' },
  High: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/40' },
  Medium: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/40' },
  Low: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/40' },
};

export const ReportView: React.FC<ReportViewProps> = ({ scan, onBack }) => {
  const [selectedRegionIndex, setSelectedRegionIndex] = useState<number | null>(null);
  const [minSeverityFilter, setMinSeverityFilter] = useState<SeverityLevel | 'All'>('All');
  const [showJsonRaw, setShowJsonRaw] = useState(false);

  const analysis = scan.raw_analysis;
  const regions = analysis?.regions || [];
  const recommendations = analysis?.recommendations || [];
  const confidence = analysis?.confidenceScore || 0;
  const hasAnomalies = analysis?.anomaliesDetected;

  // Export handlers
  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(scan, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `visionpulse-report-scan-${scan.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition"
              title="Return to list"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase text-indigo-400">
                AUDIT REPORT #{scan.id}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 capitalize">{scan.domain} Inspection Pipeline</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">
              Automated Computer Vision Inspection Audit
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowJsonRaw(!showJsonRaw)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition ${
              showJsonRaw
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{showJsonRaw ? 'Visual View' : 'Raw JSON'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-950 border border-slate-800 text-slate-300 hover:text-white transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Anomaly & Status High-Impact Banner */}
      <div
        className={`rounded-2xl p-5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          hasAnomalies
            ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
            : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-xl border ${
              hasAnomalies ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
            }`}
          >
            {hasAnomalies ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {hasAnomalies
                ? `Operational Attention Required: ${regions.length} Detected Anomalies`
                : 'Operational Clearance: Zero Anomalies Detected'}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              {analysis?.summary || scan.summary}
            </p>
          </div>
        </div>

        {/* Model Confidence Metric Pill */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 shrink-0">
          <Gauge className="w-5 h-5 text-sky-400" />
          <div className="text-right">
            <span className="block text-[10px] uppercase font-mono text-slate-400">Model Confidence</span>
            <span className="text-sm font-extrabold text-white font-mono">
              {Math.round(confidence * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Canvas on Left, Structured Inspection Details on Right */}
      {!showJsonRaw ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Canvas Viewer */}
          <div className="lg:col-span-7 space-y-4">
            <AnalysisCanvas
              imageUrl={scan.image_url}
              regions={regions}
              selectedRegionIndex={selectedRegionIndex}
              onSelectRegion={setSelectedRegionIndex}
              minSeverityFilter={minSeverityFilter}
            />

            {/* Severity Filter Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs">
              <span className="text-slate-400">Filter Overlay Severity:</span>
              <div className="flex items-center gap-1.5">
                {(['All', 'Critical', 'High', 'Medium', 'Low'] as (SeverityLevel | 'All')[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setMinSeverityFilter(lvl)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                      minSeverityFilter === lvl
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Detected Regions & Recommendations */}
          <div className="lg:col-span-5 space-y-6">
            {/* Regions List */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">
                    Identified Regions &amp; Bounding Coordinates
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {regions.length} Items
                </span>
              </div>

              {regions.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  No anomaly bounding regions mapped. Visual payload satisfies standard tolerance thresholds.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {regions.map((region, idx) => {
                    const isSelected = selectedRegionIndex === idx;
                    const style = SEVERITY_BADGE_STYLE[region.severity] || SEVERITY_BADGE_STYLE.Medium;

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedRegionIndex(isSelected ? null : idx)}
                        className={`p-3 rounded-xl border cursor-pointer transition ${
                          isSelected
                            ? 'bg-indigo-950/50 border-indigo-500 shadow-lg shadow-indigo-500/10'
                            : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-bold text-xs text-white truncate">
                            {idx + 1}. {region.label}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${style.bg} ${style.text} ${style.border}`}
                          >
                            {region.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed mb-2">
                          {region.description}
                        </p>
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-800/60 pt-1.5">
                          <span>Box [ymin, xmin, ymax, xmax]:</span>
                          <span className="text-indigo-300">[{region.box_2d.join(', ')}]</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recommendations Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <ListChecks className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Actionable Operational Recommendations
                </h3>
              </div>

              {recommendations.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No immediate corrective actions required.
                </p>
              ) : (
                <ul className="space-y-2">
                  {recommendations.map((rec, i) => (
                    <li
                      key={i}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-200 flex items-start gap-2.5"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                      <span className="leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Raw JSON Inspector View */
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-mono">
            <span>Validated AI Output Schema (Zod Verified)</span>
            <span>Content-Type: application/json</span>
          </div>
          <pre className="p-4 bg-slate-900 rounded-xl overflow-x-auto text-xs font-mono text-indigo-300 leading-relaxed">
            {JSON.stringify(scan, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
