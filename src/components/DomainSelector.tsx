import React from 'react';
import { InspectionDomain, SensitivityLevel } from '../types';
import { DOMAINS } from '../data/domains';
import { Factory, Activity, FileText, ShieldAlert, Sliders, MessageSquareText, HelpCircle } from 'lucide-react';

interface DomainSelectorProps {
  selectedDomain: InspectionDomain;
  onSelectDomain: (domain: InspectionDomain) => void;
  sensitivity: SensitivityLevel;
  onChangeSensitivity: (level: SensitivityLevel) => void;
  customQuery: string;
  onChangeCustomQuery: (query: string) => void;
}

export const DomainSelector: React.FC<DomainSelectorProps> = ({
  selectedDomain,
  onSelectDomain,
  sensitivity,
  onChangeSensitivity,
  customQuery,
  onChangeCustomQuery,
}) => {
  const activeMeta = DOMAINS.find((d) => d.id === selectedDomain) || DOMAINS[0];

  const getIcon = (id: InspectionDomain) => {
    switch (id) {
      case 'industrial':
        return <Factory className="w-5 h-5 text-amber-400" />;
      case 'medical':
        return <Activity className="w-5 h-5 text-rose-400" />;
      case 'document':
        return <FileText className="w-5 h-5 text-sky-400" />;
      case 'general':
        return <ShieldAlert className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Target Domain Cards */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
          1. Select Inspection Industry &amp; Domain Model
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DOMAINS.map((domain) => {
            const isSelected = selectedDomain === domain.id;
            return (
              <button
                key={domain.id}
                type="button"
                onClick={() => onSelectDomain(domain.id)}
                className={`relative p-3.5 rounded-xl border text-left transition duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-b from-indigo-950/60 to-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
                      {getIcon(domain.id)}
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase border ${
                        isSelected
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {domain.badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{domain.title}</h4>
                  <p className="text-xs text-slate-400 leading-snug line-clamp-2">
                    {domain.subtitle}
                  </p>
                </div>

                {isSelected && (
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-indigo-400 border-t border-indigo-500/20 pt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    Domain Pipeline Active
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Domain Active Focus Areas Pill List */}
      <div className="p-3.5 bg-slate-900/80 border border-slate-800/80 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-slate-200">Active Pipeline Directives:</span>
          <span className="text-xs text-slate-400">{activeMeta.description}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {activeMeta.focusAreas.map((area, idx) => (
            <span
              key={idx}
              className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800/90 border border-slate-700 text-slate-300 flex items-center gap-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              {area}
            </span>
          ))}
        </div>
      </div>

      {/* Sensitivity & Custom Guidance Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sensitivity Slider */}
        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <label className="text-xs font-semibold text-slate-200">
                2. Anomaly Sensitivity Threshold
              </label>
            </div>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                sensitivity === 'High'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : sensitivity === 'Medium'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {sensitivity} Threshold
            </span>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {(['Low', 'Medium', 'High'] as SensitivityLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => onChangeSensitivity(level)}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition ${
                    sensitivity === level
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {sensitivity === 'Low' && 'Flag only critical out-of-tolerance deviations.'}
              {sensitivity === 'Medium' && 'Standard automated optical inspection (balanced false-alarm rate).'}
              {sensitivity === 'High' && 'Zero-tolerance inspection: detect hairline cracks, micro-pores, and subtle anomalies.'}
            </p>
          </div>
        </div>

        {/* Custom Focus Query */}
        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MessageSquareText className="w-4 h-4 text-sky-400" />
              <label className="text-xs font-semibold text-slate-200">
                3. Custom Operational Focus Area (Optional)
              </label>
            </div>
            <button
              type="button"
              onClick={() => onChangeCustomQuery(activeMeta.suggestedPrompt)}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline"
            >
              Use Suggested Prompt
            </button>
          </div>

          <textarea
            value={customQuery}
            onChange={(e) => onChangeCustomQuery(e.target.value)}
            rows={2}
            placeholder={`e.g. ${activeMeta.suggestedPrompt}`}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Guide the Gemini multimodal engine to inspect specific sub-assemblies, part numbers, or flaw types.
          </p>
        </div>
      </div>
    </div>
  );
};
