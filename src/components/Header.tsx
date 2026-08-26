import React from 'react';
import { Wifi, WifiOff, Maximize2, Minimize2, Smartphone } from 'lucide-react';
import { useCameraStore } from '../store/cameraStore';

export function Header() {
  const { isCameraActive, cameraStatus, setQrModalOpen } = useCameraStore();
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md px-6 flex items-center justify-between shrink-0 select-none">
      {/* Search / Section title */}
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Air Gesture Dashboard
        </h2>
        <span className="h-4 w-px bg-slate-800" />
        <div className="flex items-center gap-2">
          {isCameraActive ? (
            <span className="flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Tracking Active
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs bg-slate-800 text-slate-400 border border-slate-700 px-2.5 py-1 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              Tracking Offline
            </span>
          )}
        </div>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setQrModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-all cursor-pointer"
        >
          <Smartphone size={14} />
          <span>Connect Mobile</span>
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>
    </header>
  );
}
