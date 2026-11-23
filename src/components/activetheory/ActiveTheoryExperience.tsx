import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Copy,
  Check,
  Download,
  Github,
  Cpu,
  Activity,
  Code2,
  Brain,
  Layers,
  ShieldCheck,
  MapPin,
  Calendar,
  X,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
} from 'lucide-react';
import ActiveTheoryCanvas, { ZONE_Z_POSITIONS } from './ActiveTheoryCanvas';
import ActiveTheoryHUD, { ZONE_LABELS } from './ActiveTheoryHUD';
import ScrambleText from './ScrambleText';
import { soundEngine } from './SoundEngine';
import TelemetryTicker from './TelemetryTicker';
import { ALL_PROJECTS, Project } from '@/data/projects';

const CAPABILITY_MATRIX = [
  {
    code: 'SYS.01',
    title: 'AI & MODEL ENGINEERING',
    icon: Brain,
    skills: [
      'LLM & Multimodal VLM Evaluation',
      'Multi-Agent Consensus Swarms',
      'Pydantic v2 Schema Constraints',
      'Automated Benchmark Scoring',
    ],
  },
  {
    code: 'SYS.02',
    title: 'CONCURRENCY & CORE SYSTEMS',
    icon: Cpu,
    skills: [
      'Multiprocessing Worker Pools (CPU-1)',
      'AsyncIO Event Loops & Semaphores',
      'Crash-Resilient Checkpointing (SQLite WAL)',
      'Deterministic Deduplication (SHA-256)',
    ],
  },
  {
    code: 'SYS.03',
    title: 'DATA SYSTEMS & AUTOMATION',
    icon: Layers,
    skills: [
      'Dataset Quality & Corruption Guards',
      'Automated Research & Web Discovery',
      'Bounded Chunk Streaming (O(1) RAM)',
      'Transactional State Recovery',
    ],
  },
  {
    code: 'SYS.04',
    title: 'INFRASTRUCTURE & INTEGRATION',
    icon: ShieldCheck,
    skills: [
      'Linux & Embedded OpenSSH/Rsync',
      'Subprocess Telemetry Parsing',
      'Docker & Standalone Packaging',
      'Reproducible Evaluation Harnesses',
    ],
  },
];

