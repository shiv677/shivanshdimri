import React, { useState } from 'react';
import {
  Download,
  TerminalSquare,
  Volume2,
  VolumeX,
  Sparkles,
  Send,
  Layers,
  ChevronUp,
  ChevronDown,
  Zap,
} from 'lucide-react';
import { soundEngine } from './SoundEngine';
import ScrambleText from './ScrambleText';
import AudioOscilloscope from './AudioOscilloscope';

interface ActiveTheoryHUDProps {
  activeZone: number;
  targetZ: number;
  mousePos: { x: number; y: number };
  onSelectZone: (zoneIndex: number) => void;
  onOpenIndexDrawer: () => void;
  onOpenTerminal: () => void;
  onAIQuery: (query: string) => void;
  aiMessage: string | null;
  onClearAIMessage: () => void;
  qualityMode?: 'ultra' | 'eco';
  onToggleQuality?: () => void;
}

export const ZONE_LABELS = [
  { index: 0, code: '00', short: 'GATEWAY', full: 'CREATIVE AI & SYSTEMS STUDIO' },
  { index: 1, code: '01', short: 'AUDIO.DEDUP', full: 'AUDIO DUPLICACY CHECKER' },
  { index: 2, code: '02', short: 'T2NAS', full: 'T2NAS PARALLEL TRANSFER ENGINE' },
  { index: 3, code: '03', short: 'RSYNC', full: 'ENTERPRISE RSYNC PLATFORM' },
  { index: 4, code: '04', short: 'AI.HARNESS', full: 'AI & VLM EVALUATION HARNESS' },
  { index: 5, code: '05', short: 'SKILLS & EXP', full: 'CAPABILITIES & INFOBAY AI' },
  { index: 6, code: '06', short: 'CONTACT', full: 'START A PROJECT // TRANSMIT' },
];

const QUICK_AI_PROMPTS = [
  { label: 'Show flagship Python systems', query: 'Show flagship Python systems' },
  { label: 'How does T2NAS scale?', query: 'How does T2NAS scale?' },
  { label: 'InfoBay AI role & experience', query: 'InfoBay AI role & experience' },
  { label: 'Autonomous AI & VLM Evaluation', query: 'Autonomous AI & VLM Evaluation' },
];

