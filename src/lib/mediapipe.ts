/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * MediaPipe CDN loader and helper
 */

// Declare globals on window object
declare global {
  interface Window {
    Hands: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    HAND_CONNECTIONS: any;
  }
}

const MEDIAPIPE_HANDS_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
const MEDIAPIPE_CAMERA_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';

/**
 * Dynamically loads a script file and returns a promise
 */
function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script is already added
    const existing = document.querySelector(`script[src="${url}"]`);
    if (existing) {
      if ((existing as any).ready) {
        resolve();
      } else {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', (e) => reject(e));
      }
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.crossOrigin = 'anonymous';
    
    script.addEventListener('load', () => {
      (script as any).ready = true;
      resolve();
    });
    
    script.addEventListener('error', (e) => {
      reject(e);
    });

    document.head.appendChild(script);
  });
}

/**
 * Ensures MediaPipe Hands and Camera libraries are loaded from CDN
 */
export async function loadMediaPipe(): Promise<{ Hands: any; Camera: any }> {
  if (typeof window === 'undefined') {
    throw new Error('MediaPipe can only be loaded in the browser.');
  }

  if (window.Hands && window.Camera) {
    return { Hands: window.Hands, Camera: window.Camera };
  }

  // Load both scripts in parallel
  await Promise.all([
    loadScript(MEDIAPIPE_HANDS_CDN),
    loadScript(MEDIAPIPE_CAMERA_CDN),
  ]);

  if (!window.Hands || !window.Camera) {
    throw new Error('MediaPipe scripts loaded but global objects are missing.');
  }

  return { Hands: window.Hands, Camera: window.Camera };
}