export const ActiveTheoryExperience: React.FC = () => {
  const [activeZone, setActiveZone] = useState(0);
  const [targetZ, setTargetZ] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [modalSystem, setModalSystem] = useState<Project | null>(null);
  const [showIndexDrawer, setShowIndexDrawer] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [qualityMode, setQualityMode] = useState<'ultra' | 'eco'>(() => {
    return (localStorage.getItem('at_quality_mode') as 'ultra' | 'eco') || 'ultra';
  });

  const toggleQuality = () => {
    setQualityMode((prev) => {
      const next = prev === 'ultra' ? 'eco' : 'ultra';
      localStorage.setItem('at_quality_mode', next);
      return next;
    });
  };

  // Sync showTerminal with global terminal events
  useEffect(() => {
    const onOpen = () => setShowTerminal(true);
    const onClose = () => setShowTerminal(false);
    window.addEventListener('open-terminal', onOpen);
    window.addEventListener('close-terminal', onClose);
    return () => {
      window.removeEventListener('open-terminal', onOpen);
      window.removeEventListener('close-terminal', onClose);
    };
  }, []);

  const flyToZone = useCallback((zoneIdx: number) => {
    const clamped = Math.max(0, Math.min(ZONE_Z_POSITIONS.length - 1, zoneIdx));
    setActiveZone(clamped);
    setTargetZ(ZONE_Z_POSITIONS[clamped]);
  }, []);

  // Mouse & Wheel Tunnel Navigation
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      setMousePos({ x: nx, y: ny });
    };

    const handleWheel = (e: WheelEvent) => {
      if (modalSystem || showIndexDrawer || showTerminal) return;
      setTargetZ((prev) => {
        const next = Math.max(-135, Math.min(2, prev - e.deltaY * 0.032));
        // Find nearest zone
        let nearestIdx = 0;
        let minDiff = Infinity;
        ZONE_Z_POSITIONS.forEach((zPos, i) => {
          const diff = Math.abs(next - zPos);
          if (diff < minDiff) {
            minDiff = diff;
            nearestIdx = i;
          }
        });
        setActiveZone(nearestIdx);
        return next;
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalSystem || showIndexDrawer || showTerminal) {
        if (e.key === 'Escape') {
          setModalSystem(null);
          setShowIndexDrawer(false);
          setShowTerminal(false);
        }
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        soundEngine.playClick(740);
        flyToZone(activeZone + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        soundEngine.playClick(740);
        flyToZone(activeZone - 1);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeZone, flyToZone, modalSystem, showIndexDrawer, showTerminal]);

  // Active Theory AI Navigator Query Handler
  const handleAIQuery = (query: string) => {
    const q = query.toLowerCase();
    if (q.includes('t2nas') || q.includes('nas') || q.includes('scale') || q.includes('concurrency')) {
      flyToZone(2);
      setAiMessage(
        'NAVIGATED TO PORTAL 02 [Z = -44m] // T2NAS scales parallel workers dynamically to (CPU_COUNT - 1) with SHA-256 chunk verification and atomic crash-resume checkpoints.'
      );
    } else if (q.includes('audio') || q.includes('duplicacy') || q.includes('hash') || q.includes('dedup')) {
      flyToZone(1);
      setAiMessage(
        'NAVIGATED TO PORTAL 01 [Z = -22m] // Audio Duplicacy Checker computes deterministic SHA-256 fingerprints across multiprocessing worker pools with O(1) bounded memory.'
      );
    } else if (q.includes('rsync') || q.includes('ssh') || q.includes('sync') || q.includes('rbac')) {
      flyToZone(3);
      setAiMessage(
        'NAVIGATED TO PORTAL 03 [Z = -66m] // Enterprise Rsync Platform bundles embedded OpenSSH & rsync inside a standalone Windows binary with RBAC auth and <5ms stdout telemetry.'
      );
    } else if (q.includes('ai') || q.includes('vlm') || q.includes('harness') || q.includes('agent') || q.includes('benchmark')) {
      flyToZone(4);
      setAiMessage(
        'NAVIGATED TO PORTAL 04 [Z = -88m] // Autonomous AI & VLM Evaluation Harness distributes multi-agent benchmarking prompts with verified Pydantic v2 schema conformance.'
      );
    } else if (q.includes('infobay') || q.includes('experience') || q.includes('role') || q.includes('skill') || q.includes('matrix')) {
      flyToZone(5);
      setAiMessage(
        'NAVIGATED TO PORTAL 05 [Z = -110m] // Shivansh Dimri is an Associate AI Engineer at InfoBay AI Limited (Lucknow, India), building multi-agent VLM evaluation suites & Python concurrency systems.'
      );
    } else if (q.includes('contact') || q.includes('email') || q.includes('hire') || q.includes('cv') || q.includes('resume')) {
      flyToZone(6);
      setAiMessage(
        'NAVIGATED TO PORTAL 06 [Z = -132m] // Transmission Stargate ready. Direct email: dimrishiv933@gmail.com | One-click CV.PDF available.'
      );
    } else {
      flyToZone(1);
      setAiMessage(
        'NAVIGATED TO FLAGSHIP SYSTEMS [Z = -22m] // Explore 01 Audio Duplicacy Checker, 02 T2NAS Parallel Transfer, 03 Enterprise Rsync, and 04 AI Evaluation Harness.'
      );
    }
  };

  const handleCopyEmail = () => {
    soundEngine.playClick(960);
    navigator.clipboard.writeText('dimrishiv933@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2200);
  };

  const currentSystem =
    activeZone >= 1 && activeZone <= 4
      ? ALL_PROJECTS.find((p) => p.zoneIndex === activeZone) || ALL_PROJECTS[activeZone - 1]
      : null;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#020205] text-white select-none">
      {/* 1. Full-Screen 3D Reflective Tunnel & Custom GLSL Shaders */}
      <ActiveTheoryCanvas
        targetZ={targetZ}
        activeZone={activeZone}
        mousePos={mousePos}
        onSelectZone={flyToZone}
        onOpenCaseStudy={(sysIdx) => {
          soundEngine.playClick(880);
          const target = ALL_PROJECTS.find((p) => p.zoneIndex === sysIdx + 1) || ALL_PROJECTS[sysIdx];
          if (target) setModalSystem(target);
        }}
        qualityMode={qualityMode}
      />

      {/* 2. Active Theory Top Bar, Right Minimap & Bottom Pillbox + AI Guide */}
      <ActiveTheoryHUD
        activeZone={activeZone}
        targetZ={targetZ}
        mousePos={mousePos}
        onSelectZone={flyToZone}
        onOpenIndexDrawer={() => setShowIndexDrawer(true)}
        onOpenTerminal={() => window.dispatchEvent(new CustomEvent('open-terminal'))}
        onAIQuery={handleAIQuery}
        aiMessage={aiMessage}
        onClearAIMessage={() => setAiMessage(null)}
        qualityMode={qualityMode}
        onToggleQuality={toggleQuality}
      />

      {/* 3. Spatial Zone Stage HUD (Synchronized with 3D Tunnel Depth) */}
      <div className="relative z-20 w-full h-full pointer-events-none flex items-center justify-center px-6 sm:px-14">
        <AnimatePresence mode="wait">
          {/* ==================== ZONE 0: THE GATEWAY ==================== */}
          {activeZone === 0 && (
            <motion.div
              key="zone-0"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-6xl flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8 mt-14"
            >
              {/* Left Kinetic Title */}
              <div className="space-y-4 pointer-events-auto">
                <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full border border-cyan-400/40 bg-black/60 backdrop-blur-md text-[10px] font-mono tracking-[0.22em] text-cyan-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>ASSOCIATE AI ENGINEER // PYTHON &middot; AI EVALUATION &middot; DATA SYSTEMS &middot; AUTOMATION</span>
                </div>

                <h1 className="font-display font-black uppercase tracking-[-0.04em] leading-[0.88] text-5xl sm:text-7xl lg:text-8xl text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.9)]">
                  <span className="block">
                    <ScrambleText text="SHIVANSH" />
                  </span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-fuchsia-400">
                    <ScrambleText text="DIMRI // AI" />
                  </span>
                </h1>

                <p className="max-w-md text-xs sm:text-sm font-mono text-white/75 leading-relaxed bg-black/55 backdrop-blur-md p-3.5 border-l-2 border-cyan-400">
                  I build reliable Python systems, AI evaluation workflows, data-processing pipelines, and automation infrastructure for complex engineering problems.
                </p>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    onClick={() => {
                      soundEngine.playClick(840);
                      flyToZone(1);
                    }}
                    onMouseEnter={() => soundEngine.playHover()}
                    className="px-6 py-3 rounded-full bg-white text-black hover:bg-cyan-400 font-mono text-xs font-bold tracking-[0.22em] uppercase transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_30px_rgba(0,240,255,0.35)]"
                  >
                    <span>ENTER 3D WORK TUNNEL</span>
                    <ChevronRight size={15} />
                  </button>

                  <button
                    onClick={() => {
                      soundEngine.playClick(800);
                      setShowIndexDrawer(true);
                    }}
                    className="px-5 py-3 rounded-full border border-white/25 bg-black/60 hover:border-cyan-400 text-xs font-mono tracking-[0.2em] uppercase backdrop-blur-md transition-all cursor-pointer"
                  >
                    ALL WORK INDEX
                  </button>
                </div>
              </div>

              {/* Right Telemetry Panel */}
              <div className="pointer-events-auto grid grid-cols-2 gap-2.5 w-full lg:w-80">
                {[
                  { val: `${ALL_PROJECTS.length} SYSTEMS`, label: 'PRODUCTION ARCHITECTURES' },
                  { val: 'PARITY', label: 'CHROMAPRINT + SHA-256' },
                  { val: 'CPU-1', label: 'WORKER SCALING' },
                  { val: 'INFOBAY', label: 'ASSOCIATE AI ENG' },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="p-3.5 rounded-2xl border border-white/15 bg-black/65 backdrop-blur-xl"
                  >
                    <div className="text-xl sm:text-2xl font-display font-black text-cyan-300">
                      {m.val}
                    </div>
                    <div className="text-[9px] font-mono tracking-[0.18em] text-white/55 mt-0.5">
                      {m.label}
                    </div>
                  </div>
                ))}
                <div className="col-span-2 text-center py-2 rounded-full border border-white/10 bg-black/50 text-[10px] font-mono tracking-[0.22em] text-white/50">
                  SCROLL WHEEL OR CLICK PILLBOX TO FLY
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================== ZONES 1, 2, 3: 3D FLAGSHIP SYSTEM PORTALS ==================== */}
          {currentSystem && (
            <motion.div
              key={currentSystem.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.03 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-6xl grid lg:grid-cols-12 gap-6 items-center"
            >
              {/* Left HUD Panel framing the 3D Portal in center */}
              <div className="lg:col-span-5 pointer-events-auto p-6 rounded-3xl border border-white/15 bg-[#04050b]/85 backdrop-blur-2xl space-y-4 shadow-[0_20px_60px_rgba(0,0,0,0.85)]">
                <div className="flex items-center justify-between text-[10px] font-mono tracking-[0.22em] text-cyan-400">
                  <span>PORTAL /{currentSystem.index} // FLAGSHIP ENGINE</span>
                  <span>[Z = {ZONE_Z_POSITIONS[currentSystem.zoneIndex ?? activeZone]}m]</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-display font-black uppercase tracking-tight text-white">
                  <ScrambleText text={currentSystem.title} />
                </h2>

                <p className="text-xs font-mono text-white/70 leading-relaxed">
                  {currentSystem.description}
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {(currentSystem.telemetry || currentSystem.metrics || []).map((t) => (
                    <div key={t.label} className="p-2.5 rounded-xl border border-white/10 bg-white/[0.03]">
                      <div className="text-[9px] font-mono text-white/45">{t.label}</div>
                      <div className="text-base font-display font-black text-cyan-300">{t.value}</div>
                      <div className="text-[9px] font-mono text-white/50">{t.sub}</div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  <button
                    onClick={() => {
                      soundEngine.playClick(880);
                      setModalSystem(currentSystem);
                    }}
                    className="px-5 py-2.5 rounded-full bg-white text-black hover:bg-cyan-400 font-mono text-[11px] font-bold tracking-[0.2em] uppercase transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>INSPECT KERNEL &amp; CASE STUDY</span>
                    <ArrowUpRight size={14} />
                  </button>

                  <a
                    href={currentSystem.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-full border border-white/20 hover:border-cyan-400 font-mono text-[11px] tracking-[0.18em] uppercase flex items-center gap-1.5"
                  >
                    <Github size={13} />
                    <span>REPO</span>
                  </a>
                </div>
              </div>

              {/* Center 2 Cols left open so the 3D WebGL Portal & Mirror Reflection shine through */}
              <div className="hidden lg:flex lg:col-span-2 flex-col items-center justify-center">
                <button
                  onClick={() => {
                    soundEngine.playClick(880);
                    setModalSystem(currentSystem);
                  }}
                  className="pointer-events-auto px-3.5 py-1.5 rounded-full border border-cyan-400/50 bg-black/70 backdrop-blur-md text-[9px] font-mono tracking-[0.22em] text-cyan-300 hover:bg-cyan-400 hover:text-black transition-all cursor-pointer"
                >
                  [ CLICK 3D PORTAL ]
                </button>
              </div>

              {/* Right HUD Panel: 5-Stage Pipeline & Live Python Kernel */}
              <div className="hidden lg:block lg:col-span-5 pointer-events-auto p-6 rounded-3xl border border-white/15 bg-[#04050b]/85 backdrop-blur-2xl space-y-4">
                <div className="text-[10px] font-mono tracking-[0.22em] text-cyan-400 uppercase flex items-center gap-2">
                  <Activity size={13} />
                  <span>5-STAGE DETERMINISTIC PIPELINE</span>
                </div>

                <div className="space-y-1.5">
                  {(currentSystem.pipeline || []).map((st) => (
                    <div
                      key={st.step}
                      className="px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-white font-bold">
                        <span className="text-cyan-400 mr-2">/{st.step}</span>
                        {st.name}
                      </span>
                      <span className="text-[10px] text-white/50">{st.spec}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-white/10 bg-black/90 p-3">
                  <div className="text-[9px] font-mono text-cyan-400 mb-1.5 flex items-center justify-between">
                    <span>KERNEL // {currentSystem.shortTitle}.PY</span>
                    <span>PYTHON 3.12</span>
                  </div>
                  <pre className="text-[10px] font-mono text-white/80 overflow-x-auto leading-relaxed">
                    <code>{currentSystem.codeSnippet || (currentSystem as any).code}</code>
                  </pre>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================== ZONE 5: CAPABILITIES & INFOBAY AI PROVENANCE ==================== */}
          {activeZone === 5 && (
            <motion.div
              key="zone-5"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="w-full max-w-6xl pointer-events-auto grid lg:grid-cols-12 gap-5"
            >
              {/* InfoBay AI Limited Career Card */}
              <div className="lg:col-span-5 p-6 rounded-3xl border border-cyan-400/35 bg-[#05060d]/90 backdrop-blur-2xl space-y-4">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-[10px] font-mono text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ACTIVE ROLE // FEB 2026 – PRESENT</span>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-display font-black uppercase text-white">
                    ASSOCIATE AI ENGINEER
                  </h2>
                  <div className="text-xs font-mono text-cyan-400 flex items-center gap-2 mt-1">
                    <MapPin size={13} />
                    <span>INFOBAY AI LIMITED &middot; LUCKNOW, INDIA</span>
                  </div>
                  <div className="text-[10px] font-mono text-white/50 mt-1">
                    FEB 2026 – PRESENT &middot; PYTHON SYSTEMS, AI EVALUATION & AUTOMATION
                  </div>
                </div>
                <p className="text-xs font-mono text-white/75 leading-relaxed">
                  Developing Python automation and data-processing systems, building AI/LLM evaluation workflows, designing dataset quality-control pipelines, and engineering fault-tolerant multiprocessing architectures.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link
                    to="/experience"
                    className="px-4 py-2 rounded-full bg-white text-black hover:bg-cyan-400 text-[10px] font-mono font-bold tracking-[0.2em] uppercase"
                  >
                    FULL EXPERIENCE PAGE
                  </Link>
                  <Link
                    to="/about"
                    className="px-4 py-2 rounded-full border border-white/20 hover:border-cyan-400 text-[10px] font-mono tracking-[0.2em] uppercase"
                  >
                    ABOUT SHIVANSH
                  </Link>
                </div>
              </div>

              {/* 4 Capability Pillars */}
              <div className="lg:col-span-7 grid sm:grid-cols-2 gap-3.5">
                {CAPABILITY_MATRIX.map((dom) => {
                  const Icon = dom.icon;
                  return (
                    <div
                      key={dom.code}
                      className="p-4 rounded-2xl border border-white/15 bg-[#05060d]/85 backdrop-blur-xl space-y-2.5"
                    >
                      <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold">
                        <Icon size={15} />
                        <span>{dom.title}</span>
                      </div>
                      <ul className="space-y-1 text-[11px] font-mono text-white/75">
                        {dom.skills.map((s) => (
                          <li key={s} className="flex items-center gap-1.5">
                            <span className="text-cyan-400">✦</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ==================== ZONE 6: TRANSMISSION STARGATE (CONTACT) ==================== */}
          {activeZone === 6 && (
            <motion.div
              key="zone-6"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="w-full max-w-3xl pointer-events-auto text-center p-8 sm:p-12 rounded-3xl border border-cyan-400/40 bg-[#05060d]/90 backdrop-blur-2xl space-y-6 shadow-[0_0_80px_rgba(0,240,255,0.2)]"
            >
              <div className="text-[10px] font-mono tracking-[0.35em] text-cyan-400 uppercase">
                PORTAL /06 // TRANSMISSION STARGATE [Z = -132m]
              </div>
              <h2 className="text-4xl sm:text-6xl font-display font-black uppercase tracking-tight text-white">
                START A PROJECT.
              </h2>
              <p className="text-xs sm:text-sm font-mono text-white/70 max-w-lg mx-auto leading-relaxed">
                Open for full-time AI engineering roles, high-concurrency Python systems architecture, and enterprise LLM/VLM evaluation pipelines.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  to="/contact"
                  className="px-7 py-3.5 rounded-full bg-white text-black hover:bg-cyan-400 font-mono text-xs font-bold tracking-[0.22em] uppercase transition-all flex items-center gap-2"
                >
                  <span>OPEN CONTACT TERMINAL</span>
                  <ArrowUpRight size={14} />
                </Link>

                <button
                  onClick={handleCopyEmail}
                  className="px-6 py-3.5 rounded-full border border-white/25 bg-black/60 hover:border-cyan-400 font-mono text-xs tracking-[0.18em] uppercase text-white flex items-center gap-2 cursor-pointer"
                >
                  {copiedEmail ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-cyan-400" />}
                  <span>{copiedEmail ? 'EMAIL COPIED' : 'DIMRISHIV933@GMAIL.COM'}</span>
                </button>

                <a
                  href="/SHIVANSH_DIMRI_CV.pdf"
                  download
                  className="px-6 py-3.5 rounded-full border border-white/25 bg-black/60 hover:border-fuchsia-400 font-mono text-xs tracking-[0.18em] uppercase text-white flex items-center gap-2"
                >
                  <Download size={14} />
                  <span>CV.PDF</span>
                </a>

                <button
                  onClick={() => {
                    soundEngine.playClick(800);
                    flyToZone(0);
                  }}
                  className="px-6 py-3.5 rounded-full border border-cyan-400/40 bg-cyan-400/10 hover:bg-cyan-400 hover:text-black font-mono text-xs tracking-[0.18em] uppercase text-cyan-300 flex items-center gap-2 cursor-pointer transition-all shadow-[0_0_20px_rgba(0,240,255,0.2)]"
                >
                  <RotateCcw size={14} />
                  <span>RETURN TO GATEWAY [Z = 0m]</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Left/Right Quick Step Chevrons for Tunnel Flight */}
      <div className="fixed bottom-20 right-6 z-30 hidden sm:flex items-center gap-1.5">
        <button
          onClick={() => {
            soundEngine.playClick(700);
            flyToZone(activeZone - 1);
          }}
          disabled={activeZone === 0}
          className="p-2 rounded-full border border-white/15 bg-black/70 text-white/70 hover:text-white hover:border-cyan-400 disabled:opacity-30 cursor-pointer"
          title="Previous Portal"
        >
          <ChevronLeft size={15} />
        </button>
        <button
          onClick={() => {
            soundEngine.playClick(760);
            flyToZone(activeZone + 1);
          }}
          disabled={activeZone === ZONE_LABELS.length - 1}
          className="p-2 rounded-full border border-white/15 bg-black/70 text-white/70 hover:text-white hover:border-cyan-400 disabled:opacity-30 cursor-pointer"
          title="Next Portal"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* ==================== FULL-SCREEN ALL-WORK INDEX DRAWER ==================== */}
      <AnimatePresence>
        {showIndexDrawer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#030308]/95 backdrop-blur-2xl overflow-y-auto p-6 sm:p-14 select-text"
          >
            <div className="max-w-6xl mx-auto space-y-12">
              <div className="flex items-center justify-between border-b border-white/15 pb-6">
                <div>
                  <div className="text-[10px] font-mono tracking-[0.3em] text-cyan-400">
                    ACTIVE DIRECTORY // COMPLETE PORTFOLIO ARCHIVE
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-display font-black uppercase text-white mt-1">
                    SHIVANSH DIMRI &mdash; WORK INDEX
                  </h2>
                </div>
                <button
                  onClick={() => setShowIndexDrawer(false)}
                  className="px-4 py-2 rounded-full border border-white/25 hover:border-cyan-400 font-mono text-xs tracking-[0.2em] flex items-center gap-2 cursor-pointer"
                >
                  <span>CLOSE</span>
                  <X size={15} />
                </button>
              </div>

              {/* Flagship Engines List */}
              <div className="space-y-4">
                <div className="text-xs font-mono tracking-[0.25em] text-cyan-400 uppercase">
                  01 // FLAGSHIP PYTHON &amp; CONCURRENCY SYSTEMS ({ALL_PROJECTS.length} SYSTEMS)
                </div>
                <div className="grid md:grid-cols-3 gap-5">
                  {ALL_PROJECTS.map((sys) => (
                    <div
                      key={sys.id}
                      className="p-6 rounded-2xl border border-white/15 bg-white/[0.03] flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="text-[10px] font-mono text-cyan-400">/{sys.index} // {sys.shortTitle}</div>
                        <h3 className="text-xl font-display font-black uppercase text-white">{sys.title}</h3>
                        <p className="text-xs font-mono text-white/70 leading-relaxed">{sys.description}</p>
                      </div>
                      <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                        <button
                          onClick={() => {
                            soundEngine.playClick(880);
                            setShowIndexDrawer(false);
                            if (sys.zoneIndex && sys.zoneIndex >= 1 && sys.zoneIndex <= 4) {
                              flyToZone(sys.zoneIndex);
                            }
                            setModalSystem(sys);
                          }}
                          className="px-3.5 py-2 rounded-full bg-white text-black font-mono text-[10px] font-bold tracking-wider uppercase cursor-pointer"
                        >
                          OPEN CASE STUDY
                        </button>
                        <a
                          href={sys.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 rounded-full border border-white/20 text-[10px] font-mono uppercase"
                        >
                          GITHUB
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Core Capabilities & Skills Matrix */}
              <div className="space-y-4">
                <div className="text-xs font-mono tracking-[0.25em] text-cyan-400 uppercase flex items-center justify-between">
                  <span>02 // CORE CAPABILITIES & SKILLS MATRIX</span>
                  <Link
                    to="/experience"
                    onClick={() => {
                      soundEngine.playClick(800);
                      setShowIndexDrawer(false);
                    }}
                    className="text-white/60 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
                  >
                    <span>VIEW FULL SKILLS MATRIX</span>
                    <ArrowUpRight size={12} />
                  </Link>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {CAPABILITY_MATRIX.map((c) => (
                    <div
                      key={c.code}
                      className="p-4 rounded-2xl border border-white/15 bg-white/[0.02] hover:border-cyan-400 transition-all space-y-2"
                    >
                      <div className="text-[10px] font-mono text-cyan-400">/{c.code} // DOMAIN</div>
                      <div className="text-sm font-display font-black text-white">{c.title}</div>
                      <ul className="space-y-1 text-[10px] font-mono text-white/70">
                        {c.skills.slice(0, 3).map((s) => (
                          <li key={s} className="truncate">✦ {s}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Architecture Whitepapers Banner */}
              <div className="p-6 rounded-2xl border border-cyan-400/30 bg-gradient-to-r from-cyan-400/10 via-black to-fuchsia-400/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono tracking-[0.25em] text-cyan-300 uppercase font-bold">
                    DEEP DIVE DOCUMENTATION
                  </div>
                  <div className="text-lg font-display font-black text-white uppercase">
                    3 TECHNICAL ARCHITECTURE WHITEPAPERS
                  </div>
                  <div className="text-xs font-mono text-white/60">
                    Bypassing CPython's GIL &middot; SQLite WAL State Machines &middot; Multimodal AI Regression Harnesses
                  </div>
                </div>

                <Link
                  to="/architecture"
                  onClick={() => {
                    soundEngine.playClick(840);
                    setShowIndexDrawer(false);
                  }}
                  className="px-5 py-2.5 rounded-full bg-cyan-400 text-black font-mono text-xs font-bold tracking-wider uppercase flex items-center gap-2 hover:bg-white transition-all whitespace-nowrap"
                >
                  <span>READ WHITEPAPERS</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== CASE STUDY KERNEL MODAL ==================== */}
      <AnimatePresence>
        {modalSystem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-8 select-text"
          >
            <motion.div
              initial={{ y: 25, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.96 }}
              className="w-full max-w-4xl max-h-[88vh] overflow-y-auto rounded-3xl border border-cyan-400/40 bg-[#05050b] p-6 sm:p-10 relative"
            >
              <div className="flex items-start justify-between gap-4 pb-6 mb-6 border-b border-white/15">
                <div>
                  <div className="text-[10px] font-mono tracking-[0.25em] text-cyan-400">
                    CASE STUDY // {modalSystem.index} &middot; {modalSystem.category}
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-display font-black uppercase text-white mt-1">
                    {modalSystem.title}
                  </h3>
                </div>
                <button
                  onClick={() => setModalSystem(null)}
                  className="p-2 rounded-full border border-white/20 hover:border-cyan-400 text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-sm font-mono text-white/80 leading-relaxed mb-6">
                {modalSystem.description}
              </p>

              {modalSystem.problem && (
                <div className="mb-4 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="text-[10px] font-mono text-red-400 uppercase tracking-wider mb-1">
                    PROBLEM &amp; BOTTLENECK
                  </div>
                  <p className="text-xs font-mono text-white/75 leading-relaxed">{modalSystem.problem}</p>
                </div>
              )}

              {modalSystem.solution && (
                <div className="mb-6 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider mb-1">
                    ENGINEERING SOLUTION
                  </div>
                  <p className="text-xs font-mono text-white/75 leading-relaxed">{modalSystem.solution}</p>
                </div>
              )}

              {modalSystem.pipeline && modalSystem.pipeline.length > 0 && (
                <div className="mb-6">
                  <div className="text-[10px] font-mono tracking-[0.22em] text-cyan-400 uppercase flex items-center gap-2 mb-2">
                    <Activity size={13} />
                    <span>EXECUTION PIPELINE</span>
                  </div>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {modalSystem.pipeline.map((st) => (
                      <div key={st.step} className="px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] text-xs font-mono">
                        <div className="text-cyan-400 font-bold">/{st.step} {st.name}</div>
                        <div className="text-[10px] text-white/50">{st.spec}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {(modalSystem.telemetry || modalSystem.metrics || []).map((t) => (
                  <div key={t.label} className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02]">
                    <div className="text-[9px] font-mono text-white/45">{t.label}</div>
                    <div className="text-lg font-display font-black text-cyan-300 mt-1">{t.value}</div>
                    <div className="text-[10px] font-mono text-white/50">{t.sub}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-white/15 bg-black mb-6 overflow-hidden">
                <div className="px-4 py-2 border-b border-white/10 text-[10px] font-mono text-cyan-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Code2 size={12} />
                    <span>IMPLEMENTATION // {modalSystem.shortTitle}.PY</span>
                  </span>
                  <span>PYTHON 3.12</span>
                </div>
                <pre className="p-4 text-xs font-mono text-white/85 overflow-x-auto">
                  <code>{modalSystem.codeSnippet || (modalSystem as any).code}</code>
                </pre>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <a
                  href={modalSystem.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-full bg-cyan-400 text-black font-mono text-xs font-bold tracking-[0.2em] uppercase flex items-center gap-2"
                >
                  <Github size={15} />
                  <span>OPEN GITHUB REPOSITORY</span>
                  <ArrowUpRight size={14} />
                </a>
                <button
                  onClick={() => setModalSystem(null)}
                  className="px-5 py-3 rounded-full border border-white/20 font-mono text-xs tracking-[0.2em] text-white/70 hover:text-white cursor-pointer"
                >
                  [ CLOSE // ESC ]
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Hardware Telemetry HUD Ticker */}
      <TelemetryTicker />
    </div>
  );
};

export default ActiveTheoryExperience;
