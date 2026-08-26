import React from 'react';
import { LayoutDashboard, Settings, HelpCircle, Shield, History, Camera, Paintbrush, Smartphone } from 'lucide-react';
import { useCameraStore } from '../store/cameraStore';
import { useBoardStore } from '../store/boardStore';

export function Sidebar() {
  const { setQrModalOpen } = useCameraStore();
  const { workspaceMode, setWorkspaceMode } = useBoardStore();

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 text-slate-200 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-blue-500/30 animate-pulse">
          A
        </div>
        <div>
          <h1 className="font-extrabold text-lg bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            AirBoard
          </h1>
          <span className="text-[10px] text-blue-500 uppercase tracking-widest font-semibold">
            AI Virtual Canvas
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2.5">
        <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Workspace Modes
        </div>
        
        <button
          onClick={() => setWorkspaceMode('whiteboard')}
          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium transition-all text-left cursor-pointer ${
            workspaceMode === 'whiteboard'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
              : 'hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Paintbrush size={18} />
          Whiteboard Canvas
        </button>

        <button
          onClick={() => setWorkspaceMode('android')}
          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium transition-all text-left cursor-pointer ${
            workspaceMode === 'android'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
              : 'hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Smartphone size={18} />
          Android Emulator
        </button>

        <div className="h-px bg-slate-800/80 my-4" />

        <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Connections
        </div>

        <button
          onClick={() => setQrModalOpen(true)}
          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition-all border border-transparent text-left cursor-pointer"
        >
          <Camera size={18} />
          Link Mobile Cam
        </button>

        <a
          href="#"
          className="flex items-center gap-3.5 px-4 py-3 rounded-xl hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition-all"
        >
          <History size={20} />
          History
        </a>

        <a
          href="#"
          className="flex items-center gap-3.5 px-4 py-3 rounded-xl hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition-all"
        >
          <Settings size={20} />
          Settings
        </a>
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 space-y-3.5">
        <div className="flex items-center justify-between text-xs text-slate-500 px-2">
          <span className="flex items-center gap-1">
            <Shield size={12} /> Secure Connection
          </span>
          <span>v1.0.0</span>
        </div>
        <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800/80 flex items-center gap-2">
          <HelpCircle size={16} className="text-slate-400" />
          <div className="text-[11px] text-slate-400 leading-tight">
            Need help? Point index finger to draw. Open hand to erase.
          </div>
        </div>
      </div>
    </aside>
  );
}