export const ActiveTheoryHUD: React.FC<ActiveTheoryHUDProps> = ({
  activeZone,
  targetZ,
  mousePos,
  onSelectZone,
  onOpenIndexDrawer,
  onOpenTerminal,
  onAIQuery,
  aiMessage,
  onClearAIMessage,
  qualityMode = 'ultra',
  onToggleQuality,
}) => {
  const [soundOn, setSoundOn] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(false);
  const [inputVal, setInputVal] = useState('');

  const handleToggleSound = () => {
    const active = soundEngine.toggleAudio();
    setSoundOn(active);
  };

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    soundEngine.playClick(880);
    onAIQuery(inputVal.trim());
    setInputVal('');
  };

  const depthPct = Math.min(100, Math.max(0, Math.round((Math.abs(targetZ) / 132) * 100)));

  return (
    <div className="fixed inset-0 pointer-events-none z-40 select-none">
      {/* Subtle Perimeter Hairlines & Corner Crosshairs */}
      <div className="absolute inset-3 sm:inset-5 border border-white/[0.06] pointer-events-none" />
      <span className="absolute top-2 left-2.5 sm:top-3.5 sm:left-4 text-white/35 font-mono text-xs">+</span>
      <span className="absolute top-2 right-2.5 sm:top-3.5 sm:right-4 text-white/35 font-mono text-xs">+</span>
      <span className="absolute bottom-2 left-2.5 sm:bottom-3.5 sm:left-4 text-white/35 font-mono text-xs">+</span>
      <span className="absolute bottom-2 right-2.5 sm:bottom-3.5 sm:right-4 text-white/35 font-mono text-xs">+</span>

      {/* ==================== TOP MINIMALIST ACTIVE THEORY BAR ==================== */}
      <header className="absolute top-3 sm:top-5 left-3 sm:left-5 right-3 sm:right-5 h-14 px-4 sm:px-6 flex items-center justify-between pointer-events-auto">
        {/* Left: Geometric Studio Mark */}
        <button
          onClick={() => {
            soundEngine.playClick(700);
            onSelectZone(0);
          }}
          onMouseEnter={() => soundEngine.playHover()}
          className="flex items-center gap-3 group cursor-pointer text-left"
        >
          <div className="w-8 h-8 rounded-full border border-white/25 bg-black/60 backdrop-blur-md flex items-center justify-center group-hover:border-cyan-400 transition-colors">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#00f0ff]" />
          </div>
          <div>
            <div className="font-mono text-xs tracking-[0.25em] text-white font-bold">
              <ScrambleText text="SHIVANSH DIMRI" />
            </div>
            <div className="text-[9px] font-mono tracking-[0.2em] text-white/45">
              ASSOCIATE AI ENGINEER // INFOBAY AI
            </div>
          </div>
        </button>

        {/* Center: Live Networked Cursor & Tunnel Depth Telemetry */}
        <div className="hidden lg:flex items-center gap-4 px-4 py-1.5 rounded-full border border-white/10 bg-black/50 backdrop-blur-md text-[10px] font-mono tracking-[0.2em] text-white/55">
          <span className="flex items-center gap-1.5 text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>HYDRA.WEBGL // 3 CURSORS ACTIVE</span>
          </span>
          <span className="text-white/20">|</span>
          <span>Z-DEPTH: {targetZ.toFixed(0)}m ({depthPct}%)</span>
          <span className="text-white/20">|</span>
          <span>
            XY [{mousePos.x >= 0 ? '+' : ''}
            {mousePos.x.toFixed(2)}, {mousePos.y >= 0 ? '+' : ''}
            {mousePos.y.toFixed(2)}]
          </span>
        </div>

        {/* Right: Audio Synth, GPU Quality Toggle, CV, CLI, and All-Work Index Trigger */}
        <div className="flex items-center gap-2">
          {/* Quality Mode Switcher */}
          {onToggleQuality && (
            <button
              onClick={() => {
                soundEngine.playClick(940);
                onToggleQuality();
              }}
              onMouseEnter={() => soundEngine.playHover()}
              className={`hidden sm:flex px-2.5 py-1.5 rounded-full border text-[10px] font-mono tracking-[0.16em] items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md ${
                qualityMode === 'ultra'
                  ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                  : 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.2)]'
              }`}
              title="Toggle GPU Shader Quality Mode"
            >
              <Zap size={11} className={qualityMode === 'ultra' ? 'text-cyan-400' : 'text-emerald-400'} />
              <span>{qualityMode === 'ultra' ? 'ULTRA' : 'ECO 60FPS'}</span>
            </button>
          )}

          <button
            onClick={handleToggleSound}
            onMouseEnter={() => soundEngine.playHover()}
            className={`px-3 py-1.5 rounded-full border text-[10px] font-mono tracking-[0.18em] flex items-center gap-2 transition-all cursor-pointer backdrop-blur-md ${
              soundOn
                ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                : 'border-white/15 bg-black/60 text-white/60 hover:text-white hover:border-white/35'
            }`}
            title="Toggle Procedural Audio Synth"
          >
            {soundOn ? <Volume2 size={12} className="text-cyan-400" /> : <VolumeX size={12} />}
            <AudioOscilloscope active={soundOn} width={42} height={12} className="hidden sm:inline-block" />
            <div className="flex items-end gap-0.5 h-2.5">
              {[0.5, 1.0, 0.6, 0.9].map((h, i) => (
                <span
                  key={i}
                  className={`w-0.5 bg-current ${soundOn ? 'animate-pulse' : 'opacity-35'}`}
                  style={{ height: soundOn ? `${h * 100}%` : '30%' }}
                />
              ))}
            </div>
          </button>

          <a
            href="/SHIVANSH_DIMRI_CV.pdf"
            download
            onClick={() => soundEngine.playClick(920)}
            onMouseEnter={() => soundEngine.playHover()}
            className="hidden sm:flex px-3.5 py-1.5 rounded-full border border-white/15 bg-black/60 hover:bg-white hover:text-black text-[10px] font-mono tracking-[0.18em] text-white transition-all items-center gap-1.5 cursor-pointer backdrop-blur-md"
          >
            <Download size={11} />
            <span>CV.PDF</span>
          </a>

          <button
            onClick={() => {
              soundEngine.playClick(640);
              onOpenTerminal();
            }}
            onMouseEnter={() => soundEngine.playHover()}
            className="px-3 py-1.5 rounded-full border border-fuchsia-500/40 bg-fuchsia-500/10 hover:bg-fuchsia-500/25 text-[10px] font-mono tracking-[0.18em] text-fuchsia-300 transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
          >
            <TerminalSquare size={12} />
            <span className="hidden sm:inline">CLI</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick(820);
              onOpenIndexDrawer();
            }}
            onMouseEnter={() => soundEngine.playHover()}
            className="px-4 py-1.5 rounded-full border border-white/25 bg-white text-black hover:bg-cyan-400 text-[10px] font-mono font-bold tracking-[0.2em] transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            <Layers size={12} />
            <span>INDEX (7)</span>
          </button>
        </div>
      </header>

      {/* ==================== RIGHT VERTICAL TUNNEL MINIMAP ==================== */}
      <div className="hidden md:flex fixed right-6 top-1/2 -translate-y-1/2 flex-col items-end gap-2.5 pointer-events-auto">
        {ZONE_LABELS.map((z) => {
          const isCurrent = activeZone === z.index;
          return (
            <button
              key={z.code}
              onClick={() => {
                soundEngine.playClick(700 + z.index * 40);
                onSelectZone(z.index);
              }}
              onMouseEnter={() => soundEngine.playHover()}
              className="group flex items-center gap-2.5 cursor-pointer"
            >
              <span
                className={`text-[9px] font-mono tracking-[0.2em] transition-all ${
                  isCurrent
                    ? 'text-cyan-300 opacity-100 font-bold'
                    : 'text-white/40 opacity-0 group-hover:opacity-100'
                }`}
              >
                {z.code} // {z.short}
              </span>
              <span
                className={`transition-all rounded-full ${
                  isCurrent
                    ? 'w-6 h-1.5 bg-cyan-400 shadow-[0_0_10px_#00f0ff]'
                    : 'w-2 h-1.5 bg-white/25 group-hover:bg-white/60'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* ==================== BOTTOM ACTIVE THEORY v6 "PILLBOX" + AI GUIDE ==================== */}
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[94vw] max-w-3xl pointer-events-auto flex flex-col items-center gap-2">
        {/* AI Assistant Response Bubble */}
        {aiMessage && (
          <div className="w-full px-4 py-3 rounded-2xl border border-cyan-400/40 bg-[#05060d]/95 backdrop-blur-2xl shadow-[0_0_30px_rgba(0,240,255,0.2)] flex items-start justify-between gap-3 text-xs font-mono text-cyan-100">
            <div className="flex items-start gap-2.5">
              <Sparkles size={15} className="text-cyan-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{aiMessage}</div>
            </div>
            <button
              onClick={onClearAIMessage}
              className="text-[10px] text-white/40 hover:text-white uppercase tracking-wider shrink-0 cursor-pointer"
            >
              [X]
            </button>
          </div>
        )}

        {/* Expandable Quick AI Prompt Pills */}
        {aiExpanded && (
          <div className="w-full p-3 rounded-2xl border border-white/15 bg-[#05060c]/90 backdrop-blur-2xl flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[9px] font-mono tracking-[0.2em] text-cyan-400 mr-1">
                AI NAVIGATOR:
              </span>
              {QUICK_AI_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    soundEngine.playClick(840);
                    onAIQuery(p.query);
                  }}
                  className="px-2.5 py-1 rounded-full border border-white/15 bg-white/[0.04] hover:border-cyan-400 hover:text-cyan-300 text-[10px] font-mono text-white/75 transition-all cursor-pointer"
                >
                  ✦ {p.label}
                </button>
              ))}
            </div>

            <form onSubmit={handlePromptSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Ask AI to fly to a project, skill, or InfoBay AI experience..."
                className="flex-1 bg-black/60 border border-white/15 focus:border-cyan-400 rounded-full px-4 py-1.5 text-xs font-mono text-white placeholder:text-white/35 outline-none"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-full bg-cyan-400 text-black font-mono text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 cursor-pointer"
              >
                <span>FLY</span>
                <Send size={11} />
              </button>
            </form>
          </div>
        )}

        {/* Main Floating Pillbox Bar */}
        <div className="w-full px-2.5 py-2 rounded-full border border-white/15 bg-[#06070f]/85 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] flex items-center justify-between gap-1 overflow-x-auto">
          <div className="flex items-center gap-1">
            {ZONE_LABELS.map((z) => {
              const isCurrent = activeZone === z.index;
              return (
                <button
                  key={z.code}
                  onClick={() => {
                    soundEngine.playClick(720 + z.index * 35);
                    onSelectZone(z.index);
                  }}
                  onMouseEnter={() => soundEngine.playHover()}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-mono tracking-[0.16em] whitespace-nowrap transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-white text-black font-bold shadow-[0_0_20px_rgba(255,255,255,0.35)]'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <span className={isCurrent ? 'text-black' : 'text-cyan-400/80'}>{z.code}</span>{' '}
                  <span>{z.short}</span>
                </button>
              );
            })}
          </div>

          {/* Right Pillbox AI Assistant Toggle */}
          <button
            onClick={() => {
              soundEngine.playClick(800);
              setAiExpanded(!aiExpanded);
            }}
            className={`px-3.5 py-1.5 rounded-full border text-[10px] font-mono tracking-[0.18em] whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              aiExpanded
                ? 'border-cyan-400 bg-cyan-400 text-black font-bold'
                : 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20'
            }`}
          >
            <Sparkles size={11} />
            <span>AI GUIDE</span>
            {aiExpanded ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActiveTheoryHUD;
