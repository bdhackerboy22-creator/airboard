import { useEffect, useRef, useCallback } from 'react';
import { useCameraStore } from '../store/cameraStore';
import { loadMediaPipe } from '../lib/mediapipe';
import { detectGesture, GestureType } from '../lib/gesture';
import { CoordinateSmoother } from '../lib/smoothing';

interface UseHandTrackingProps {
  videoElement: HTMLVideoElement | null;
  canvasOverlayElement: HTMLCanvasElement | null;
  onTrackingFrame: (x: number, y: number, gesture: GestureType) => void;
  onGestureChange?: (newGesture: GestureType) => void;
}

export function useHandTracking({
  videoElement,
  canvasOverlayElement,
  onTrackingFrame,
  onGestureChange,
}: UseHandTrackingProps) {
  const {
    isCameraActive,
    setHandDetected,
    setDrawingEnabled,
    setFingerCoordinates,
    setFps,
    addLog,
  } = useCameraStore();

  const handsRef = useRef<any>(null);
  const smootherRef = useRef(new CoordinateSmoother());
  const prevGestureRef = useRef<GestureType>('none');
  
  // FPS calculation variables
  const fpsFrameCountRef = useRef(0);
  const fpsLastTimeRef = useRef(0);

  // Initialize MediaPipe Hands
  const initHandTracking = useCallback(async () => {
    try {
      const { Hands } = await loadMediaPipe();
      
      const hands = new Hands({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });

      hands.onResults((results: any) => {
        // Calculate FPS
        const now = performance.now();
        fpsFrameCountRef.current++;
        if (now - fpsLastTimeRef.current >= 1000) {
          setFps(Math.round((fpsFrameCountRef.current * 1000) / (now - fpsLastTimeRef.current)));
          fpsFrameCountRef.current = 0;
          fpsLastTimeRef.current = now;
        }

        // Draw video/landmark overlay if canvas overlay exists
        const ctx = canvasOverlayElement?.getContext('2d');
        if (canvasOverlayElement && ctx) {
          ctx.clearRect(0, 0, canvasOverlayElement.width, canvasOverlayElement.height);
          
          // Draw connection skeleton if hand landmarks exist
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            
            // Draw MediaPipe skeleton connectors and joint dots if functions are loaded
            if (window.drawConnectors && window.drawLandmarks && window.HAND_CONNECTIONS) {
              window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {
                color: '#3b82f6',
                lineWidth: 3,
              });
              window.drawLandmarks(ctx, landmarks, {
                color: '#ec4899',
                lineWidth: 1,
                radius: 4,
              });
            } else {
              // Custom simple skeleton fallback drawing
              ctx.fillStyle = '#ec4899';
              landmarks.forEach((pt: any) => {
                ctx.beginPath();
                ctx.arc(pt.x * canvasOverlayElement.width, pt.y * canvasOverlayElement.height, 5, 0, 2 * Math.PI);
                ctx.fill();
              });
            }
          }
        }

        // Process landmarks
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          setHandDetected(true);
          const rawLandmarks = results.multiHandLandmarks[0];
          
          // Detect gesture using hand landmarks
          const currentGesture = detectGesture(rawLandmarks);
          
          // Trigger gesture change callback
          if (currentGesture !== prevGestureRef.current) {
            onGestureChange?.(currentGesture);
            prevGestureRef.current = currentGesture;
          }

          // Use index finger tip landmark #8
          const indexFingerTip = rawLandmarks[8];
          
          // Since camera is mirrored, flip X-axis coordinate to align drawing naturally (unless using mobile back camera)
          const { isMobileConnected, remoteFacingMode } = useCameraStore.getState();
          const shouldMirror = !isMobileConnected || remoteFacingMode === 'user';
          const mirroredX = shouldMirror ? 1 - indexFingerTip.x : indexFingerTip.x;
          
          // Apply smoothing filter to coordinates
          const smoothed = smootherRef.current.smooth({
            x: mirroredX,
            y: indexFingerTip.y,
          });

          // Update stores
          setFingerCoordinates({ x: smoothed.x, y: smoothed.y });
          setDrawingEnabled(currentGesture === 'draw');

          // Trigger frame callback
          onTrackingFrame(smoothed.x, smoothed.y, currentGesture);
        } else {
          setHandDetected(false);
          setFingerCoordinates(null);
          setDrawingEnabled(false);
          smootherRef.current.reset();
          
          if (prevGestureRef.current !== 'none') {
            onGestureChange?.('none');
            prevGestureRef.current = 'none';
          }
        }
      });

      handsRef.current = hands;
      addLog('MediaPipe Hands loaded successfully.');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addLog(`Failed to load MediaPipe Hands: ${errorMessage}`);
    }
  }, [canvasOverlayElement, setHandDetected, setDrawingEnabled, setFingerCoordinates, setFps, addLog, onGestureChange, onTrackingFrame]);

  // Handle camera and hands pipeline binding
  useEffect(() => {
    if (!isCameraActive || !videoElement) {
      return;
    }

    let animationFrameId: number;
    let isProcessing = false;

    const runPipeline = async () => {
      if (!handsRef.current) {
        await initHandTracking();
      }

      if (!handsRef.current || !videoElement) return;

      addLog('Hand tracking loop running (HMR/WebRTC support active).');
      fpsLastTimeRef.current = performance.now();

      const processFrame = async () => {
        if (!isCameraActive || !videoElement) return;

        // Process frames only when video metadata/stream is ready
        if (
          videoElement.readyState >= 2 && // HTMLMediaElement.HAVE_CURRENT_DATA or higher
          !videoElement.paused &&
          !videoElement.ended &&
          !isProcessing
        ) {
          isProcessing = true;
          try {
            await handsRef.current.send({ image: videoElement });
          } catch (err) {
            // Prevent frame crash loops
          }
          isProcessing = false;
        }

        animationFrameId = requestAnimationFrame(processFrame);
      };

      animationFrameId = requestAnimationFrame(processFrame);
    };

    runPipeline();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isCameraActive, videoElement, initHandTracking, addLog]);

  return {
    handsInstance: handsRef.current,
  };
}
