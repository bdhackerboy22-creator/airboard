import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { useCanvas } from '../hooks/useCanvas';
import { useDrawing } from '../hooks/useDrawing';
import { useCameraStore } from '../store/cameraStore';
import { useBoardStore } from '../store/boardStore';
import { drawCursor } from '../lib/drawing';
import { GestureType } from '../lib/gesture';

interface WhiteboardProps {
  // We'll expose drawing methods via ref so the parent or tracking loop can push coordinates
  onDrawingRef: (handlers: { handleHandMove: (x: number, y: number, gesture: GestureType) => void }) => void;
}

export const Whiteboard = forwardRef<{ clearCanvas: () => void }, WhiteboardProps>(
  ({ onDrawingRef }, ref) => {
    // Canvas size/DPI management
    const { canvasRef, resizeCanvas } = useCanvas();
    const { color, size, clearStrokes, showCameraBg } = useBoardStore();
    const { 
      activeStream, 
      isMobileConnected, 
      remoteFacingMode, 
      fingerCoordinates, 
      handDetected, 
      drawingEnabled 
    } = useCameraStore();

    // Drawing handlers
    const {
      handleHandMove,
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      isDrawing,
    } = useDrawing(canvasRef);

    const videoRef = useRef<HTMLVideoElement | null>(null);

    // Bind coordinate streams
    useEffect(() => {
      onDrawingRef({ handleHandMove });
    }, [handleHandMove, onDrawingRef]);

    // Bind background video stream
    useEffect(() => {
      const video = videoRef.current;
      if (video && activeStream) {
        video.srcObject = activeStream;
        video.onloadedmetadata = () => {
          video.play().catch((err) => console.log('Background video play failed:', err));
        };
      }
    }, [activeStream, showCameraBg]);

    // Cursor tracking overlay canvas
    const cursorCanvasRef = useRef<HTMLCanvasElement | null>(null);

    // Redraw tracking cursor on coordinates changes
    useEffect(() => {
      const cursorCanvas = cursorCanvasRef.current;
      if (!cursorCanvas) return;

      const ctx = cursorCanvas.getContext('2d');
      if (!ctx) return;

      // Clear cursor canvas
      ctx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);

      if (handDetected && fingerCoordinates) {
        const rect = cursorCanvas.getBoundingClientRect();
        
        // Render current visual cursor dot
        drawCursor(
          ctx,
          fingerCoordinates,
          size,
          color,
          drawingEnabled,
          rect.width,
          rect.height
        );
      }
    }, [fingerCoordinates, handDetected, drawingEnabled, size, color]);

    // Resize handlers for tracking cursor overlay
    useEffect(() => {
      const resizeCursorCanvas = () => {
        const cursorCanvas = cursorCanvasRef.current;
        if (!cursorCanvas || !cursorCanvas.parentElement) return;

        const parent = cursorCanvas.parentElement;
        const rect = parent.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        cursorCanvas.width = rect.width * dpr;
        cursorCanvas.height = rect.height * dpr;
        cursorCanvas.style.width = `${rect.width}px`;
        cursorCanvas.style.height = `${rect.height}px`;

        const ctx = cursorCanvas.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
        }
      };

      resizeCursorCanvas();

      window.addEventListener('resize', resizeCursorCanvas);
      
      const parent = cursorCanvasRef.current?.parentElement;
      const observer = parent ? new ResizeObserver(resizeCursorCanvas) : null;
      if (parent && observer) {
        observer.observe(parent);
      }

      return () => {
        window.removeEventListener('resize', resizeCursorCanvas);
        observer?.disconnect();
      };
    }, []);

    // Expose drawing clear
    useImperativeHandle(ref, () => ({
      clearCanvas: () => {
        clearStrokes();
      },
    }));

    const shouldMirror = !isMobileConnected || remoteFacingMode === 'user';

    return (
      <div 
        className={`flex-1 rounded-2xl relative shadow-xl overflow-hidden min-h-[400px] transition-all duration-300 ${
          showCameraBg 
            ? 'bg-slate-950 border border-slate-800 aspect-[4/3] max-h-[75vh] mx-auto w-full' 
            : 'bg-white border border-slate-200 w-full'
        }`}
      >
        {/* Live Camera Feed Background */}
        {showCameraBg && activeStream && (
          <video
            ref={videoRef}
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-300 opacity-60 ${
              shouldMirror ? 'scale-x-[-1]' : 'scale-x-[1]'
            }`}
          />
        )}

        {/* Main Drawing Canvas */}
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="absolute inset-0 cursor-crosshair z-10"
        />

        {/* Cursor Overlay Canvas */}
        <canvas
          ref={cursorCanvasRef}
          className="absolute inset-0 pointer-events-none z-20"
        />
        
        {/* Subtle grid pattern background */}
        <div 
          className={`absolute inset-0 pointer-events-none [background-size:16px_16px] ${
            showCameraBg 
              ? 'bg-[radial-gradient(#fff_1px,transparent_1px)] opacity-[0.05]' 
              : 'bg-[radial-gradient(#000_1px,transparent_1px)] opacity-[0.02]'
          }`} 
        />
      </div>
    );
  }
);

Whiteboard.displayName = 'Whiteboard';
