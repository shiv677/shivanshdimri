import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from './SoundEngine';
import AudioOscilloscope from './AudioOscilloscope';

interface AudioVisualizerHUDProps {
  className?: string;
}

export const AudioVisualizerHUD: React.FC<AudioVisualizerHUDProps> = ({ className = '' }) => {
  const [soundOn, setSoundOn] = useState<boolean>(() => soundEngine.active);
  const [volume, setVolume] = useState<number>(() => soundEngine.getVolume());
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const freqBufferRef = useRef<Uint8Array>(new Uint8Array(32));

  // Sync state on mount
  useEffect(() => {
    setSoundOn(soundEngine.active);
    setVolume(soundEngine.getVolume());
  }, []);

  // Real-time 6-bar procedural equalizer animation loop
  useEffect(() => {
    let animId: number;
    const binIndices = [0, 1, 2, 4, 7, 12];
    const buffer = freqBufferRef.current;

    const render = () => {
      soundEngine.getFrequencyData(buffer);
      const time = performance.now();

      for (let i = 0; i < 6; i++) {
        const bar = barRefs.current[i];
        if (!bar) continue;

        if (soundOn) {
          const bin = binIndices[i];
          const raw = (buffer[bin] || 0) / 255;
          const wave = Math.sin(time * 0.005 + i * 1.1) * 0.12;
          const heightPct = Math.max(15, Math.min(100, Math.round((raw * 2.2 + 0.2 + wave) * 100)));

          bar.style.height = `${heightPct}%`;
          bar.style.opacity = `${0.45 + (heightPct / 100) * 0.55}`;
        } else {
          bar.style.height = '20%';
          bar.style.opacity = '0.3';
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [soundOn]);

  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const active = soundEngine.toggleAudio();
    setSoundOn(active);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value) / 100;
    setVolume(val);
    soundEngine.setVolume(val);
  };

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => {
        setIsHovered(true);
        soundEngine.playHover();
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Audio Button */}
      <button
        type="button"
        onClick={handleToggleSound}
        className={`px-3 py-1.5 rounded-full border text-[10px] font-mono tracking-[0.18em] flex items-center gap-2 transition-all cursor-pointer backdrop-blur-md ${
          soundOn
            ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
            : 'border-white/15 bg-black/60 text-white/60 hover:text-white hover:border-white/35'
        }`}
        title="Toggle Procedural Audio Synth"
      >
        {soundOn ? <Volume2 size={12} className="text-cyan-400" /> : <VolumeX size={12} />}
        <AudioOscilloscope active={soundOn} width={38} height={12} className="hidden sm:inline-block" />

        {/* 6-Bar Procedural Equalizer */}
        <div className="flex items-end gap-0.5 h-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              ref={(el) => {
                barRefs.current[i] = el;
              }}
              className="w-0.5 rounded-full bg-current transition-[height] duration-75"
              style={{ height: '20%', opacity: 0.3 }}
            />
          ))}
        </div>
      </button>

      {/* Hover / Popover Cyber Volume Slider */}
      <div
        className={`absolute top-full right-0 mt-2 z-50 p-2.5 bg-black/90 backdrop-blur-xl border border-cyan-400/30 rounded-lg shadow-[0_0_20px_rgba(0,240,255,0.2)] transition-all duration-200 min-w-[130px] flex flex-col gap-1.5 pointer-events-auto ${
          isHovered
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-1 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between text-[9px] font-mono tracking-widest">
          <span className="text-white/50">VOL</span>
          <span className="text-cyan-400 font-bold">{Math.round(volume * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(volume * 100)}
          onChange={handleVolumeChange}
          className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
        />
      </div>
    </div>
  );
};

export default AudioVisualizerHUD;
