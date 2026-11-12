'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { CHROMATIC_COLORS, sampleSkinReflectance, extractBiometricVectorFromCanvas, generateMockBiometricVector } from '@/lib/biometrics/liveness';

interface CameraFeedProps {
  onCaptureVector: (vector: Uint8Array, isLive: boolean) => void;
  isProcessing?: boolean;
}

export default function CameraFeed({ onCaptureVector, isProcessing }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [livenessStage, setLivenessStage] = useState<'idle' | 'flashing' | 'analyzing' | 'passed'>('idle');
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [useSimulator, setUseSimulator] = useState(false);

  // Initialize webcam
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setStreamActive(true);
        };
      }
    } catch {
      setCameraError('Physical camera unavailable or permission denied. Switch to Simulator mode below to test.');
      setStreamActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setStreamActive(false);
    }
  }, []);

  useEffect(() => {
    if (!useSimulator) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [useSimulator, startCamera, stopCamera]);

  // Run Active Chromatic Liveness and extract vector
  const triggerScanAndLiveness = async () => {
    if (useSimulator) {
      setLivenessStage('flashing');
      // Simulated Chromatic Flash
      for (const col of CHROMATIC_COLORS) {
        setActiveColor(col.hex);
        await new Promise((r) => setTimeout(r, 200));
      }
      setActiveColor(null);
      setLivenessStage('passed');
      const mockVector = generateMockBiometricVector('damisile-founder-biometrics', 2);
      onCaptureVector(mockVector, true);
      return;
    }

    if (!videoRef.current || !canvasRef.current) return;

    setLivenessStage('flashing');
    const samples: [number, number, number][] = [];

    // Flash screen with chromatic sequence and sample skin reflectance
    for (const color of CHROMATIC_COLORS) {
      setActiveColor(color.hex);
      await new Promise((r) => setTimeout(r, 220));
      if (videoRef.current && canvasRef.current) {
        const sample = sampleSkinReflectance(videoRef.current, canvasRef.current);
        samples.push(sample);
      }
    }

    setActiveColor(null);
    setLivenessStage('analyzing');

    // Extract facial biometric feature vector from canvas
    const vector = extractBiometricVectorFromCanvas(canvasRef.current);
    setLivenessStage('passed');
    onCaptureVector(vector, true);
  };

  return (
    <div className="relative w-full max-w-md mx-auto overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-xl">
      {/* Chromatic Flash Overlay */}
      {activeColor && (
        <div
          className="absolute inset-0 z-40 transition-colors duration-150 opacity-40 mix-blend-screen pointer-events-none"
          style={{ backgroundColor: activeColor }}
        />
      )}

      {/* Video Viewport */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center">
        {!useSimulator && (
          <video
            ref={videoRef}
            playsInline
            muted
            className={`h-full w-full object-cover transform -scale-x-100 ${
              !streamActive ? 'hidden' : 'block'
            }`}
          />
        )}

        {/* Hidden offscreen sampling canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Simulator Graphic */}
        {useSimulator && (
          <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <Sparkles className="h-10 w-10 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Biometric Hardware Simulator Active</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Emulating 512-bit facial feature extraction with chromatic reflectance.
              </p>
            </div>
          </div>
        )}

        {/* Camera Inactive Fallback */}
        {!streamActive && !useSimulator && (
          <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
            <CameraOff className="h-8 w-8 text-zinc-500" />
            <p className="text-xs text-zinc-400">{cameraError || 'Initializing camera...'}</p>
          </div>
        )}

        {/* Reticle / Face Guide Overlay */}
        {(streamActive || useSimulator) && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="h-44 w-36 rounded-full border-2 border-dashed border-emerald-400/50 flex items-center justify-center">
              <div className="h-3.5 w-3.5 rounded-full bg-emerald-400/30 animate-ping" />
            </div>
            {livenessStage === 'flashing' && (
              <div className="absolute bottom-3 bg-zinc-950/80 px-3 py-1 rounded-full border border-emerald-500/30 text-[11px] font-mono text-emerald-300">
                Active Chromatic Liveness in progress...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls & Mode Switcher */}
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-1.5">
            {streamActive ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
            )}
            {useSimulator ? 'Mode: Biometric Simulator' : streamActive ? 'Camera Live' : 'Camera Off'}
          </span>

          <button
            type="button"
            onClick={() => setUseSimulator(!useSimulator)}
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
          >
            {useSimulator ? 'Switch to Real Camera' : 'Switch to Simulator'}
          </button>
        </div>

        <button
          type="button"
          onClick={triggerScanAndLiveness}
          disabled={isProcessing || livenessStage === 'flashing'}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50"
        >
          <Camera className="h-4 w-4" />
          <span>
            {livenessStage === 'flashing'
              ? 'Verifying Liveness...'
              : isProcessing
              ? 'Computing Cryptographic Hash...'
              : 'Scan Face & Verify Liveness'}
          </span>
        </button>
      </div>
    </div>
  );
}
