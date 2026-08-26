import { useEffect, useRef, useCallback } from 'react';
import { useBoardStore } from '../store/boardStore';
import { drawAllStrokes } from '../lib/drawing';

export function useCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokes = useBoardStore((state) => state.strokes);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    
    // Support High-DPI screens (Retina displays)
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      
      // Redraw everything with the new dimensions
      drawAllStrokes(ctx, strokes, rect.width, rect.height);
    }
  }, [strokes]);

  // Handle auto-resize on window resize
  useEffect(() => {
    if (typeof window === 'undefined') return;

    resizeCanvas();
    
    // Create a ResizeObserver to observe changes in parent dimensions
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    
    resizeObserver.observe(canvas.parentElement);

    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      resizeObserver.disconnect();
    };
  }, [resizeCanvas]);

  // Redraw when strokes array changes in store
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      const rect = canvas.getBoundingClientRect();
      drawAllStrokes(ctx, strokes, rect.width, rect.height);
    }
  }, [strokes]);

  return {
    canvasRef,
    resizeCanvas,
  };
}
