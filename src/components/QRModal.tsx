import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Wifi, Copy, Check } from 'lucide-react';
import { useCameraStore } from '../store/cameraStore';

export function QRModal() {
  const { qrModalOpen, setQrModalOpen, sessionId, addLog } = useCameraStore();
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    if (qrModalOpen) {
      addLog(`QR Code generated. Session ID: ${sessionId}`);
    }
  }, [qrModalOpen, sessionId, addLog]);

  useEffect(() => {
    if (sessionId) {
      // Force QR Code to point to the local network IP so mobile devices can access it directly
      const origin = 'http://192.168.1.121:3000';
      setQrUrl(`${origin}/mobile/${sessionId}`);
    }
  }, [sessionId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(qrUrl || sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQrModalOpen(false)}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl flex flex-col items-center select-none"
          >
            {/* Close Button */}
            <button
              onClick={() => setQrModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Header Icon */}
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-500 flex items-center justify-center mb-4">
              <Smartphone size={24} />
            </div>

            <h3 className="font-bold text-lg text-slate-200 text-center mb-1">
              Link Mobile Camera
            </h3>
            
            <p className="text-xs text-slate-400 text-center max-w-[240px] leading-relaxed mb-6">
              Scan this QR code with your mobile browser to stream your phone camera.
            </p>

            {/* Dynamic QR Code Frame */}
            <div className="p-3 bg-white rounded-2xl mb-6 shadow-inner relative group border border-slate-200 flex items-center justify-center w-48 h-48">
              {qrUrl ? (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrUrl)}&color=15-23-42&bgcolor=255-255-255`}
                  alt="Scan to link camera"
                  className="w-40 h-40"
                  loading="lazy"
                />
              ) : (
                <div className="w-40 h-40 bg-slate-100 animate-pulse rounded-lg" />
              )}
              
              {/* Scan overlays */}
              <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl flex items-center justify-center">
                <Wifi className="text-blue-500 animate-bounce" size={32} />
              </div>
            </div>

            {/* Session ID display */}
            <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
                    Session Code
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-300">
                    {sessionId}
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
                  title="Copy Session ID"
                >
                  {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                </button>
              </div>
              
              <div className="border-t border-slate-900 pt-2 flex items-center justify-between">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                  Mobile Link
                </span>
                <a
                  href={`/mobile/${sessionId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-blue-400 hover:underline font-mono truncate max-w-[180px]"
                >
                  Open Stream View
                </a>
              </div>
            </div>

            {/* Status bar */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className={`w-2 h-2 rounded-full ${useCameraStore.getState().isMobileConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500 animate-pulse'}`} />
              <span>
                {useCameraStore.getState().isMobileConnected ? 'Mobile Stream Connected' : 'Waiting for mobile connection...'}
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
