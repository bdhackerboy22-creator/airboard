import { useRef, useCallback } from 'react';
import { useBoardStore } from '../store/boardStore';
import { Point, Stroke, ToolType } from '../types/drawing';
import { GestureType } from '../lib/gesture';
import { drawStroke, drawAllStrokes } from '../lib/drawing';

export function useDrawing(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const { color, size, tool, addStroke, strokes } = useBoardStore();
  
  // Track active drawing points locally to avoid constant state updates in Zustand
  const localPointsRef = useRef<Point[]>([]);
  const isDrawingRef = useRef<boolean>(false);
  
  // Track active drawing tool for this current stroke (so it doesn't change mid-line)
  const activeToolRef = useRef<ToolType>('pen');

  // Start a new line/stroke
  const startStroke = useCallback((initialTool: ToolType) => {
    isDrawingRef.current = true;
    activeToolRef.current = initialTool;
    localPointsRef.current = [];
  }, []);

  // Finish a stroke and commit to store
  const endStroke = useCallback(() => {
    if (!isDrawingRef.current) return;
    
    isDrawingRef.current = false;
    
    if (localPointsRef.current.length > 0) {
      const newStroke: Stroke = {
        points: [...localPointsRef.current],
        color,
        size,
        tool: activeToolRef.current,
      };
      
      // Save to global state (Zustand store)
      addStroke(newStroke);
    }
    
    localPointsRef.current = [];
  }, [color, size, addStroke]);

  // Handle a new drawing point
  const addPoint = useCallback(
    (point: Point) => {
      if (!isDrawingRef.current) return;
      
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      localPointsRef.current.push(point);
      
      // Draw this segment immediately on the canvas in absolute pixels
      const currentTempStroke: Stroke = {
        points: localPointsRef.current.slice(-2), // Draw only last segment
        color,
        size,
        tool: activeToolRef.current,
      };
      
      drawStroke(ctx, currentTempStroke);
    },
    [canvasRef, color, size]
  );

  // Callback to receive points from hand tracking
  const handleHandMove = useCallback(
    (x: number, y: number, gesture: GestureType) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const isDrawingGesture = gesture === 'draw';
      const isErasingGesture = gesture === 'erase';

      // Map normalized relative coordinates (0 to 1) to absolute canvas coordinates
      const rect = canvas.getBoundingClientRect();
      const absX = x * rect.width;
      const absY = y * rect.height;

      if (isDrawingGesture || isErasingGesture) {
        const targetTool: ToolType = isErasingGesture ? 'eraser' : tool;

        // If the gesture changes tool mid-stroke, complete the old one and start a new one
        if (isDrawingRef.current && activeToolRef.current !== targetTool) {
          endStroke();
        }

        if (!isDrawingRef.current) {
          startStroke(targetTool);
        }
        
        addPoint({ x: absX, y: absY });
      } else {
        if (isDrawingRef.current) {
          endStroke();
          // Redraw everything to ensure clean line connections
          const ctx = canvas.getContext('2d');
          if (ctx) {
            drawAllStrokes(ctx, strokes, rect.width, rect.height);
          }
        }
      }
    },
    [canvasRef, startStroke, addPoint, endStroke, strokes, tool]
  );

  // Mouse/Touch controls (fallback and testing support)
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    startStroke(tool);
    addPoint({ x, y });
  }, [canvasRef, startStroke, addPoint, tool]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    addPoint({ x, y });
  }, [canvasRef, addPoint]);

  const handleMouseUp = useCallback(() => {
    endStroke();
  }, [endStroke]);

  return {
    handleHandMove,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isDrawing: isDrawingRef.current,
  };
}
