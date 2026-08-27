/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useEffect } from 'react';
import { Camera, CameraOff, RefreshCw, AlertCircle, Cpu } from 'lucide-react';
import { useCameraStore } from '../store/cameraStore';
import { useCamera } from '../hooks/useCamera';
import { useHandTracking } from '../hooks/useHandTracking';
import { GestureType } from '../lib/gesture';
import { loadPeerJS } from '../lib/peerjs';

interface CameraViewProps {
  onTrackingFrame: (x: number, y: number, gesture: GestureType) => void;
}

export function CameraView({ onTrackingFrame }: CameraViewProps) {
  const {
    isCameraActive,
    cameraStatus,
    fps,
    handDetected,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    sessionId,
    setSessionId,
    isMobileConnected,
    setIsMobileConnected,
    remoteFacingMode,
    setRemoteFacingMode,
    setActiveStream,
    setCameraActive,
    setCameraStatus,
    addLog,
  } = useCameraStore();

  const { startCamera, stopCamera, refreshDevices } = useCamera();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const peerRef = useRef<any>(null);

  // Hook to handle hand tracking initialization and loop
  useHandTracking({
    videoElement: videoRef.current,
    canvasOverlayElement: canvasRef.current,
    onTrackingFrame,
  });

  // Setup PeerJS for WebRTC Mobile camera stream
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let peerInstance: any = null;

    const initPeer = async () => {
      // Destroy any existing peer first to release the ID
      if (peerRef.current) {
        try {
          peerRef.current.destroy();
        } catch (e) {}
        peerRef.current = null;
      }

      try {
        const Peer = await loadPeerJS();
        
        // Setup peer connection with dynamically generated unique ID to avoid collision
        const newPeer = new Peer({
          debug: 1,
        });

        newPeer.on('open', (id: string) => {
          setSessionId(id); // Save the actual active ID to the store
          addLog(`WebRTC Channel opened. Ready for mobile streaming. ID: ${id}`);
        });

        // Listen for incoming calls (incoming mobile streams)
        newPeer.on('call', (call: any) => {
          addLog('Incoming mobile stream call detected...');
          
          const facingMode = call.metadata?.facingMode || 'environment';
          setRemoteFacingMode(facingMode);
          
          // Answer call (no local video/audio needed)
          call.answer();

          call.on('stream', (remoteStream: MediaStream) => {
            addLog('Mobile camera stream successfully connected!');
            
            const video = videoRef.current;
            if (video) {
              video.srcObject = remoteStream;
              
              video.onloadedmetadata = () => {
                video.play();
              };
            }

            setIsMobileConnected(true);
            setCameraActive(true);
            setCameraStatus('active');
            setActiveStream(remoteStream);
          });

          call.on('close', () => {
            addLog('Mobile camera stream closed.');
            setIsMobileConnected(false);
            setActiveStream(null);
            stopCamera();
          });

          call.on('error', (err: any) => {
            addLog(`Mobile connection error: ${err.message || err}`);
            setIsMobileConnected(false);
            setActiveStream(null);
          });
        });

        newPeer.on('error', (err: any) => {
          addLog(`WebRTC Peer error: ${err.message || err.type || err}`);
        });

        peerRef.current = newPeer;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        addLog(`Failed to initialize WebRTC PeerJS: ${errMsg}`);
      }
    };

    initPeer();

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
        addLog('WebRTC Peer channel closed.');
      }
    };
  }, [setIsMobileConnected, setCameraActive, setCameraStatus, addLog, stopCamera]);

  // Handle active status to stop stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleToggleCamera = async () => {
    if (isMobileConnected) {
      // Disconnect mobile call
      setIsMobileConnected(false);
      stopCamera();
      setActiveStream(null);
      addLog('Disconnected mobile camera.');
      return;
    }

    if (isCameraActive) {
      stopCamera();
      setActiveStream(null);
    } else {
      const stream = await startCamera(videoRef.current);
      if (stream) {
        setActiveStream(stream);
      }
    }
  };

  const handleDeviceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedDeviceId(id);
    if (isCameraActive) {
      // Restart camera with new device
      setTimeout(async () => {
        const stream = await startCamera(videoRef.current);
        if (stream) {
          setActiveStream(stream);
        }
      }, 100);
    }
  };

  const shouldMirror = !isMobileConnected || remoteFacingMode === 'user';

  return (
    <div className="flex flex-col bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl h-full">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2">
          <Camera size={18} className="text-blue-500" />
          <span className="font-semibold text-slate-200 text-sm">Camera Tracking</span>
        </div>

        {/* FPS Indicator */}
        <div className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-md">
          <Cpu size={12} className="text-slate-400" />
          <span>FPS: {fps}</span>
        </div>
      </div>

      {/* Video Preview viewport */}
      <div className="flex-1 bg-slate-950 relative min-h-[220px] flex items-center justify-center overflow-hidden group">
        {/* Mirror effect wrapper */}
        <div className={`absolute inset-0 w-full h-full ${shouldMirror ? 'scale-x-[-1]' : 'scale-x-[1]'}`}>
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isCameraActive && cameraStatus === 'active' ? 'opacity-70' : 'opacity-0 pointer-events-none'
            }`}
          />
        </div>

        {/* Skeletal Landmark Overlay (Mirrored for user unless mobile back camera) */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className={`absolute inset-0 w-full h-full object-cover pointer-events-none z-10 ${shouldMirror ? 'scale-x-[-1]' : 'scale-x-[1]'}`}
        />

        {/* Standby & Loading states */}
        {!isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-3 p-6 text-center select-none">
            <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:scale-105 transition-all">
              <CameraOff size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-300">Camera is Offline</p>
              <p className="text-xs text-slate-500 max-w-[200px] mt-1">
                Turn on the webcam to start air sketching.
              </p>
            </div>
          </div>
        )}

        {isCameraActive && cameraStatus === 'loading' && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-slate-300 gap-3 z-20">
            <RefreshCw size={28} className="animate-spin text-blue-500" />
            <span className="text-xs font-medium">Initializing camera feed...</span>
          </div>
        )}

        {isCameraActive && cameraStatus === 'error' && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center text-red-400 gap-3 p-6 text-center z-20">
            <AlertCircle size={32} />
            <div>
              <p className="text-sm font-semibold">Camera Error</p>
              <p className="text-xs text-slate-500 max-w-[220px] mt-1">
                Could not access camera device. Ensure permission is granted.
              </p>
            </div>
          </div>
        )}

        {/* Hand status indicator pin */}
        {isCameraActive && cameraStatus === 'active' && (
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-full text-[11px] font-semibold">
            <span
              className={`w-2 h-2 rounded-full ${
                handDetected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="text-slate-300">
              {handDetected ? 'Hand Tracked' : 'Searching for hand...'}
            </span>
          </div>
        )}
      </div>

      {/* Camera selection controls */}
      <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 flex flex-col gap-3">
        {/* Device selector */}
        <div className="flex gap-2">
          <select
            value={selectedDeviceId}
            onChange={handleDeviceChange}
            disabled={devices.length === 0}
            className="flex-1 text-xs bg-slate-900 border border-slate-800 text-slate-300 rounded-lg p-2.5 outline-none hover:border-slate-700 focus:border-blue-500/50 transition-all disabled:opacity-55"
          >
            {devices.length === 0 ? (
              <option>No cameras detected</option>
            ) : (
              devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId.substring(0, 5)}`}
                </option>
              ))
            )}
          </select>
          
          <button
            onClick={refreshDevices}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-all shrink-0 cursor-pointer"
            title="Refresh Camera Devices"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Toggle Button */}
        <button
          onClick={handleToggleCamera}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
            isCameraActive
              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 hover:shadow-blue-500/30'
          }`}
        >
          {isCameraActive ? (
            <>
              <CameraOff size={14} /> Stop camera tracking
            </>
          ) : (
            <>
              <Camera size={14} /> Start camera tracking
            </>
          )}
        </button>
      </div>
    </div>
  );
}
