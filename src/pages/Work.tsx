import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Cpu,
  Terminal,
  Shield,
  ExternalLink,
  Github,
  CheckCircle2,
  Layers,
  ArrowRight,
  Code2,
  HardDrive,
  Workflow,
  Sparkles,
  Zap,
} from 'lucide-react';
import Layout from '@/components/Layout';
import ScrambleText from '@/components/activetheory/ScrambleText';
import { soundEngine } from '@/components/activetheory/SoundEngine';
import ArchitecturePlayground from '@/components/activetheory/ArchitecturePlayground';
import { ALL_PROJECTS } from '@/data/projects';

const SYSTEMS = ALL_PROJECTS;

const SKILL_PILLARS = [
  {
    icon: Cpu,
    title: 'High-Throughput Concurrency & GIL Avoidance',
    description:
      'Deep architectural mastery over Python multiprocessing pools, asynchronous event loops (asyncio), process queues, and CPU-core aware worker scaling for compute-bound systems.',
    highlights: ['multiprocessing.Pool', 'ProcessPoolExecutor', 'asyncio.gather', 'Shared Memory', 'CPU-1 Strategy'],
  },
  {
    icon: Shield,
    title: 'Fault-Tolerance & State Checkpointing',
    description:
      'Designing mission-critical systems that can be killed at any millisecond with SIGKILL and resume with zero data corruption or duplication using atomic WAL journaling.',
    highlights: ['SQLite WAL', 'Atomic File Moves', 'Resumable State Machines', 'Signal Trapping', 'CRC32 / SHA-256'],
  },
  {
    icon: Workflow,
    title: 'Autonomous Multi-Agent & VLM Evaluation',
    description:
      'Architecting multi-agent swarms, LLM benchmarking pipelines, prompt regression suites, vision-language model verification, and structured Pydantic schema validation.',
    highlights: ['LangGraph', 'VLM Multimodal Reasoning', 'Pydantic v2', 'Token-Bucket Rate Limiting', 'Rubric Scoring'],
  },
  {
    icon: HardDrive,
    title: 'Data Engineering & Scalable ETL Pipelines',
    description:
      'High-volume data transformation, acoustic and cryptographic deduplication, streaming chunked file I/O, and bounded memory ceilings that scale to millions of records.',
    highlights: ['Torchaudio / Chromaprint', 'Chunked File Streaming', 'tracemalloc Profiling', 'PostgreSQL / SQLite'],
  },
];

