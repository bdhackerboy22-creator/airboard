export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface HandData {
  landmarks: Landmark[];
  handedness: 'Left' | 'Right';
  score: number;
}

export interface TrackingStatus {
  cameraConnected: boolean;
  handDetected: boolean;
  drawingEnabled: boolean;
  fps: number;
  fingerCoordinates: { x: number; y: number } | null;
}
