import React from 'react';
import { motion } from 'framer-motion';
import {
  Terminal,
  Shield,
  Cpu,
  Brain,
  Download,
  ArrowRight,
  Compass,
  CheckCircle2,
  Code2,
  HardDrive,
  Workflow,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import ScrambleText from '@/components/activetheory/ScrambleText';
import { soundEngine } from '@/components/activetheory/SoundEngine';

const MANIFESTO_PILLARS = [
  {
    code: '01',
    title: 'Simplicity is Prerequisite for Reliability',
    desc: 'Avoid bloated micro-abstractions, excessive layers, or speculative frameworks. Straightforward control flow, explicit state machines, and direct standard library primitives outperform over-engineered systems every single time.',
  },
  {
    code: '02',
    title: 'Deterministic Anchors for Stochastic AI',
    desc: 'Generative models are probabilistic by nature; the engineering harness surrounding them must be rigorously deterministic. Enforce strict Pydantic v2 schemas, automated regression rubric scoring, and cryptographic verification.',
  },
  {
    code: '03',
    title: 'Crash-Resilient & Resumable by Default',
    desc: 'Every data pipeline must anticipate unannounced SIGKILL, network disconnects, or power failure at any millisecond. Writing with atomic file replacements, WAL journaling, and byte-offset checkpoints ensures verifiable data integrity and reliable checkpoint resume.',
  },
  {
    code: '04',
    title: 'Bound Resources & Eliminate Memory Leaks',
    desc: 'Throughput is meaningless if memory swells uncontrollably. Architect streaming chunk buffers, generator pipelines, and core-aware process limits to ensure predictable memory ceilings regardless of dataset scale.',
  },
];

const STACK_MATRIX = [
  {
    domain: 'AI & MODEL ENGINEERING',
    tools: ['LangGraph / LangChain', 'VLM Multimodal Reasoning', 'Pydantic v2 Schema Constraints', 'Model Benchmarking & Regression', 'RAG & Vector Embeddings', 'Ollama & HuggingFace'],
  },
  {
    domain: 'CONCURRENCY & DATA SYSTEMS',
    tools: ['Python 3.12 Standard Library', 'multiprocessing & ProcessPool', 'asyncio & Asynchronous Streams', 'SQLite WAL & PostgreSQL', 'Chromaprint Acoustic Hashing', 'SHA-256 Block Verification'],
  },
  {
    domain: 'INFRASTRUCTURE & ENVIRONMENT',
    tools: ['Linux (Ubuntu, Debian)', 'Systemd Service Daemons', 'Embedded Rsync / OpenSSH', 'Docker Containerization', 'Git & GitHub Actions CI/CD', 'cProfile & tracemalloc Profiling'],
  },
  {
    domain: 'CREATIVE & INTERFACE SYSTEMS',
    tools: ['React 18 & TypeScript', 'Three.js / WebGL & GLSL Shaders', 'Framer Motion Animations', 'Tailwind CSS Modern Styling', 'Web Audio API Procedural Synth', 'Active Theory Cyberpunk UI'],
  },
];

const About = () => {
  return (
    <Layout>
      {/* ==================== HERO SECTION ==================== */}
      <section className="mb-16">
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-[10px] tracking-[0.3em] uppercase mb-3">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
          <span>PORTAL // 03 // SYSTEMS PHILOSOPHY & IDENTITY</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-display font-black uppercase tracking-tight text-white mb-6">
          <ScrambleText text="ENGINEERING PROVENANCE" />
        </h1>

        <p className="text-sm sm:text-base font-mono text-white/70 max-w-3xl leading-relaxed mb-8">
          I am an Associate AI Engineer at InfoBay AI Limited, focused on building Python-based engineering systems, AI evaluation workflows, and scalable data-processing infrastructure.
        </p>

        {/* Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
            <div className="text-[10px] font-mono text-white/40 tracking-[0.2em] mb-1">TOTAL TRACK RECORD</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-cyan-300">2+ YEARS</div>
          </div>
          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
            <div className="text-[10px] font-mono text-white/40 tracking-[0.2em] mb-1">CURRENT FIRM</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-400">INFOBAY AI</div>
          </div>
          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
            <div className="text-[10px] font-mono text-white/40 tracking-[0.2em] mb-1">PRIMARY DOMAINS</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-fuchsia-300">AI & SYSTEMS</div>
          </div>
          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
            <div className="text-[10px] font-mono text-white/40 tracking-[0.2em] mb-1">LOCATION</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-cyan-300">LUCKNOW, IN</div>
          </div>
        </div>
      </section>

      {/* ==================== BIOGRAPHY & TRAJECTORY ==================== */}
      <section className="mb-20 grid lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl border border-white/15 bg-[#05060d]/85 backdrop-blur-xl space-y-5">
            <div className="text-[10px] font-mono tracking-[0.25em] text-cyan-400 uppercase">
              BIOGRAPHICAL OVERVIEW // ABOUT ME
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-black uppercase text-white">
              ENGINEERING TESTED, HIGH-RELIABILITY SYSTEMS.
            </h2>
            <p className="text-xs sm:text-sm font-mono text-white/80 leading-relaxed">
              I am an Associate AI Engineer at InfoBay AI Limited, focused on building Python-based engineering systems, AI evaluation workflows, and scalable data-processing infrastructure.
            </p>
            <p className="text-xs sm:text-sm font-mono text-white/80 leading-relaxed">
              My work involves developing automation pipelines, evaluating LLM and multimodal model outputs, designing dataset quality-control systems, and building fault-tolerant processing architectures.
            </p>
            <p className="text-xs sm:text-sm font-mono text-white/75 leading-relaxed">
              I work across Python, SQL, AI/LLM integration, data engineering, concurrency, and system automation, with an emphasis on reliability, reproducibility, and measurable engineering outcomes.
            </p>
            <p className="text-xs sm:text-sm font-mono text-white/75 leading-relaxed">
              I am particularly interested in the intersection of AI systems, evaluation infrastructure, and large-scale data engineering. Prior to my AI focus, I developed high-performance storage migration utilities (T2NAS), hash-based audio deduplication engines, and self-contained rsync orchestration daemons.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/work"
                onClick={() => soundEngine.playClick(800)}
                className="px-5 py-2.5 rounded-full bg-white text-black hover:bg-cyan-400 font-mono text-xs font-bold tracking-[0.18em] uppercase transition-all flex items-center gap-1.5"
              >
                <span>EXPLORE SYSTEMS WORK</span>
                <ArrowRight size={13} />
              </Link>
              <a
                href="/SHIVANSH_DIMRI_CV.pdf"
                download
                onClick={() => soundEngine.playClick(920)}
                className="px-5 py-2.5 rounded-full border border-white/20 bg-white/5 hover:border-cyan-400 font-mono text-xs tracking-[0.18em] uppercase text-white transition-all flex items-center gap-1.5"
              >
                <Download size={13} />
                <span>DOWNLOAD CV.PDF</span>
              </a>
            </div>
          </div>
        </div>

        {/* Systems Diagnostics Card */}
        <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl border border-cyan-400/30 bg-[#04050a]/90 backdrop-blur-xl space-y-5">
          <div className="text-[10px] font-mono tracking-[0.25em] text-cyan-400 uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>DIAGNOSTICS & TELEMETRY</span>
          </div>

          <div className="space-y-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
              <span className="text-white/60">PRIMARY OPERATING RUNTIME</span>
              <span className="text-cyan-300 font-bold">PYTHON 3.12 (CPYTHON)</span>
            </div>
            <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
              <span className="text-white/60">CONCURRENCY ENGINE</span>
              <span className="text-fuchsia-300 font-bold">MULTIPROCESSING + ASYNCIO</span>
            </div>
            <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
              <span className="text-white/60">DATA INTEGRITY LOG</span>
              <span className="text-emerald-400 font-bold">SQLITE WAL / POSTGRES</span>
            </div>
            <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
              <span className="text-white/60">EVALUATION MODEL FOCUS</span>
              <span className="text-cyan-300 font-bold">LLMs, VLMs & AGENTS</span>
            </div>
            <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
              <span className="text-white/60">OS TARGETS</span>
              <span className="text-white/90 font-bold">LINUX (SYSTEMD) / WINDOWS</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== ENGINEERING MANIFESTO ==================== */}
      <section className="mb-20 pt-8 border-t border-white/10">
        <div className="text-[10px] font-mono tracking-[0.25em] text-fuchsia-400 uppercase mb-2">
          AXIOMS // FIRST PRINCIPLES
        </div>
        <h2 className="text-3xl sm:text-5xl font-display font-black uppercase text-white mb-6">
          <ScrambleText text="ENGINEERING MANIFESTO" />
        </h2>
        <p className="text-xs sm:text-sm font-mono text-white/60 max-w-2xl leading-relaxed mb-10">
          The non-negotiable architectural tenets that govern every system I construct.
        </p>

        <div className="grid md:grid-cols-2 gap-5">
          {MANIFESTO_PILLARS.map((pillar) => (
            <div
              key={pillar.code}
              className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl space-y-4 hover:border-cyan-400/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-cyan-400 font-bold tracking-[0.2em]">
                  [ PRINCIPLE {pillar.code} ]
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-display font-black uppercase text-white">
                {pillar.title}
              </h3>
              <p className="text-xs sm:text-sm font-mono text-white/70 leading-relaxed">
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== COMPREHENSIVE TECH STACK ==================== */}
      <section className="mb-20 pt-8 border-t border-white/10">
        <div className="text-[10px] font-mono tracking-[0.25em] text-cyan-400 uppercase mb-2">
          TOOLCHAINS // PRODUCTION STACK
        </div>
        <h2 className="text-3xl sm:text-5xl font-display font-black uppercase text-white mb-6">
          <ScrambleText text="TECHNICAL MATRIX" />
        </h2>
        <p className="text-xs sm:text-sm font-mono text-white/60 max-w-2xl leading-relaxed mb-10">
          Tools, libraries, and frameworks deployed across production pipelines and system kernels.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STACK_MATRIX.map((stack) => (
            <div
              key={stack.domain}
              className="p-6 rounded-3xl border border-white/10 bg-[#04050a]/70 backdrop-blur-md space-y-4"
            >
              <div className="text-xs font-mono font-bold text-cyan-300 tracking-wider">
                {stack.domain}
              </div>
              <ul className="space-y-2 text-xs font-mono text-white/75">
                {stack.tools.map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <span className="text-cyan-400 text-[10px]">✦</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default About;
