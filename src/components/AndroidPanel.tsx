import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wifi,
  Bluetooth,
  Volume2,
  Moon,
  Sun,
  Play,
  Pause,
  Home,
  ChevronRight,
  Battery,
  User,
  MessageSquare,
  Compass,
  Heart,
} from 'lucide-react';
import { useCameraStore } from '../store/cameraStore';

export function AndroidPanel() {
  const { fingerCoordinates, handDetected, drawingEnabled } = useCameraStore();

  // Android setting states
  const [wifiOn, setWifiOn] = useState(true);
  const [bluetoothOn, setBluetoothOn] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [likes, setLikes] = useState<Record<number, boolean>>({});

  // Refs for tracking target elements for virtual pointer clicks/scrolls
  const panelRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Virtual cursor coordinates mapping states
  const [virtualCursor, setVirtualCursor] = useState<{ x: number; y: number } | null>(null);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [clickProgress, setClickProgress] = useState(0); // 0 to 100

  // Track scrolling variables
  const lastYRef = useRef<number | null>(null);

  // 1. Process Virtual Cursor Placement & Interactions
  useEffect(() => {
    if (!handDetected || !fingerCoordinates || !panelRef.current) {
      setVirtualCursor(null);
      setHoveredElement(null);
      setClickProgress(0);
      lastYRef.current = null;
      return;
    }

    const rect = panelRef.current.getBoundingClientRect();
    const x = fingerCoordinates.x * rect.width;
    const y = fingerCoordinates.y * rect.height;
    setVirtualCursor({ x, y });

    // Find what element is directly under the virtual cursor
    const clientX = rect.left + x;
    const clientY = rect.top + y;
    
    // Hide virtual cursor temporarily to get element underneath
    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    
    // Check if element is interactive (button, link, toggle card)
    const interactiveEl = el?.closest('button, a, [role="button"]') as HTMLElement | null;

    if (interactiveEl) {
      setHoveredElement(interactiveEl);
    } else {
      setHoveredElement(null);
      setClickProgress(0);
    }

    // 2. Handle Scroll dragging (if draw gesture is active, drag to scroll)
    if (drawingEnabled && scrollContainerRef.current) {
      if (lastYRef.current !== null) {
        const deltaY = (fingerCoordinates.y - lastYRef.current) * rect.height * 2.5; // Scale scroll speed
        scrollContainerRef.current.scrollTop += deltaY;
      }
      lastYRef.current = fingerCoordinates.y;
    } else {
      lastYRef.current = null;
    }
  }, [fingerCoordinates, handDetected, drawingEnabled]);

  // 3. Dwell Click timer simulation (800ms hover = click)
  useEffect(() => {
    if (!hoveredElement) {
      setClickProgress(0);
      return;
    }

    let start: number | null = null;
    let animationFrame: number;

    const dwellTime = 800; // 800ms

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const percent = Math.min((progress / dwellTime) * 100, 100);
      
      setClickProgress(percent);

      if (percent >= 100) {
        // Trigger click event on element!
        hoveredElement.click();
        
        // Add visual ripple / trigger feedback
        const ripple = document.createElement('span');
        ripple.className = 'absolute w-4 h-4 bg-white/40 rounded-full animate-ping pointer-events-none';
        ripple.style.left = `${virtualCursor?.x}px`;
        ripple.style.top = `${virtualCursor?.y}px`;
        panelRef.current?.appendChild(ripple);
        setTimeout(() => ripple.remove(), 1000);

        setClickProgress(0);
        setHoveredElement(null); // prevent repeating click immediately
      } else {
        animationFrame = requestAnimationFrame(step);
      }
    };

    animationFrame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [hoveredElement, virtualCursor]);

  const toggleLike = (id: number) => {
    setLikes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div
      ref={panelRef}
      className={`flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative shadow-2xl h-full select-none ${
        darkMode ? 'dark text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* 1. Android Status Bar */}
      <div className="h-10 bg-black/40 px-6 flex items-center justify-between text-xs font-semibold text-slate-400 z-30 shrink-0">
        <span>10:46 AM</span>
        <div className="flex items-center gap-2">
          <Wifi size={14} className={wifiOn ? 'text-blue-500' : 'text-slate-600'} />
          <Bluetooth size={14} className={bluetoothOn ? 'text-blue-500' : 'text-slate-600'} />
          <Battery size={14} className="text-slate-400" />
        </div>
      </div>

      {/* 2. Scrollable App Frame */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-6 scroll-smooth scrollbar-none"
      >
        {/* Header Widget */}
        <div className="flex items-center justify-between mt-2">
          <div>
            <h2 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Android OS
            </h2>
            <p className="text-xs text-slate-500 font-semibold">Hover to click • Point & Drag to scroll</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <User size={18} />
          </div>
        </div>

        {/* Quick Settings Panel Grid */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setWifiOn(!wifiOn)}
            className={`p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
              wifiOn
                ? 'bg-blue-600/10 border-blue-500/30 text-blue-400'
                : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-800'
            }`}
          >
            <Wifi size={20} />
            <div>
              <p className="text-xs font-bold">Wi-Fi</p>
              <p className="text-[10px] opacity-70">{wifiOn ? 'Connected' : 'Disconnected'}</p>
            </div>
          </button>

          <button
            onClick={() => setBluetoothOn(!bluetoothOn)}
            className={`p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
              bluetoothOn
                ? 'bg-blue-600/10 border-blue-500/30 text-blue-400'
                : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-800'
            }`}
          >
            <Bluetooth size={20} />
            <div>
              <p className="text-xs font-bold">Bluetooth</p>
              <p className="text-[10px] opacity-70">{bluetoothOn ? 'On' : 'Off'}</p>
            </div>
          </button>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
              darkMode
                ? 'bg-blue-600/10 border-blue-500/30 text-blue-400'
                : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-800'
            }`}
          >
            {darkMode ? <Moon size={20} /> : <Sun size={20} />}
            <div>
              <p className="text-xs font-bold">Theme</p>
              <p className="text-[10px] opacity-70">{darkMode ? 'Dark Mode' : 'Light Mode'}</p>
            </div>
          </button>

          <button
            onClick={() => alert('Volume adjustment opened')}
            className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-800 text-left flex flex-col gap-2 text-slate-400 cursor-pointer"
          >
            <Volume2 size={20} />
            <div>
              <p className="text-xs font-bold">Sound</p>
              <p className="text-[10px] opacity-70">80% Volume</p>
            </div>
          </button>
        </div>

        {/* Music Player Widget */}
        <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg animate-pulse" />
            <div>
              <h4 className="text-xs font-bold text-slate-200">Airwaves - Chill Lofi</h4>
              <p className="text-[10px] text-slate-500">Lofi Beats Radio</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg cursor-pointer"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>
        </div>

        {/* Scrollable Feed List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
            Notifications Feed
          </h3>

          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="bg-slate-950/20 border border-slate-800/80 rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-blue-400">
                    N{item}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-300">Android System Update</h5>
                    <p className="text-[9px] text-slate-500">2 hours ago</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleLike(item)}
                  className={`p-2 rounded-xl border border-slate-800 hover:bg-slate-900 transition-all cursor-pointer ${
                    likes[item] ? 'text-red-500 border-red-500/20 bg-red-500/5' : 'text-slate-400'
                  }`}
                >
                  <Heart size={14} fill={likes[item] ? 'currentColor' : 'none'} />
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Security patches for version 12.0.4 are ready to install. Hover the switch toggle below to view.
              </p>
              <div className="flex justify-end pt-1">
                <button className="flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:underline cursor-pointer">
                  Learn More <ChevronRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Virtual Cursor Indicator Overlay */}
      {virtualCursor && (
        <div
          className="absolute pointer-events-none rounded-full border border-blue-400/80 flex items-center justify-center z-50 transition-all"
          style={{
            left: `${virtualCursor.x - 12}px`,
            top: `${virtualCursor.y - 12}px`,
            width: '24px',
            height: '24px',
            backgroundColor: drawingEnabled ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.1)',
          }}
        >
          {/* Pulsing inner dot */}
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          
          {/* Dwell timer progress ring */}
          {clickProgress > 0 && (
            <svg className="absolute -inset-1 w-8 h-8 -rotate-90">
              <circle
                cx="16"
                cy="16"
                r="13"
                className="stroke-blue-400 fill-transparent"
                strokeWidth="2.5"
                strokeDasharray="81.68"
                strokeDashoffset={81.68 - (81.68 * clickProgress) / 100}
              />
            </svg>
          )}
        </div>
      )}

      {/* 4. Android Navigation Bar */}
      <div className="h-14 bg-black/60 border-t border-slate-800/80 flex items-center justify-around z-30 shrink-0">
        <button
          onClick={() => alert('Android Back pressed')}
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-300 cursor-pointer"
        >
          <ChevronRight className="rotate-180" size={18} />
        </button>
        <button
          onClick={() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = 0; // Scroll to top on home click
            }
          }}
          className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer shadow-inner"
        >
          <Home size={18} />
        </button>
        <button
          onClick={() => alert('App Switcher pressed')}
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-300 cursor-pointer"
        >
          <div className="w-4.5 h-4.5 border-2 border-slate-500 rounded-md" />
        </button>
      </div>
    </div>
  );
}