const Work = () => {
  const [activeSystemId, setActiveSystemId] = useState<string>(SYSTEMS[0].id);
  const activeSystem = SYSTEMS.find((s) => s.id === activeSystemId) || SYSTEMS[0];

  return (
    <Layout>
      {/* ==================== HERO SECTION ==================== */}
      <section className="mb-16">
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-[10px] tracking-[0.3em] uppercase mb-3">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
          <span>PORTAL // 01 // SYSTEMS & PRODUCTION ARCHITECTURE</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-display font-black uppercase tracking-tight text-white mb-6">
          <ScrambleText text="SYSTEMS & ARCHITECTURE" />
        </h1>

        <p className="text-sm sm:text-base font-mono text-white/70 max-w-3xl leading-relaxed mb-8">
          I build reliable Python systems, AI evaluation workflows, data-processing pipelines, and automation infrastructure for complex engineering problems.
        </p>

        {/* Top Telemetry Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
            <div className="text-[10px] font-mono text-white/40 tracking-[0.2em] mb-1">TOTAL ARCHITECTURES</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-cyan-300">6 PRODUCTION</div>
          </div>
          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
            <div className="text-[10px] font-mono text-white/40 tracking-[0.2em] mb-1">DATA INTEGRITY</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-400">ATOMIC WAL</div>
          </div>
          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
            <div className="text-[10px] font-mono text-white/40 tracking-[0.2em] mb-1">CONCURRENCY MODEL</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-fuchsia-300">CORE-AWARE</div>
          </div>
          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
            <div className="text-[10px] font-mono text-white/40 tracking-[0.2em] mb-1">AI BENCHMARK VOLUME</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-cyan-300">50K+ / DAY</div>
          </div>
        </div>
      </section>

      {/* ==================== SYSTEM SELECTOR TABS ==================== */}
      <section className="mb-12">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {SYSTEMS.map((system) => {
            const isSelected = system.id === activeSystemId;
            return (
              <button
                key={system.id}
                onClick={() => {
                  soundEngine.playClick(700);
                  setActiveSystemId(system.id);
                }}
                onMouseEnter={() => soundEngine.playHover()}
                className={`flex-shrink-0 px-4 py-2.5 rounded-full font-mono text-xs tracking-[0.16em] uppercase transition-all flex items-center gap-2.5 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-400 text-black font-bold shadow-[0_0_20px_rgba(0,240,255,0.4)]'
                    : 'border border-white/15 bg-white/[0.03] text-white/70 hover:text-white hover:border-white/30'
                }`}
              >
                <span className={isSelected ? 'text-black' : 'text-cyan-400 font-bold'}>
                  [{system.code}]
                </span>
                <span>{system.title.split('–')[0].split('&')[0].trim()}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ==================== ACTIVE SYSTEM DETAIL VIEW ==================== */}
      <AnimatePresence mode="wait">
        <motion.section
          key={activeSystem.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className="mb-20 space-y-8"
        >
          {/* System Banner Header */}
          <div className="p-6 sm:p-8 rounded-3xl border border-white/15 bg-[#05060d]/80 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 text-8xl font-display font-black text-white/[0.03] pointer-events-none select-none">
              {activeSystem.code}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 font-mono text-[10px] tracking-[0.2em]">
                <span>{activeSystem.category}</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 font-mono text-[10px] tracking-[0.2em]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{activeSystem.status}</span>
              </div>
            </div>

            <h2 className="text-2xl sm:text-4xl font-display font-black uppercase text-white mb-4">
              {activeSystem.title}
            </h2>

            <p className="text-sm font-mono text-white/80 max-w-3xl leading-relaxed mb-6">
              {activeSystem.description}
            </p>

            {/* Tech Chips */}
            <div className="flex flex-wrap gap-2 mb-8">
              {activeSystem.technologies.map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.04] text-[10px] font-mono text-white/70 tracking-wider"
                >
                  {tech}
                </span>
              ))}
            </div>

            {/* Performance Benchmark Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10">
              {activeSystem.metrics.map((m) => (
                <div key={m.label} className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
                  <div className="text-[9px] font-mono text-white/40 tracking-[0.18em] mb-1">{m.label}</div>
                  <div className="text-sm sm:text-base font-mono font-bold text-cyan-300">{m.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Problem vs Architecture Split */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* The Engineering Challenge */}
            <div className="p-6 rounded-3xl border border-white/10 bg-[#04050a]/70 backdrop-blur-md space-y-4">
              <div className="text-xs font-mono tracking-[0.2em] text-red-400 flex items-center gap-2">
                <span>[ 01 // THE SYSTEM BOTTLENECK ]</span>
              </div>
              <p className="text-xs sm:text-sm font-mono text-white/75 leading-relaxed">
                {activeSystem.problem}
              </p>
              <div className="text-xs font-mono tracking-[0.2em] text-cyan-400 pt-3 border-t border-white/10 flex items-center gap-2">
                <span>[ 02 // ARCHITECTURAL SOLUTION ]</span>
              </div>
              <p className="text-xs sm:text-sm font-mono text-white/75 leading-relaxed">
                {activeSystem.solution}
              </p>
            </div>

            {/* Architectural Pillars */}
            <div className="p-6 rounded-3xl border border-white/10 bg-[#04050a]/70 backdrop-blur-md space-y-3">
              <div className="text-xs font-mono tracking-[0.2em] text-emerald-400 flex items-center gap-2 mb-3">
                <span>[ 03 // RELIABILITY GUARANTEES ]</span>
              </div>
              <ul className="space-y-3">
                {activeSystem.architecturePoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs font-mono text-white/80 leading-relaxed">
                    <CheckCircle2 size={14} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-4">
                <a
                  href={activeSystem.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => soundEngine.playClick(900)}
                  onMouseEnter={() => soundEngine.playHover()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black hover:bg-cyan-400 font-mono text-xs font-bold tracking-[0.18em] uppercase transition-all"
                >
                  <Github size={14} />
                  <span>INSPECT SOURCE REPOSITORY</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>

          {/* Interactive Code Kernel Window */}
          <div className="rounded-3xl border border-white/15 bg-[#030408] overflow-hidden shadow-2xl">
            <div className="px-5 py-3 border-b border-white/10 bg-black/60 flex items-center justify-between text-[11px] font-mono text-white/60">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                <span className="ml-2 text-cyan-400">KERNEL // {activeSystem.id.toUpperCase()}.PY</span>
              </div>
              <div className="flex items-center gap-2">
                <Code2 size={13} />
                <span>PYTHON 3.12 PRODUCTION RUNTIME</span>
              </div>
            </div>
            <pre className="p-6 text-xs font-mono text-white/85 overflow-x-auto leading-relaxed bg-[#020204]">
              <code>{activeSystem.codeSnippet}</code>
            </pre>
          </div>
        </motion.section>
      </AnimatePresence>

      {/* ==================== INTERACTIVE ARCHITECTURE PLAYGROUND ==================== */}
      <section className="mb-20">
        <ArchitecturePlayground />
      </section>

      {/* ==================== CORE ENGINEERING SKILLS SECTION ==================== */}
      <section className="pt-8 border-t border-white/10">
        <div className="flex items-center gap-2 text-fuchsia-400 font-mono text-[10px] tracking-[0.3em] uppercase mb-2">
          <span>CAPABILITY MATRIX // PRODUCTION EXPERTISE</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-display font-black uppercase text-white mb-6">
          <ScrambleText text="CORE ENGINEERING SKILLS" />
        </h2>
        <p className="text-xs sm:text-sm font-mono text-white/60 max-w-2xl leading-relaxed mb-10">
          How my technical skills map directly to production infrastructure, fault-tolerant execution, and scalable AI systems.
        </p>

        <div className="grid md:grid-cols-2 gap-5">
          {SKILL_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="p-6 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl hover:border-cyan-400/40 transition-colors space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-400">
                    <Icon size={18} />
                  </div>
                  <h3 className="font-mono text-sm sm:text-base font-bold text-white tracking-wide">
                    {pillar.title}
                  </h3>
                </div>
                <p className="text-xs font-mono text-white/70 leading-relaxed">
                  {pillar.description}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {pillar.highlights.map((h) => (
                    <span
                      key={h}
                      className="px-2.5 py-1 rounded-full border border-white/10 bg-black/50 text-[10px] font-mono text-cyan-300/90"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </Layout>
  );
};

export default Work;
