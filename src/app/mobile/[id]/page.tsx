'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, Smartphone, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { loadPeerJS } from '../../../lib/peerjs';

export default function MobilePage() {
  const [sessionId, setSessionId] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const peerRef = useRef<any>(null);
  const callRef = useRef<any>(null);

  const [status, setStatus] = useState<'idle' | 'loading' | 'connected' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Extract Session ID from URL path on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/').filter(p => p.trim() !== '');
      const id = parts[parts.length - 1];
      if (id && id !== '[id]') {
        // Sanitize to only letters and numbers (removes dots, slashes, trailing carriage returns)
        const sanitizedId = id.replace(/[^a-zA-Z0-9-]/g, '');
        setSessionId(sanitizedId);
      }
    }
  }, []);

  // Initialize mobile camera and peer connection
  useEffect(() => {
    if (typeof window === 'undefined' || !sessionId) return;

    let localStream: MediaStream | null = null;
    let peerInstance: any = null;

    const startMobileStream = async () => {
      setStatus('loading');
      
      try {
        // 1. Check if mediaDevices exists (blocked on HTTP insecure origins on mobile)
        if (!navigator.mediaDevices) {
          throw new Error('Insecure Connection: Camera access is blocked on HTTP. Please connect via HTTPS (e.g. using ngrok or localtunnel).');
        }

        // Try to request selected camera mode, otherwise fallback to any video camera
        try {
          localStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
            audio: false,
          });
        } catch (err) {
          // Fallback to default video camera
          localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        setStream(localStream);

        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
          videoRef.current.play();
        }

        // 2. Load PeerJS and connect
        const Peer = await loadPeerJS();
        
        // Random client ID for mobile
        const mobilePeerId = `airboard-mobile-${Math.random().toString(36).substring(2, 6)}`;
        peerInstance = new Peer(mobilePeerId, {
          debug: 1,
        });

        peerInstance.on('open', () => {
          // Call the desktop session peer
          const call = peerInstance.call(sessionId, localStream, {
            metadata: { facingMode }
          });
          
          call.on('stream', () => {
            // Stream accepted by desktop
            setStatus('connected');
          });

          call.on('close', () => {
            setStatus('idle');
          });

          call.on('error', (err: any) => {
            setStatus('error');
            setErrorMessage(`Call failed: ${err.message || err}`);
          });

          callRef.current = call;
          setStatus('connected'); // Fallback in case remote doesn't push reciprocal stream
        });

        peerInstance.on('error', (err: any) => {
          setStatus('error');
          setErrorMessage(`Peer connection error: ${err.type || err}`);
        });

        peerRef.current = peerInstance;

      } catch (err: unknown) {
        setStatus('error');
        const errMsg = err instanceof Error ? err.message : String(err);
        setErrorMessage(`Camera access denied or network issue: ${errMsg}`);
      }
    };

    startMobileStream();

    return () => {
      if (callRef.current) {
        callRef.current.close();
      }
      if (peerInstance) {
        peerInstance.destroy();
      }
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [sessionId, facingMode]);

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Mobile Top Header */}
      <header className="border-b border-slate-900 bg-slate-900/60 backdrop-blur-md p-4 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="text-blue-500" size={20} />
            <div>
              <h1 className="font-extrabold text-sm text-slate-200">AirBoard Controller</h1>
              <p className="text-[10px] text-slate-500">Session ID: {sessionId}</p>
            </div>
          </div>
          
          {/* Top-Right Status Pill & Switch Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-750 flex items-center gap-1.5 cursor-pointer text-xs font-semibold"
              title="Switch Front/Back Camera"
            >
              <RefreshCw size={12} className="animate-spin-slow" />
              <span>{facingMode === 'user' ? 'Front Cam' : 'Back Cam'}</span>
            </button>

            {status === 'loading' && <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">Loading</span>}
            {status === 'connected' && <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">Streaming</span>}
            {status === 'idle' && <span className="text-slate-400 bg-slate-800 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">Idle</span>}
            {status === 'error' && <span className="text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">Error</span>}
          </div>
        </div>

        {/* Prominent Header Banner if error occurs */}
        {status === 'error' && (
          <div className="p-3 bg-red-950/80 border border-red-500/40 text-red-200 text-xs rounded-xl flex items-start gap-2 animate-bounce">
            <AlertTriangle className="shrink-0 text-red-400" size={16} />
            <div>
              <p className="font-bold">Camera Connection Failed</p>
              <p className="opacity-90 text-[10px] mt-0.5 leading-snug">{errorMessage}</p>
            </div>
          </div>
        )}
      </header>

      {/* Main viewport */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover transition-all duration-300 ${
            status === 'connected' ? 'opacity-80' : 'opacity-20'
          } ${facingMode === 'user' ? 'scale-x-[-1]' : 'scale-x-[1]'}`}
        />

        {/* State Indicators overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-3">
              <RefreshCw size={36} className="animate-spin text-blue-500" />
              <p className="text-sm font-semibold">Connecting to Desktop Canvas...</p>
            </div>
          )}

          {status === 'connected' && (
            <div className="flex flex-col items-center gap-2 bg-slate-900/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-800 pointer-events-auto">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle size={16} /> Live Streaming
              </div>
              <p className="text-[11px] text-slate-400 max-w-[200px] leading-snug">
                Point this camera at your hand to control the desktop canvas.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-3 bg-red-950/20 backdrop-blur-md p-6 rounded-2xl border border-red-500/20 pointer-events-auto max-w-[280px]">
              <AlertTriangle className="text-red-400" size={32} />
              <div>
                <p className="text-sm font-bold text-red-400">Connection Failed</p>
                <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                  {errorMessage}
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 bg-slate-900 border border-slate-850 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
              >
                Retry Connection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
