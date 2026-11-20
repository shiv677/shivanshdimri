import React, { useState, useEffect, useRef } from 'react';
import { Activity, Cpu, ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import { soundEngine } from './SoundEngine';

export const TelemetryTicker: React.FC = () => {
  const [fps, setFps] = useState<number>(60);
  const [frameTimeMs, setFrameTimeMs] = useState<number>(16.6);
  const [uptimeSec, setUptimeSec] = useState<number>(0);
  const [collapsed, setCollapsed] = useState<boolean>(true);

  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const rafIdRef = useRef<number>(0);

  useEffect(() => {
    // 1. Live Uptime Counter
    const timer = setInterval(() => {
      setUptimeSec((prev) => prev + 1);
    }, 1000);

    // 2. Real Browser Frame Rate & Frame Latency calculation
    const calcFps = (now: number) => {
      frameCountRef.current++;
      const delta = now - lastTimeRef.current;

      if (delta >= 500) {
        const calculatedFps = Math.min(144, Math.round((frameCountRef.current * 1000) / delta));
        const calculatedFrameTime = (delta / frameCountRef.current).toFixed(1);
        setFps(calculatedFps);
        setFrameTimeMs(parseFloat(calculatedFrameTime));
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      rafIdRef.current = requestAnimationFrame(calcFps);
    };

    rafIdRef.current = requestAnimationFrame(calcFps);

    return () => {
      clearInterval(timer);
      cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  const formatUptime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 pointer-events-auto select-none font-mono">
      <div className="p-2 sm:p-2.5 rounded-2xl border border-white/10 bg-[#03040a]/90 backdrop-blur-xl text-[10px] text-white/70 shadow-[0_0_20px_rgba(0,0,0,0.6)] space-y-1.5 transition-all">
        {/* Header line */}
        <button
          onClick={() => {
            soundEngine.playClick(800);
            setCollapsed(!collapsed);
          }}
          className="flex items-center gap-3 w-full justify-between hover:text-white cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white tracking-widest text-[9px] uppercase">
              HARDWARE TELEMETRY
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 font-bold">
              {fps} FPS
            </span>
            <span className="text-white/40">{frameTimeMs}ms</span>
            {collapsed ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </div>
        </button>

        {/* Expanded Telemetry details */}
        {!collapsed && (
          <div className="pt-2 border-t border-white/[0.08] space-y-1 text-[9px] text-white/60">
            <div className="flex justify-between gap-4">
              <span>ACTIVE THEORY GLSL:</span>
              <span className="text-cyan-400 font-bold">V-3.0_WEBGL2</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>RUNTIME ENGINE:</span>
              <span className="text-emerald-400 font-bold">PYTHON 3.12 (CPYTHON)</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>SYSTEM UPTIME:</span>
              <span className="text-fuchsia-300 font-bold">{formatUptime(uptimeSec)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>PARALLEL POOL:</span>
              <span className="text-white font-bold">DYNAMIC CPU-1</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>HOST NODE:</span>
              <span className="text-white/40">26.84°N 80.94°E (IN)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TelemetryTicker;
