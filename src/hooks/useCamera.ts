import { useCallback, useEffect, useRef } from 'react';
import { useCameraStore } from '../store/cameraStore';

export function useCamera() {
  const {
    selectedDeviceId,
    setDevices,
    setSelectedDeviceId,
    setCameraActive,
    setCameraStatus,
    addLog,
  } = useCameraStore();

  const streamRef = useRef<MediaStream | null>(null);

  // Enumerate cameras
  const refreshDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setDevices(videoDevices);
      
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addLog(`Error enumerating cameras: ${errorMessage}`);
    }
  }, [selectedDeviceId, setDevices, setSelectedDeviceId, addLog]);

  // Request permissions and list devices
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const initDevices = async () => {
      try {
        if (!navigator.mediaDevices) {
          throw new Error('Camera device access is blocked or unavailable on insecure HTTP origins. Please use localhost or HTTPS.');
        }
        await navigator.mediaDevices.getUserMedia({ video: true });
        await refreshDevices();
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setCameraStatus('error');
        addLog(`Camera permission denied: ${errorMessage}`);
      }
    };

    initDevices();

    // Listen for device changes safely
    if (navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
    }
    
    return () => {
      if (navigator.mediaDevices) {
        navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
      }
    };
  }, [refreshDevices, setCameraStatus, addLog]);

  // Start Camera Stream
  const startCamera = useCallback(
    async (videoElement: HTMLVideoElement | null): Promise<MediaStream | null> => {
      if (!videoElement) return null;

      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      setCameraStatus('loading');
      addLog('Starting camera stream...');

      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId }, width: 640, height: 480 }
          : { width: 640, height: 480 },
        audio: false,
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        videoElement.srcObject = stream;
        
        // Wait for video metadata to load to ensure it's playing
        await new Promise<void>((resolve) => {
          videoElement.onloadedmetadata = () => {
            videoElement.play();
            resolve();
          };
        });

        setCameraActive(true);
        setCameraStatus('active');
        addLog('Camera started successfully.');
        return stream;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setCameraStatus('error');
        addLog(`Failed to start camera: ${errorMessage}`);
        return null;
      }
    },
    [selectedDeviceId, setCameraActive, setCameraStatus, addLog]
  );

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCameraStatus('idle');
    addLog('Camera stopped.');
  }, [setCameraActive, setCameraStatus, addLog]);

  return {
    startCamera,
    stopCamera,
    refreshDevices,
  };
}
