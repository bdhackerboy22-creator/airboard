import { Point } from '../types/drawing';
import { SMOOTHING_FACTOR, JITTER_THRESHOLD } from '../utils/constants';
import { getDistance } from '../utils/math';

export class CoordinateSmoother {
  private prevPoint: Point | null = null;
  private alpha: number;
  private jitterThreshold: number;

  constructor(alpha = SMOOTHING_FACTOR, jitterThreshold = JITTER_THRESHOLD) {
    this.alpha = alpha;
    this.jitterThreshold = jitterThreshold;
  }

  /**
   * Smooths incoming raw coordinates using exponential smoothing and a jitter threshold filter.
   */
  public smooth(rawPoint: Point): Point {
    if (!this.prevPoint) {
      this.prevPoint = rawPoint;
      return rawPoint;
    }

    // Measure distance in normalized coordinates (0 to 1) to determine jitter
    const distance = getDistance(rawPoint, this.prevPoint);

    // If change is smaller than the jitter threshold, keep the previous point (ignore jitter)
    if (distance < this.jitterThreshold) {
      return this.prevPoint;
    }

    // Apply Exponential Smoothing: S_t = alpha * Y_t + (1 - alpha) * S_t-1
    const smoothedPoint: Point = {
      x: this.alpha * rawPoint.x + (1 - this.alpha) * this.prevPoint.x,
      y: this.alpha * rawPoint.y + (1 - this.alpha) * this.prevPoint.y,
    };

    this.prevPoint = smoothedPoint;
    return smoothedPoint;
  }

  public reset(): void {
    this.prevPoint = null;
  }
}
