'use client';

import React, { useRef, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { CameraView } from '../components/CameraView';
import { Whiteboard } from '../components/Whiteboard';
import { Toolbar } from '../components/Toolbar';
import { StatusPanel } from '../components/StatusPanel';
import { QRModal } from '../components/QRModal';
import { AndroidPanel } from '../components/AndroidPanel';
import { useBoardStore } from '../store/boardStore';
import { GestureType } from '../lib/gesture';

export default function WorkspacePage() {
  const { workspaceMode } = useBoardStore();
  
  // Direct drawing engine binding reference
  const drawingHandlersRef = useRef<{
    handleHandMove: (x: number, y: number, gesture: GestureType) => void;
  } | null>(null);

  // Whiteboard control ref
  const whiteboardRef = useRef<{ clearCanvas: () => void } | null>(null);
  
  // Root drawing canvas ref (passed down to Toolbar to render downloads)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Callback to bridge tracking coordinates to the drawing canvas
  const handleTrackingFrame = useCallback((x: number, y: number, gesture: GestureType) => {
    drawingHandlersRef.current?.handleHandMove(x, y, gesture);
  }, []);

  const handleClearCanvas = () => {
    whiteboardRef.current?.clearCanvas();
  };

  // Callback to receive references
  const handleDrawingRef = useCallback((handlers: { handleHandMove: (x: number, y: number, gesture: GestureType) => void }) => {
    drawingHandlersRef.current = handlers;
  }, []);

  // Proactively fetch main canvas reference
  const handleWhiteboardCanvasRef = useCallback((node: any) => {
    if (node) {
      // Find the inner canvas element
      const innerCanvas = node.querySelector('canvas');
      if (innerCanvas) {
        canvasRef.current = innerCanvas;
      }
    }
  }, []);

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* 1. Left Side Navigation */}
      <Sidebar />

      {/* 2. Main Content Dashboard */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
        <Header />

        {/* Dashboard Grid Container */}
        <div className="flex-1 p-6 flex flex-col gap-6 overflow-hidden min-h-0">
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
            {/* Left Column: Camera Tracking Stream */}
            <div className="lg:col-span-1 flex flex-col min-h-0">
              <CameraView onTrackingFrame={handleTrackingFrame} />
            </div>

            {/* Right Column: Whiteboard & Toolbar OR Android Panel */}
            <div className="lg:col-span-2 flex flex-col gap-4 min-h-0 h-full">
              {workspaceMode === 'whiteboard' ? (
                <>
                  <Toolbar onClear={handleClearCanvas} canvasRef={canvasRef} />
                  <div ref={handleWhiteboardCanvasRef} className="flex-1 min-h-0">
                    <Whiteboard ref={whiteboardRef} onDrawingRef={handleDrawingRef} />
                  </div>
                </>
              ) : (
                <AndroidPanel />
              )}
            </div>
          </div>

          {/* Bottom Panel: Track Outputs */}
          <StatusPanel />
        </div>
      </div>

      {/* QR Link Modal overlay */}
      <QRModal />
    </main>
  );
}
