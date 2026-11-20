import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Menu,
  X,
  ArrowUpRight,
  Github,
  Linkedin,
  Mail,
  Compass,
  Cpu,
  Layers,
  TerminalSquare,
  Zap,
} from 'lucide-react';
import { soundEngine } from './SoundEngine';
import ScrambleText from './ScrambleText';
import AudioVisualizerHUD from './AudioVisualizerHUD';
import TelemetryTicker from './TelemetryTicker';

interface ActiveTheoryLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: '/', label: '00 // 3D GATEWAY', shortLabel: '3D GATEWAY' },
  { href: '/work', label: '01 // SYSTEMS & ARCHITECTURE', shortLabel: 'SYSTEMS' },
  { href: '/architecture', label: '02 // ARCHITECTURE DOCS', shortLabel: 'WHITE PAPERS' },
  { href: '/experience', label: '03 // SKILLS & EXP', shortLabel: 'SKILLS & EXP' },
  { href: '/about', label: '04 // ABOUT', shortLabel: 'ABOUT' },
  { href: '/contact', label: '05 // TRANSMIT', shortLabel: 'CONTACT' },
];

export const ActiveTheoryLayout: React.FC<ActiveTheoryLayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [qualityMode, setQualityMode] = useState<'ultra' | 'eco'>(() => {
    return (localStorage.getItem('at_quality_mode') as 'ultra' | 'eco') || 'ultra';
  });
  const location = useLocation();

  const handleToggleQuality = () => {
    soundEngine.playClick(940);
    setQualityMode((prev) => {
      const next = prev === 'ultra' ? 'eco' : 'ultra';
      localStorage.setItem('at_quality_mode', next);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#020205] text-[#ededed] relative overflow-x-hidden selection:bg-cyan-400 selection:text-black font-sans">
      {/* Background ambient radial gradients & grid overlay */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-cyan-500/[0.06] via-fuchsia-500/[0.03] to-transparent blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[800px] h-[400px] bg-gradient-to-t from-cyan-500/[0.04] to-transparent blur-[140px]" />
        {/* Subtle cyber grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)`,
            backgroundSize: '36px 36px',
          }}
        />
        {/* Scanline texture */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, #fff, #fff 1px, transparent 1px, transparent 4px)`,
          }}
        />
      </div>

      {/* Perimeter Hairlines & Corner Crosshairs */}
      <div className="fixed inset-3 sm:inset-5 border border-white/[0.06] pointer-events-none z-30" />
      <span className="fixed top-2 left-2.5 sm:top-3.5 sm:left-4 text-white/35 font-mono text-xs pointer-events-none z-30">+</span>
      <span className="fixed top-2 right-2.5 sm:top-3.5 sm:right-4 text-white/35 font-mono text-xs pointer-events-none z-30">+</span>
      <span className="fixed bottom-2 left-2.5 sm:bottom-3.5 sm:left-4 text-white/35 font-mono text-xs pointer-events-none z-30">+</span>
      <span className="fixed bottom-2 right-2.5 sm:bottom-3.5 sm:right-4 text-white/35 font-mono text-xs pointer-events-none z-30">+</span>

      {/* ==================== ACTIVE THEORY HUD BAR ==================== */}
      <header className="fixed top-3 sm:top-5 left-3 sm:left-5 right-3 sm:right-5 h-14 px-4 sm:px-6 flex items-center justify-between z-40 bg-black/60 backdrop-blur-xl border-b border-white/10">
        {/* Left: Brand Identity */}
        <Link
          to="/"
          onClick={() => soundEngine.playClick(720)}
          onMouseEnter={() => soundEngine.playHover()}
          className="flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded-full border border-white/20 bg-black/80 flex items-center justify-center group-hover:border-cyan-400 transition-colors">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#00f0ff]" />
          </div>
          <div>
            <div className="font-mono text-xs tracking-[0.25em] text-white font-bold group-hover:text-cyan-400 transition-colors">
              <ScrambleText text="SHIVANSH DIMRI" />
            </div>
            <div className="text-[9px] font-mono tracking-[0.2em] text-white/45">
              ASSOCIATE AI ENGINEER // INFOBAY AI
            </div>
          </div>
        </Link>

        {/* Center: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => soundEngine.playClick(800)}
                onMouseEnter={() => soundEngine.playHover()}
                className={`relative px-3 py-1.5 rounded-full font-mono text-[11px] tracking-[0.16em] uppercase transition-all ${
                  isActive
                    ? 'text-cyan-300 bg-cyan-400/10 border border-cyan-400/40 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span>{item.shortLabel}</span>
                {isActive && (
                  <motion.span
                    layoutId="activeNavIndicator"
                    className="absolute -bottom-1 left-3 right-3 h-0.5 bg-gradient-to-r from-cyan-400 to-fuchsia-400"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Controls: Audio Synth, GPU Quality, CV.PDF, Mobile Menu */}
        <div className="flex items-center gap-2">
          {/* Quality Mode Switcher */}
          <button
            onClick={handleToggleQuality}
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

          {/* Status badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-black/40 text-[9px] font-mono tracking-[0.2em] text-white/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>ONLINE // SYS: ACTIVE</span>
          </div>

          {/* Audio Visualizer HUD */}
          <AudioVisualizerHUD />

          {/* CV Download */}
          <a
            href="/SHIVANSH_DIMRI_CV.pdf"
            download
            onClick={() => soundEngine.playClick(920)}
            onMouseEnter={() => soundEngine.playHover()}
            className="hidden sm:flex px-3.5 py-1.5 rounded-full border border-white/15 bg-black/60 hover:bg-white hover:text-black text-[10px] font-mono tracking-[0.18em] text-white transition-all items-center gap-1.5 cursor-pointer"
          >
            <Download size={11} />
            <span>CV.PDF</span>
          </a>

          {/* CLI Quake Terminal Trigger */}
          <button
            onClick={() => {
              soundEngine.playClick(640);
              window.dispatchEvent(new CustomEvent('open-terminal'));
            }}
            onMouseEnter={() => soundEngine.playHover()}
            className="px-3 py-1.5 rounded-full border border-fuchsia-500/40 bg-fuchsia-500/10 hover:bg-fuchsia-500/25 text-[10px] font-mono tracking-[0.18em] text-fuchsia-300 transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
            title="Open Quake CLI Terminal [ ` ]"
          >
            <TerminalSquare size={12} />
            <span className="hidden sm:inline">CLI</span>
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => {
              soundEngine.playClick(600);
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="lg:hidden p-2 rounded-full border border-white/15 bg-black/60 text-white/80 hover:text-white"
          >
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </header>

      {/* ==================== MOBILE MENU DRAWER ==================== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-3 sm:inset-x-5 top-20 z-40 p-6 rounded-2xl border border-white/15 bg-[#03040a]/95 backdrop-blur-2xl lg:hidden flex flex-col gap-4 shadow-2xl"
          >
            <div className="text-[10px] font-mono tracking-[0.25em] text-cyan-400 pb-2 border-b border-white/10">
              NAVIGATION DIRECTORY // ACTIVE THEORY HUD
            </div>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => {
                  soundEngine.playClick(750);
                  setMobileMenuOpen(false);
                }}
                className={`py-2 px-3 rounded-xl font-mono text-xs tracking-[0.2em] flex items-center justify-between ${
                  location.pathname === item.href
                    ? 'text-cyan-300 bg-cyan-400/10 border border-cyan-400/30 font-bold'
                    : 'text-white/70 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span>{item.label}</span>
                <ArrowUpRight size={14} className="opacity-60" />
              </Link>
            ))}
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => {
                  soundEngine.playClick(640);
                  setMobileMenuOpen(false);
                  window.dispatchEvent(new CustomEvent('open-terminal'));
                }}
                className="py-2 px-3 rounded-xl border border-fuchsia-500/40 bg-fuchsia-500/10 font-mono text-xs text-fuchsia-300 flex items-center gap-1.5 cursor-pointer"
              >
                <TerminalSquare size={13} />
                <span>CLI TERMINAL [`]</span>
              </button>
              <a
                href="/SHIVANSH_DIMRI_CV.pdf"
                download
                className="py-2 px-3 rounded-xl border border-white/20 bg-white/5 font-mono text-xs text-white flex items-center gap-1.5"
              >
                <Download size={13} />
                <span>CV.PDF</span>
              </a>
              <div className="text-[10px] font-mono text-white/40">v2.4 // LUCKNOW, IN</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="relative z-10 pt-24 sm:pt-28 pb-20 px-4 sm:px-8 max-w-7xl mx-auto">
        {children}
      </main>

      {/* ==================== ACTIVE THEORY FOOTER ==================== */}
      <footer className="relative z-10 border-t border-white/10 bg-black/80 backdrop-blur-xl py-12 px-6 sm:px-12 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
              <span className="font-mono text-xs tracking-[0.25em] text-white font-bold">
                SHIVANSH DIMRI &middot; ASSOCIATE AI ENGINEER
              </span>
            </div>
            <p className="text-[11px] font-mono text-white/50 max-w-md leading-relaxed">
              Architecting high-concurrency Python pipelines, autonomous multi-agent evaluation suites, and fault-tolerant data infrastructure at InfoBay AI Limited.
            </p>
            <div className="text-[10px] font-mono text-white/30 tracking-[0.2em]">
              COORDINATES: 26.8467° N, 80.9462° E // LUCKNOW, INDIA
            </div>
          </div>

          {/* Quick links & socials */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/"
              onClick={() => soundEngine.playClick(680)}
              onMouseEnter={() => soundEngine.playHover()}
              className="px-4 py-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400 hover:text-black font-mono text-[10px] tracking-[0.18em] transition-all flex items-center gap-1.5"
            >
              <Compass size={12} />
              <span>RETURN TO 3D GATEWAY</span>
            </Link>

            <a
              href="https://github.com/shiv677"
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => soundEngine.playHover()}
              className="p-2.5 rounded-full border border-white/15 bg-white/[0.03] text-white/70 hover:text-white hover:border-white/35 transition-colors"
              title="GitHub"
            >
              <Github size={14} />
            </a>

            <a
              href="https://www.linkedin.com/in/shivansh-dimri-27820b268"
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => soundEngine.playHover()}
              className="p-2.5 rounded-full border border-white/15 bg-white/[0.03] text-white/70 hover:text-white hover:border-white/35 transition-colors"
              title="LinkedIn"
            >
              <Linkedin size={14} />
            </a>

            <a
              href="mailto:dimrishiv933@gmail.com"
              onMouseEnter={() => soundEngine.playHover()}
              className="p-2.5 rounded-full border border-white/15 bg-white/[0.03] text-white/70 hover:text-white hover:border-white/35 transition-colors"
              title="Email"
            >
              <Mail size={14} />
            </a>

            <a
              href="/SHIVANSH_DIMRI_CV.pdf"
              download
              onMouseEnter={() => soundEngine.playHover()}
              className="px-4 py-2 rounded-full border border-white/20 bg-white text-black hover:bg-cyan-400 font-mono text-[10px] font-bold tracking-[0.18em] transition-all flex items-center gap-1.5"
            >
              <Download size={12} />
              <span>DOWNLOAD CV</span>
            </a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-white/35 gap-4">
          <div>
            &copy; {new Date().getFullYear()} SHIVANSH DIMRI. CRAFTED IN ACTIVE THEORY DESIGN PROTOCOL.
          </div>
          <div className="flex items-center gap-4">
            <span>CORE: PYTHON 3.12 // PYTORCH // REACT 18 // THREE.JS</span>
            <span className="text-emerald-400">STATUS: SYSTEM NOMINAL</span>
          </div>
        </div>
      </footer>

      {/* Hardware & Telemetry HUD Ticker */}
      <TelemetryTicker />
    </div>
  );
};

export default ActiveTheoryLayout;
