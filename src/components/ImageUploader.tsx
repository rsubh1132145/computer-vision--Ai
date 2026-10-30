import React, { useState, useRef, useCallback } from 'react';
import { InspectionDomain } from '../types';
import { DOMAINS } from '../data/domains';
import {
  UploadCloud,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface ImageUploaderProps {
  currentDomain: InspectionDomain;
  imageUrl: string;
  onImageSelected: (url: string) => void;
  onClear: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentDomain,
  imageUrl,
  onImageSelected,
  onClear,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const activeDomainMeta = DOMAINS.find((d) => d.id === currentDomain) || DOMAINS[0];

  // Process file upload
  const handleFile = (file: File) => {
    setErrorMessage(null);

    // Validate MIME
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Unsupported file format. Please upload JPEG, PNG, WEBP, or BMP images.');
      return;
    }

    // Limit to 20MB
    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('File size exceeds 20MB limit. Please provide an optimized visual payload.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        onImageSelected(e.target.result);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read visual file.');
    };
    reader.readAsDataURL(file);
  };

  // Drag-and-drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Live Camera Capture
  const startCamera = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setErrorMessage('Unable to access camera feed. Please check browser permissions.');
    }
  };

  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  const captureCameraFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    stopCamera();
    onImageSelected(dataUrl);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
          4. Visual Payload Input (Upload / Camera / Samples)
        </label>
        {imageUrl && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Payload
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Upload / Camera View Area */}
      {!imageUrl && !isCameraActive && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[220px] ${
            isDragging
              ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
              : 'border-slate-700/80 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-600'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h3 className="text-base font-bold text-white mb-1">
            Drag &amp; drop visual payload here, or <span className="text-indigo-400 underline">browse</span>
          </h3>
          <p className="text-xs text-slate-400 max-w-md">
            Supports high-resolution PNG, JPG, WEBP, or scanned documents up to 20MB. Coordinates mapped automatically.
          </p>

          <div className="mt-4 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={startCamera}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition"
            >
              <Camera className="w-4 h-4 text-sky-400" />
              Capture via Live Camera
            </button>
          </div>
        </div>
      )}

      {/* Camera Live Preview View */}
      {isCameraActive && (
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-4">
          <div className="relative aspect-video max-h-[380px] w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Camera targeting grid */}
            <div className="absolute inset-0 pointer-events-none border border-sky-400/30 grid grid-cols-3 grid-rows-3">
              <div className="border border-sky-400/20" />
              <div className="border border-sky-400/20" />
              <div className="border border-sky-400/20" />
              <div className="border border-sky-400/20" />
              <div className="border border-sky-400/20" />
              <div className="border border-sky-400/20" />
              <div className="border border-sky-400/20" />
              <div className="border border-sky-400/20" />
              <div className="border border-sky-400/20" />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Live Visual Feed Active
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={stopCamera}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={captureCameraFrame}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow"
              >
                <Camera className="w-4 h-4" />
                Capture Frame
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Image Preview */}
      {imageUrl && (
        <div className="relative rounded-xl border border-slate-800 bg-slate-900/50 p-3 flex items-center gap-4">
          <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-700 bg-black shrink-0">
            <img src={imageUrl} alt="Selected payload" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-indigo-500/10 pointer-events-none" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">Visual Payload Ready for Processing</span>
            </div>
            <p className="text-xs text-slate-400 truncate">
              {imageUrl.startsWith('data:') ? 'Local High-Resolution Buffer' : imageUrl}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Replace Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Domain Preset Visual Samples */}
      <div className="p-3.5 bg-slate-900/50 border border-slate-800/80 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant Test Presets for {activeDomainMeta.title}:</span>
          </div>
          <span className="text-[11px] text-slate-500">1-click automated load</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {activeDomainMeta.sampleImages.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onImageSelected(sample.url)}
              className="group relative rounded-lg border border-slate-800 overflow-hidden text-left bg-slate-950 hover:border-indigo-500/60 transition flex flex-col"
            >
              <div className="h-20 w-full overflow-hidden bg-slate-900 relative">
                <img
                  src={sample.url}
                  alt={sample.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
              </div>
              <div className="p-2">
                <p className="text-[11px] font-semibold text-slate-200 group-hover:text-indigo-300 truncate">
                  {sample.title}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{sample.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
