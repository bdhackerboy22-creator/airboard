import { Stroke, Point } from '../types/drawing';

/**
 * Draws a single stroke on the canvas using quadratic curves for smooth lines.
 * Uses absolute pixel coordinates to prevent squishing or scaling.
 */
export function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke
): void {
  const points = stroke.points;
  if (points.length === 0) return;

  ctx.beginPath();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  if (stroke.tool === 'eraser') {
    ctx.strokeStyle = '#ffffff'; // Eraser matches whiteboard white background
    ctx.lineWidth = stroke.size * 3; // Eraser is wider
    ctx.globalCompositeOperation = 'destination-out'; // This cuts into drawings
  } else {
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.globalCompositeOperation = 'source-over';
  }

  const startX = points[0].x;
  const startY = points[0].y;

  if (points.length === 1) {
    // Draw a single dot
    ctx.arc(startX, startY, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = stroke.tool === 'eraser' ? '#ffffff' : stroke.color;
    ctx.fill();
    return;
  }

  ctx.moveTo(startX, startY);

  // Draw quadratic curves for smoothing
  let i;
  for (i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
  }

  // Curve to the last point
  ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
  
  // Reset composite operation
  ctx.globalCompositeOperation = 'source-over';
}

/**
 * Redraws all strokes on the canvas.
 */
export function drawAllStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  canvasWidth?: number,
  canvasHeight?: number
): void {
  // Clear the canvas
  const w = canvasWidth || ctx.canvas.width;
  const h = canvasHeight || ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Redraw every stroke using absolute coordinates
  strokes.forEach((stroke) => {
    drawStroke(ctx, stroke);
  });
}

/**
 * Draws a tracking cursor corresponding to the finger location.
 */
export function drawCursor(
  ctx: CanvasRenderingContext2D,
  point: Point,
  size: number,
  color: string,
  isDrawing: boolean,
  canvasWidth: number,
  canvasHeight: number
): void {
  // Since points inside store are normalized (0 to 1), map cursor position to actual size
  const x = point.x * canvasWidth;
  const y = point.y * canvasHeight;

  ctx.save();
  ctx.beginPath();
  
  if (isDrawing) {
    // Pulsing drawing cursor
    ctx.arc(x, y, size / 2 + 4, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    // Hover cursor (hollow circle with target dot)
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#3b82f6';
    ctx.fill();
  }
  
  ctx.restore();
}
export function drawConnectors(ctx: CanvasRenderingContext2D, landmarks: any, connections: any) {
  // no-op, helper fallback
}
export function drawLandmarks(ctx: CanvasRenderingContext2D, landmarks: any) {
  // no-op, helper fallback
}
