import React from 'react';
import { Activity, Move, CheckCircle2, XCircle, Sparkles, Terminal } from 'lucide-react';
import { useCameraStore } from '../store/cameraStore';
import { useBoardStore } from '../store/boardStore';

export function StatusPanel() {
  const {
    isCameraActive,
    cameraStatus,
    handDetected,
    drawingEnabled,
    fps,
    fingerCoordinates,
    logs,
  } = useCameraStore();

  const { color, size, tool } = useBoardStore();

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 p-4 shadow-2xl backdrop-blur-xl shrink-0 select-none">
      {/* 1. Track Status Indicators */}
      <div className="flex flex-col gap-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
          <Activity size={12} className="text-blue-500" /> System Status
        </span>
        
        <div className="space-y-2 mt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Camera:</span>
            {isCameraActive && cameraStatus === 'active' ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 size={12} /> ONLINE
              </span>
            ) : (
              <span className="text-red-400 font-semibold flex items-center gap-1">
                <XCircle size={12} /> OFFLINE
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Hand Detection:</span>
            <span className={handDetected ? 'text-emerald-400 font-semibold' : 'text-slate-500 font-semibold'}>
              {handDetected ? 'DETECTED' : 'NOT FOUND'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Drawing Action:</span>
            <span className={drawingEnabled ? 'text-blue-400 font-semibold flex items-center gap-1 animate-pulse' : 'text-slate-500 font-semibold'}>
              {drawingEnabled ? 'DRAWING (PEN DOWN)' : 'HOVER (PEN UP)'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Coordinates & Feed stats */}
      <div className="flex flex-col gap-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
          <Move size={12} className="text-blue-500" /> Tracking Output
        </span>
        
        <div className="space-y-2 mt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Coordinates:</span>
            <span className="font-mono text-slate-300">
              {fingerCoordinates
                ? `X: ${Math.round(fingerCoordinates.x * 1000)}, Y: ${Math.round(fingerCoordinates.y * 1000)}`
                : 'N/A'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Camera FPS:</span>
            <span className="font-mono text-slate-300">{isCameraActive ? fps : 0} Hz</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Gesture Detected:</span>
            <span className="font-mono text-slate-300">
              {handDetected
                ? drawingEnabled
                  ? 'POINT_DRAW'
                  : 'PEACE_HOVER'
                : 'NONE'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Brush / Tool config */}
      <div className="flex flex-col gap-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={12} className="text-blue-500" /> Active Config
        </span>
        
        <div className="space-y-2 mt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Active Tool:</span>
            <span className="font-semibold text-slate-300 capitalize">{tool}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Brush Size:</span>
            <span className="font-mono text-slate-300">{size}px</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Active Color:</span>
            <div className="flex items-center gap-1.5">
              <span
                className="w-3.5 h-3.5 rounded-full border border-slate-700 block"
                style={{ backgroundColor: tool === 'eraser' ? '#ffffff' : color }}
              />
              <span className="font-mono text-[10px] text-slate-400">
                {tool === 'eraser' ? '#FFFFFF' : color}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Terminal Console Logs */}
      <div className="flex flex-col gap-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
          <Terminal size={12} className="text-blue-500" /> Connection Log
        </span>
        
        <div className="flex-1 mt-1 text-[10px] font-mono text-slate-400 overflow-y-auto max-h-[64px] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {logs.length === 0 ? (
            <p className="text-slate-600">No events.</p>
          ) : (
            logs.map((log, i) => (
              <p key={i} className="truncate">
                &gt; {log}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
