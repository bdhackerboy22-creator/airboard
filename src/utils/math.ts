/**
 * Calculate Euclidean distance between two 2D points
 */
export function getDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

/**
 * Linear interpolation between two values
 */
export function lerp(start: number, end: number, amt: number): number {
  return (1 - amt) * start + amt * end;
}

/**
 * Clamp a value between min and max
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
