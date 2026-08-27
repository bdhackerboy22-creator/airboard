import { create } from 'zustand';

interface CameraState {
  isCameraActive: boolean;
  cameraStatus: 'idle' | 'loading' | 'active' | 'error' | 'disconnected';
  fps: number;
  handDetected: boolean;
  drawingEnabled: boolean;
  fingerCoordinates: { x: number; y: number } | null;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  sessionId: string;
  qrModalOpen: boolean;
  isMobileConnected: boolean;
  remoteFacingMode: 'user' | 'environment';
  activeStream: MediaStream | null;
  logs: string[];

  // Actions
  setCameraActive: (active: boolean) => void;
  setCameraStatus: (status: 'idle' | 'loading' | 'active' | 'error' | 'disconnected') => void;
  setFps: (fps: number) => void;
  setHandDetected: (detected: boolean) => void;
  setDrawingEnabled: (enabled: boolean) => void;
  setFingerCoordinates: (coords: { x: number; y: number } | null) => void;
  setDevices: (devices: MediaDeviceInfo[]) => void;
  setSelectedDeviceId: (id: string) => void;
  setSessionId: (id: string) => void;
  setQrModalOpen: (open: boolean) => void;
  setIsMobileConnected: (connected: boolean) => void;
  setRemoteFacingMode: (mode: 'user' | 'environment') => void;
  setActiveStream: (stream: MediaStream | null) => void;
  addLog: (log: string) => void;
  clearLogs: () => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  isCameraActive: false,
  cameraStatus: 'idle',
  fps: 0,
  handDetected: false,
  drawingEnabled: false,
  fingerCoordinates: null,
  devices: [],
  selectedDeviceId: '',
  sessionId: '',
  qrModalOpen: false,
  isMobileConnected: false,
  remoteFacingMode: 'environment',
  activeStream: null,
  logs: ['System initialized.', 'Waiting for camera connection...'],

  setCameraActive: (active) => set({ isCameraActive: active }),
  setCameraStatus: (status) => set({ cameraStatus: status }),
  setFps: (fps) => set({ fps }),
  setHandDetected: (detected) => set({ handDetected: detected }),
  setDrawingEnabled: (enabled) => set({ drawingEnabled: enabled }),
  setFingerCoordinates: (coords) => set({ fingerCoordinates: coords }),
  setDevices: (devices) => set({ devices }),
  setSelectedDeviceId: (id) => set({ selectedDeviceId: id }),
  setSessionId: (id) => set({ sessionId: id }),
  setQrModalOpen: (open) => set({ qrModalOpen: open }),
  setIsMobileConnected: (connected) => set({ isMobileConnected: connected }),
  setRemoteFacingMode: (mode) => set({ remoteFacingMode: mode }),
  setActiveStream: (activeStream) => set({ activeStream }),
  addLog: (log) => set((state) => ({ logs: [log, ...state.logs].slice(0, 50) })),
  clearLogs: () => set({ logs: [] }),
}));
