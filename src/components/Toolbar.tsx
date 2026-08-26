import React from 'react';
import {
  Undo2,
  Redo2,
  Trash2,
  Download,
  Paintbrush,
  Eraser,
  Smartphone,
  Info,
} from 'lucide-react';
import { useBoardStore } from '../store/boardStore';
import { useCameraStore } from '../store/cameraStore';
import { PRESET_COLORS, BRUSH_SIZES } from '../utils/constants';

interface ToolbarProps {
  onClear: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function Toolbar({ onClear, canvasRef }: ToolbarProps) {
  const {
    color,
    size,
    tool,
    setColor,
    setSize,
    setTool,
    undo,
    redo,
    strokes,
    undoStack,
    redoStack,
  } = useBoardStore();

  const { setQrModalOpen } = useCameraStore();

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas to draw with white background before downloading
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (tempCtx) {
      // Draw white background
      tempCtx.fillStyle = '#ffffff';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Draw existing canvas content on top
      tempCtx.drawImage(canvas, 0, 0);

      // Trigger download
      const image = tempCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `airboard-${Date.now()}.png`;
      link.href = image;
      link.click();
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-2xl backdrop-blur-xl shrink-0 select-none">
      {/* 1. Left Section: Tool & Colors */}
      <div className="flex items-center gap-3">
        {/* Pen/Eraser Toggle */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setTool('pen')}
            className={`p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
              tool === 'pen'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Brush Tool"
          >
            <Paintbrush size={16} />
          </button>
          
          <button
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
              tool === 'eraser'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Eraser Tool"
          >
            <Eraser size={16} />
          </button>
        </div>

        {/* Color Palette */}
        {tool === 'pen' && (
          <div className="flex items-center gap-1.5 px-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                  color === c
                    ? 'border-white scale-110 shadow-lg shadow-white/20'
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
                title={`Select ${c}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 2. Middle Section: Brush Size & Sliders */}
      <div className="flex items-center gap-3 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800/80">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Size
        </span>
        <div className="flex items-center gap-1">
          {BRUSH_SIZES.slice(0, 5).map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${
                size === s
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Right Section: Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Undo/Redo */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={undo}
            disabled={undoStack.length === 0}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
            title="Undo"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
            title="Redo"
          >
            <Redo2 size={16} />
          </button>
        </div>

        {/* Clear & Save */}
        <button
          onClick={onClear}
          disabled={strokes.length === 0}
          className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-red-400 hover:border-red-500/20 transition-all disabled:opacity-30 cursor-pointer"
          title="Clear Canvas"
        >
          <Trash2 size={16} />
        </button>

        <button
          onClick={handleDownload}
          disabled={strokes.length === 0}
          className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md shadow-blue-600/10 hover:shadow-blue-500/20 transition-all disabled:opacity-30 cursor-pointer"
          title="Download PNG"
        >
          <Download size={16} />
        </button>
      </div>
    </div>
  );
}
