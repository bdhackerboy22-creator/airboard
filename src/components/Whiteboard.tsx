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
    const { color, size, clearStrokes } = useBoardStore();

    // Drawing handlers
    const {
      handleHandMove,
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      isDrawing,
    } = useDrawing(canvasRef);

    // Bind coordinate streams
    useEffect(() => {
      onDrawingRef({ handleHandMove });
    }, [handleHandMove, onDrawingRef]);

    // Cursor tracking overlay canvas
    const cursorCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const { fingerCoordinates, handDetected, drawingEnabled } = useCameraStore();

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
        
        // Draw matching cursor
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

    // Track cursor canvas resize
    useEffect(() => {
      const resizeCursorCanvas = () => {
        const canvas = cursorCanvasRef.current;
        if (!canvas || !canvas.parentElement) return;

        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        const ctx = canvas.getContext('2d');
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

    return (
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl relative shadow-xl overflow-hidden min-h-[400px]">
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
        <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>
    );
  }
);

Whiteboard.displayName = 'Whiteboard';
