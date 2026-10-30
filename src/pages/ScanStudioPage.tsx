import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DomainSelector } from '../components/DomainSelector';
import { ImageUploader } from '../components/ImageUploader';
import { AnalysisCanvas } from '../components/AnalysisCanvas';
import { InspectionDomain, SensitivityLevel, ScanRecord } from '../types';
import { DOMAINS } from '../data/domains';
import {
  Scan,
  Zap,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

export const ScanStudioPage: React.FC = () => {
  const { user, token, authFetch, quickDemoLogin } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Setup initial domain from query param or default to 'industrial'
  const initialDomain = (searchParams.get('domain') as InspectionDomain) || 'industrial';
  const [selectedDomain, setSelectedDomain] = useState<InspectionDomain>(
    ['industrial', 'medical', 'document', 'general'].includes(initialDomain) ? initialDomain : 'industrial'
  );
  const [sensitivity, setSensitivity] = useState<SensitivityLevel>('Medium');
  const [customQuery, setCustomQuery] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [completedScan, setCompletedScan] = useState<ScanRecord | null>(null);
  const [selectedRegionIndex, setSelectedRegionIndex] = useState<number | null>(null);

  // Auto-fill sample if user lands and hasn't chosen one yet
  useEffect(() => {
    if (!imageUrl) {
      const domainMeta = DOMAINS.find((d) => d.id === selectedDomain);
      if (domainMeta && domainMeta.sampleImages[0]) {
        setImageUrl(domainMeta.sampleImages[0].url);
      }
    }
  }, [selectedDomain]);

  // Execute Inspection Pipeline
  const handleExecuteAnalysis = async () => {
    if (!imageUrl) {
      setError('Please provide a visual payload (upload image, live capture, or pick a sample preset).');
      return;
    }

    if (!user) {
      setError('Operator authentication required. Please sign in or use 1-click Demo Login below.');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setCompletedScan(null);
    setProgressPercent(15);
    setProcessingStep('1/5 Ingesting high-resolution visual payload buffer...');

    try {
      const stepTimer1 = setTimeout(() => {
        setProgressPercent(40);
        setProcessingStep('2/5 Invoking server-side Google Gemini 3.8 Flash multimodal vision model...');
      }, 500);

      const stepTimer2 = setTimeout(() => {
        setProgressPercent(70);
        setProcessingStep('3/5 Computing normalized [0, 1000] bounding coordinates & classifying anomalies...');
      }, 1300);

      const res = await authFetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          domain: selectedDomain,
          sensitivity,
          customQuery,
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      setProgressPercent(90);
      setProcessingStep('4/5 Validating output schema with Zod & persisting to relational database...');

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Inspection pipeline failed.');
      }

      setProgressPercent(100);
      setProcessingStep('5/5 Inspection complete! Rendering coordinate overlays.');
      setCompletedScan(data.scan);
    } catch (err: any) {
      console.error('Analysis execution failed:', err);
      setError(err.message || 'Inspection pipeline error.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCompletedScan(null);
    setSelectedRegionIndex(null);
    setError(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-2 border border-indigo-500/20">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Interactive Vision Analysis Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Automated Visual Inspection Studio
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Configure industry-specific optical models, sensitivity thresholds, and custom inspection queries.
            Powered by Google Gemini 3.8 Flash server-side integration.
          </p>
        </div>

        {/* Auth prompt if unauthenticated */}
        {!user && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
            <div className="text-xs text-amber-200">
              <span className="font-semibold block">Guest Mode Active</span>
              <span className="text-[11px] text-amber-300/80">Login required to execute scan</span>
            </div>
            <button
              type="button"
              onClick={quickDemoLogin}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition"
            >
              1-Click Demo
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          {!user && (
            <button
              type="button"
              onClick={quickDemoLogin}
              className="px-3 py-1 rounded bg-rose-500 text-white font-bold text-xs"
            >
              Login as Demo Operator
            </button>
          )}
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form & Configuration */}
        <div className="lg:col-span-6 space-y-6">
          <DomainSelector
            selectedDomain={selectedDomain}
            onSelectDomain={(d) => {
              setSelectedDomain(d);
              // Switch sample preset to match domain
              const dMeta = DOMAINS.find((m) => m.id === d);
              if (dMeta && dMeta.sampleImages[0]) {
                setImageUrl(dMeta.sampleImages[0].url);
              }
            }}
            sensitivity={sensitivity}
            onChangeSensitivity={setSensitivity}
            customQuery={customQuery}
            onChangeCustomQuery={setCustomQuery}
          />

          <ImageUploader
            currentDomain={selectedDomain}
            imageUrl={imageUrl}
            onImageSelected={setImageUrl}
            onClear={() => setImageUrl('')}
          />

          {/* Action Trigger Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleExecuteAnalysis}
              disabled={isProcessing || !imageUrl}
              className="w-full py-4 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:from-indigo-500 hover:to-sky-400 disabled:opacity-50 text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2.5 transition transform active:scale-[0.99]"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Executing Vision Intelligence Pipeline...</span>
                </>
              ) : (
                <>
                  <Scan className="w-5 h-5" />
                  <span>Execute Computer Vision Inspection</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Processing HUD / Real-Time Results Canvas */}
        <div className="lg:col-span-6 space-y-6">
          {/* Active Processing Indicator Card */}
          {isProcessing && (
            <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold uppercase text-indigo-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                  Active Inspection Pipeline
                </span>
                <span className="text-xs font-mono text-slate-400">{progressPercent}%</span>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden mb-4 border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-300 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-200 font-mono">
                <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin shrink-0" />
                <span>{processingStep}</span>
              </div>
            </div>
          )}

          {/* Results View when Completed */}
          {completedScan ? (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
                <div>
                  <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Inspection Successfully Completed &amp; Saved
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Persisted as Audit #{completedScan.id} in Relational Database
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition"
                    title="New Inspection"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/report/${completedScan.id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition"
                  >
                    <span>Full Audit Report</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Interactive Analysis Canvas */}
              <AnalysisCanvas
                imageUrl={completedScan.image_url}
                regions={completedScan.raw_analysis.regions}
                selectedRegionIndex={selectedRegionIndex}
                onSelectRegion={setSelectedRegionIndex}
              />

              {/* Summary and Recommendations Breakdown */}
              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">
                      AI Executive Summary
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {completedScan.raw_analysis.summary}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">Confidence</span>
                    <span className="text-sm font-mono font-bold text-sky-400">
                      {Math.round(completedScan.raw_analysis.confidenceScore * 100)}%
                    </span>
                  </div>
                </div>

                {completedScan.raw_analysis.recommendations.length > 0 && (
                  <div className="border-t border-slate-800 pt-3">
                    <span className="text-xs font-semibold text-slate-200 block mb-2">
                      Operational Recommendations:
                    </span>
                    <ul className="space-y-1.5">
                      {completedScan.raw_analysis.recommendations.map((rec, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : !isProcessing ? (
            /* Standby State */
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[460px] text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-500 mb-4 shadow-inner">
                <Scan className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-200">
                Visual Inspection Studio Standby
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
                Configure your domain parameters, inspect the preview payload, and click{' '}
                <strong className="text-slate-200">Execute Computer Vision Inspection</strong> to generate interactive bounding box overlays.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500 font-mono">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Normalized Coordinates [0, 1000]
                </span>
                <span>•</span>
                <span>Zod Validated Output</span>
                <span>•</span>
                <span>PostgreSQL Persistent</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
