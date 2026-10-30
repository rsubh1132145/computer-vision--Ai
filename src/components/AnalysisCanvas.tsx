import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Region, SeverityLevel } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff, Crosshair, Sparkles } from 'lucide-react';

interface AnalysisCanvasProps {
  imageUrl: string;
  regions: Region[];
  selectedRegionIndex: number | null;
  onSelectRegion?: (index: number | null) => void;
  className?: string;
  minSeverityFilter?: SeverityLevel | 'All';
}

const SEVERITY_COLORS: Record<SeverityLevel, { stroke: string; fill: string; badgeBg: string; text: string }> = {
  Critical: { stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.22)', badgeBg: '#991b1b', text: '#ffffff' },
  High: { stroke: '#f97316', fill: 'rgba(249, 115, 22, 0.20)', badgeBg: '#9a3412', text: '#ffffff' },
  Medium: { stroke: '#eab308', fill: 'rgba(234, 179, 8, 0.18)', badgeBg: '#854d0e', text: '#ffffff' },
  Low: { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.18)', badgeBg: '#065f46', text: '#ffffff' },
};

export const AnalysisCanvas: React.FC<AnalysisCanvasProps> = ({
  imageUrl,
  regions,
  selectedRegionIndex,
  onSelectRegion,
  className = '',
  minSeverityFilter = 'All',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showOverlays, setShowOverlays] = useState(true);
  const [showCrosshairs, setShowCrosshairs] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mousePos, setMousePos] = useState<{ x: number; y: number; normX: number; normY: number } | null>(null);

  // Filter regions by severity if requested
  const severityOrder: Record<SeverityLevel, number> = {
    Low: 1,
    Medium: 2,
    High: 3,
    Critical: 4,
  };

  const filteredRegions = regions.filter((r) => {
    if (minSeverityFilter === 'All') return true;
    return severityOrder[r.severity] >= severityOrder[minSeverityFilter];
  });

  // Load image
  useEffect(() => {
    setIsLoaded(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
      setIsLoaded(true);
    };
    img.onerror = () => {
      console.error('Failed to load image for canvas inspection.');
    };
  }, [imageUrl]);

  // Render canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image || !isLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use intrinsic image aspect ratio
    const naturalWidth = image.naturalWidth || 800;
    const naturalHeight = image.naturalHeight || 600;

    canvas.width = naturalWidth;
    canvas.height = naturalHeight;

    // Clear
    ctx.clearRect(0, 0, naturalWidth, naturalHeight);

    // Draw base visual image
    ctx.drawImage(image, 0, 0, naturalWidth, naturalHeight);

    // If overlays enabled, draw bounding boxes
    if (showOverlays && filteredRegions.length > 0) {
      filteredRegions.forEach((region, idx) => {
        const isSelected = selectedRegionIndex === idx;
        const isHovered = hoveredIndex === idx;

        // Coordinates normalized 0-1000: [ymin, xmin, ymax, xmax]
        const [ymin, xmin, ymax, xmax] = region.box_2d;

        const x = (xmin / 1000) * naturalWidth;
        const y = (ymin / 1000) * naturalHeight;
        const w = ((xmax - xmin) / 1000) * naturalWidth;
        const h = ((ymax - ymin) / 1000) * naturalHeight;

        const styling = SEVERITY_COLORS[region.severity] || SEVERITY_COLORS.Medium;

        ctx.save();

        // Fill bounding box
        ctx.fillStyle = isSelected
          ? styling.fill.replace(/0\.\d+/, '0.38')
          : isHovered
          ? styling.fill.replace(/0\.\d+/, '0.28')
          : styling.fill;
        ctx.fillRect(x, y, w, h);

        // Stroke bounding box with glow
        ctx.strokeStyle = styling.stroke;
        ctx.lineWidth = isSelected ? 4 : isHovered ? 3 : 2;
        if (isSelected || isHovered) {
          ctx.shadowColor = styling.stroke;
          ctx.shadowBlur = 12;
        }
        ctx.strokeRect(x, y, w, h);

        // Corner brackets / high-tech HUD accents
        const bracketLen = Math.min(16, w / 4, h / 4);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = isSelected ? 3 : 2;

        // Top-left
        ctx.beginPath();
        ctx.moveTo(x, y + bracketLen);
        ctx.lineTo(x, y);
        ctx.lineTo(x + bracketLen, y);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(x + w - bracketLen, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w, y + bracketLen);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(x, y + h - bracketLen);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x + bracketLen, y + h);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(x + w - bracketLen, y + h);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x + w, y + h - bracketLen);
        ctx.stroke();

        // Draw pill label tag above box
        const labelText = `${region.label} [${region.severity}]`;
        ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
        const textMetrics = ctx.measureText(labelText);
        const tagHeight = 22;
        const tagWidth = textMetrics.width + 16;
        const tagY = y > tagHeight + 6 ? y - tagHeight - 2 : y + 4;
        const tagX = Math.max(0, Math.min(naturalWidth - tagWidth, x));

        ctx.shadowBlur = 0;
        ctx.fillStyle = styling.badgeBg;
        ctx.beginPath();
        ctx.roundRect(tagX, tagY, tagWidth, tagHeight, 4);
        ctx.fill();

        ctx.fillStyle = styling.text;
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, tagX + 8, tagY + tagHeight / 2);

        ctx.restore();
      });
    }

    // Optional crosshairs
    if (showCrosshairs && mousePos) {
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, mousePos.y);
      ctx.lineTo(naturalWidth, mousePos.y);
      ctx.stroke();

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(mousePos.x, 0);
      ctx.lineTo(mousePos.x, naturalHeight);
      ctx.stroke();
      ctx.restore();
    }
  }, [image, isLoaded, filteredRegions, selectedRegionIndex, hoveredIndex, showOverlays, showCrosshairs, mousePos]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Handle canvas mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = (e.clientX - rect.left) * scaleX;
    const clientY = (e.clientY - rect.top) * scaleY;

    const normX = Math.round((clientX / canvas.width) * 1000);
    const normY = Math.round((clientY / canvas.height) * 1000);

    setMousePos({ x: clientX, y: clientY, normX, normY });

    // Check hit test over regions
    let foundIndex: number | null = null;
    for (let i = filteredRegions.length - 1; i >= 0; i--) {
      const [ymin, xmin, ymax, xmax] = filteredRegions[i].box_2d;
      const rx = (xmin / 1000) * canvas.width;
      const ry = (ymin / 1000) * canvas.height;
      const rw = ((xmax - xmin) / 1000) * canvas.width;
      const rh = ((ymax - ymin) / 1000) * canvas.height;

      if (clientX >= rx && clientX <= rx + rw && clientY >= ry && clientY <= ry + rh) {
        foundIndex = i;
        break;
      }
    }

    setHoveredIndex(foundIndex);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setMousePos(null);
  };

  const handleClick = () => {
    if (hoveredIndex !== null) {
      onSelectRegion?.(hoveredIndex === selectedRegionIndex ? null : hoveredIndex);
    } else {
      onSelectRegion?.(null);
    }
  };

  return (
    <div className={`relative flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl ${className}`}>
      {/* Top Inspection Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 text-xs text-slate-300 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-semibold text-slate-200">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Inspection Canvas Overlay
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            {filteredRegions.length} {filteredRegions.length === 1 ? 'region' : 'regions'} detected
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Toggle overlays */}
          <button
            type="button"
            onClick={() => setShowOverlays(!showOverlays)}
            className={`p-1.5 rounded transition ${
              showOverlays ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title={showOverlays ? 'Hide Bounding Boxes' : 'Show Bounding Boxes'}
          >
            {showOverlays ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          {/* Toggle crosshairs */}
          <button
            type="button"
            onClick={() => setShowCrosshairs(!showCrosshairs)}
            className={`p-1.5 rounded transition ${
              showCrosshairs ? 'bg-sky-600/30 text-sky-300 border border-sky-500/40' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Precision Crosshair HUD"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Controls */}
          <div className="h-4 w-px bg-slate-800 mx-1" />
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))}
            className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-white transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] px-1 text-slate-400 w-10 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.75, +(z - 0.25).toFixed(2)))}
            className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-white transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-white transition"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-auto bg-slate-950 flex items-center justify-center p-3 min-h-[380px] max-h-[640px] select-none"
      >
        {!isLoaded && (
          <div className="flex flex-col items-center justify-center gap-2 text-slate-400 py-16">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono">Loading visual payload into canvas...</span>
          </div>
        )}

        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out',
          }}
          className="relative max-w-full"
        >
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            className={`max-w-full max-h-[560px] object-contain rounded border border-slate-800 shadow-xl cursor-${
              hoveredIndex !== null ? 'pointer' : showCrosshairs ? 'crosshair' : 'default'
            }`}
          />
        </div>

        {/* Live Coordinate HUD badge */}
        {mousePos && (
          <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur border border-slate-700/80 px-2.5 py-1.5 rounded-lg text-[11px] font-mono text-slate-300 shadow-lg flex items-center gap-3">
            <span className="text-sky-400">NORM [X: {mousePos.normX}, Y: {mousePos.normY}]</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">PX [{Math.round(mousePos.x)}px, {Math.round(mousePos.y)}px]</span>
          </div>
        )}

        {/* Hovered Region Tooltip Card */}
        {hoveredIndex !== null && filteredRegions[hoveredIndex] && (
          <div className="absolute top-3 right-3 max-w-xs bg-slate-900/95 backdrop-blur border border-indigo-500/40 p-3 rounded-lg shadow-2xl text-left pointer-events-none transition">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-semibold text-xs text-white truncate">
                {filteredRegions[hoveredIndex].label}
              </span>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase"
                style={{
                  backgroundColor: SEVERITY_COLORS[filteredRegions[hoveredIndex].severity]?.badgeBg,
                  color: SEVERITY_COLORS[filteredRegions[hoveredIndex].severity]?.text,
                }}
              >
                {filteredRegions[hoveredIndex].severity}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug line-clamp-3">
              {filteredRegions[hoveredIndex].description}
            </p>
            <div className="mt-2 text-[10px] font-mono text-indigo-300">
              Box: [{filteredRegions[hoveredIndex].box_2d.join(', ')}]
            </div>
          </div>
        )}
      </div>

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <span className="text-slate-500 uppercase tracking-wider text-[10px] font-medium">Severity Legend:</span>
          {Object.entries(SEVERITY_COLORS).map(([severity, cfg]) => (
            <div key={severity} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: cfg.stroke }} />
              <span className="text-slate-300">{severity}</span>
            </div>
          ))}
        </div>
        <div className="text-slate-500 italic">
          Click any bounding box to isolate inspection details
        </div>
      </div>
    </div>
  );
};
