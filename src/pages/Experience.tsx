import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Cpu,
  Database,
  Terminal,
  Shield,
  Layers,
  MapPin,
  Calendar,
  Building2,
  CheckCircle2,
  Sparkles,
  Workflow,
  GitBranch,
  Server,
  Code2,
  Flame,
  ArrowUpRight,
} from 'lucide-react';
import Layout from '@/components/Layout';
import ScrambleText from '@/components/activetheory/ScrambleText';
import { soundEngine } from '@/components/activetheory/SoundEngine';

interface SkillCategory {
  id: string;
  name: string;
  icon: typeof Brain;
  tagline: string;
  skills: {
    name: string;
    level: string;
    desc: string;
    tags: string[];
  }[];
}

const SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: 'ai-engineering',
    name: 'AI Engineering & LLM/VLM Systems',
    icon: Brain,
    tagline: 'Autonomous multi-agent architectures, model evaluation harnesses, and multimodal reasoning.',
    skills: [
      {
        name: 'Autonomous Multi-Agent Swarms',
        level: 'Advanced',
        desc: 'Orchestrating collaborative agent networks with specialized roles, state machines, and consensus debate mechanisms using LangGraph and LangChain.',
        tags: ['LangGraph', 'Multi-Agent', 'Agentic Workflows', 'Consensus Loops'],
      },
      {
        name: 'VLM & Multimodal Model Evaluation',
        level: 'Production',
        desc: 'Constructing rigorous benchmark suites for Vision-Language Models evaluating OCR precision, document understanding, and spatial bounding boxes.',
        tags: ['Vision-Language Models', 'Benchmarking', 'Grounding', 'Multimodal QA'],
      },
      {
        name: 'Structured Schema Enforcement',
        level: 'Expert',
        desc: 'Guaranteeing 100% deterministic JSON outputs and strict model compliance using Pydantic v2 schemas and native function calling.',
        tags: ['Pydantic v2', 'JSON Schema', 'Tool Calling', 'Grammar Constrained'],
      },
      {
        name: 'RAG & Dense Semantic Retrieval',
        level: 'Advanced',
        desc: 'Designing retrieval-augmented generation architectures with chunking strategies, dense embeddings, re-ranking, and vector databases.',
        tags: ['Vector Embeddings', 'RAG Pipelines', 'Hybrid Search', 'Re-ranking'],
      },
      {
        name: 'Automated Regression Testing & Rubrics',
        level: 'Production',
        desc: 'Automating continuous evaluation harnesses across model releases to detect hallucination drift and reasoning degradation.',
        tags: ['Automated Eval', 'Rubric Scoring', 'Hallucination Checks', 'MLOps'],
      },
    ],
  },
  {
    id: 'python-concurrency',
    name: 'High-Throughput Python & Concurrency',
    icon: Cpu,
    tagline: 'Multi-core processing, asynchronous I/O event loops, and low-level process supervisors.',
    skills: [
      {
        name: 'Multiprocessing & GIL Avoidance',
        level: 'Expert',
        desc: 'Bypassing the CPython Global Interpreter Lock (GIL) via dynamic worker pool allocation (CPU count − 1 strategy) and inter-process queues.',
        tags: ['multiprocessing.Pool', 'ProcessPoolExecutor', 'IPC Queues', 'Worker Scaling'],
      },
      {
        name: 'Asynchronous I/O & Event Loops',
        level: 'Advanced',
        desc: 'Asynchronous network calls, token-bucket rate limiting semaphores, and non-blocking streaming data pipelines.',
        tags: ['asyncio', 'Semaphores', 'Task Groups', 'aiohttp'],
      },
      {
        name: 'Subprocess Pipelines & Stream Parsing',
        level: 'Expert',
        desc: 'Managing external binary runtimes with non-blocking stdout/stderr pipe streaming, regex progress extraction, and buffer control.',
        tags: ['subprocess.Popen', 'Pipe Streaming', 'Regex Parsers', 'Daemon Control'],
      },
      {
        name: 'Memory Ceiling & Resource Profiling',
        level: 'Production',
        desc: 'Preventing OOM errors on multi-gigabyte transfers using streaming file chunks, generator pipelines, and memory profiling.',
        tags: ['tracemalloc', 'Memory Bounding', 'Generator Pipelines', 'Resource Limits'],
      },
      {
        name: 'Signal Trapping & Clean Teardown',
        level: 'Advanced',
        desc: 'Trapping POSIX SIGINT/SIGTERM signals to execute safe state flushes, close database handles, and terminate child workers.',
        tags: ['signal.signal', 'Graceful Shutdown', 'Atomic Cleanup', 'POSIX'],
      },
    ],
  },
  {
    id: 'data-engineering',
    name: 'Fault-Tolerant Data Engineering',
    icon: Database,
    tagline: 'Deduplication, atomic state stores, and crash-resilient streaming data pipelines.',
    skills: [
      {
        name: 'State Checkpointing & Resumability',
        level: 'Expert',
        desc: 'Zero-data-loss state machines persisting byte offsets and processed entity IDs to survive unannounced power loss or process kill.',
        tags: ['Atomic Checkpointing', 'Resumable State', 'Zero Duplication', 'Crash Proof'],
      },
      {
        name: 'Acoustic & Hash Deduplication',
        level: 'Expert',
        desc: 'Dual-phase deduplication pipelines combining perceptual acoustic hashing (Chromaprint) with cryptographic byte hashes (SHA-256).',
        tags: ['Chromaprint', 'PyTorch Audio', 'SHA-256', 'Collision Detection'],
      },
      {
        name: 'Transactional State Stores (SQLite WAL)',
        level: 'Advanced',
        desc: 'Configuring SQLite in Write-Ahead Logging (WAL) mode for concurrent high-speed reads and thread-safe batch transaction writes.',
        tags: ['SQLite WAL', 'PostgreSQL', 'ACID Transactions', 'Concurrency Locks'],
      },
      {
        name: 'High-Volume ETL & Data Validation',
        level: 'Production',
        desc: 'Batch processing 100k+ vendor datasets with schema validation, malformed file quarantine, and structured CSV/Parquet reporting.',
        tags: ['ETL Pipelines', 'Schema Validation', 'Batch Processing', 'Quarantine Logic'],
      },
    ],
  },
  {
    id: 'systems-infrastructure',
    name: 'Systems, Linux & Infrastructure',
    icon: Server,
    tagline: 'Linux systemd services, embedded network tooling, and automated deployment pipelines.',
    skills: [
      {
        name: 'Linux Systemd Daemons & Automation',
        level: 'Advanced',
        desc: 'Authoring systemd unit files, background process supervisors, log rotation, and automated service recovery on failure.',
        tags: ['Systemd Units', 'Linux Daemons', 'Journalctl', 'Bash Automation'],
      },
      {
        name: 'Enterprise Rsync & Network Storage',
        level: 'Expert',
        desc: 'Packaging embedded portable rsync/OpenSSH runtimes, configuring NAS/SAN network mounts, and differential delta replication.',
        tags: ['Rsync Core', 'OpenSSH Keys', 'NAS / SAN', 'Delta Compression'],
      },
      {
        name: 'Containerization & CI/CD Pipelines',
        level: 'Proficient',
        desc: 'Docker container packaging for isolated worker execution and GitHub Actions workflows for automated linting and build validation.',
        tags: ['Docker', 'GitHub Actions', 'CI/CD Automation', 'Environment Isolation'],
      },
      {
        name: 'Modern Web Engineering',
        level: 'Advanced',
        desc: 'Building responsive, high-performance interfaces with React 18, TypeScript, Tailwind CSS, Three.js / WebGL, and Framer Motion.',
        tags: ['React 18', 'TypeScript', 'Three.js / WebGL', 'Framer Motion', 'Tailwind CSS'],
      },
    ],
  },
];

const CAREER_TIMELINE = [
  {
    role: 'Associate AI Engineer',
    company: 'InfoBay AI Limited',
    location: 'Lucknow, India (On-site)',
    period: 'Oct 2026 – Present',
    status: 'PROMOTED // ACTIVE ROLE',
    highlights: [
      'Promoted rapidly to Associate AI Engineer following demonstrated impact in autonomous evaluation systems and model verification.',
      'Architecting and scaling automated evaluation harnesses for Large Language Models & Vision-Language Models.',
      'Developing distributed multi-agent swarm pipelines for complex reasoning, benchmark verification, and rubric scoring.',
      'Engineering fault-tolerant Python multiprocessing pipelines handling 100,000+ data samples with zero data corruption.',
      'Enforcing strict Pydantic v2 schema constraints and database-backed transactional integrity across AI output streams.',
      'Leading engineering documentation, automated testing standards, and failure-resilient process recovery architecture.',
    ],
    tech: ['Python 3.12', 'Multiprocessing', 'LangGraph', 'VLMs', 'Pydantic v2', 'SQLite WAL', 'Docker'],
  },
  {
    role: 'AI Systems Developer / Vibe Coder',
    company: 'InfoBay AI Limited',
    location: 'Lucknow, India (On-site)',
    period: 'Feb 2026 – Oct 2026',
    status: 'PROMOTED TO ASSOCIATE AI ENG',
    highlights: [
      'Accelerated feature development using cutting-edge AI coding agents and LLM-assisted programming paradigms.',
      'Engineered automated validation scripts and rapid prototyping workflows for core data engineering initiatives.',
      'Assisted in model testing, benchmark dataset generation, and verification pipeline implementation.',
    ],
    tech: ['Python', 'AI-Assisted Dev', 'Prompt Engineering', 'Rapid Prototyping', 'Git'],
  },
  {
    role: 'Lead Systems Developer & Open-Source Author',
    company: 'Zynex Studio / Independent Systems Research',
    location: 'Remote',
    period: '2024 – Present',
    status: 'CONTINUOUS (2+ YEARS TOTAL)',
    highlights: [
      'Authored T2NAS, a CPU-aware resumable parallel transfer engine for 10Gbps NAS network environments.',
      'Developed Audio Internal & External Duplicacy Checker combining acoustic fingerprinting with atomic checkpointing.',
      'Constructed Enterprise Rsync Transfer Platform with embedded runtimes and subprocess telemetry extraction.',
      'Engineered production web apps, automation pipelines, and custom API integrations across client and open-source ecosystems.',
    ],
    tech: ['Python', 'Multiprocessing', 'Acoustic Fingerprinting', 'Rsync', 'OpenSSH', 'React', 'TypeScript'],
  },
];

const Experience = () => {
  const [activeCategory, setActiveCategory] = useState<string>(SKILL_CATEGORIES[0].id);
  const selectedCategory =
    SKILL_CATEGORIES.find((c) => c.id === activeCategory) || SKILL_CATEGORIES[0];

  const experienceMonths = useMemo(() => {
    const start = new Date(2025, 5); // Jun 2025
    const now = new Date();
    return Math.max(1, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()));
  }, []);

  return (
    <Layout>
      {/* ==================== HERO SECTION ==================== */}
      <section className="mb-16">
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-[10px] tracking-[0.3em] uppercase mb-3">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
          <span>PORTAL // 02 // TECHNICAL MASTERY & CAREER PROVENANCE</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-display font-black uppercase tracking-tight text-white mb-6">
          <ScrambleText text="SKILLS & EXPERIENCE" />
        </h1>

        <p className="text-sm sm:text-base font-mono text-white/70 max-w-3xl leading-relaxed mb-8">
          2+ years of professional engineering experience with considerable advances—advancing rapidly from systems programming to Associate AI Engineer at InfoBay AI Limited. Specialising in high-concurrency Python architectures, autonomous multi-agent evaluation suites, and fault-tolerant data infrastructure.
        </p>

        {/* Dynamic Telemetry Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
            <div className="text-[10px] font-mono text-white/40 tracking-[0.2em] mb-1">TOTAL EXPERIENCE</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-cyan-300">
              2+ YEARS
            </div>
          </div>
          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
            <div className="text-[10px] font-mono text-white/40 tracking-[0.2em] mb-1">CURRENT RANK</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-400">
              AI ENGINEER
            </div>
          </div>
          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
            <div className="text-[10px] font-mono text-white/40 tracking-[0.2em] mb-1">CAREER VELOCITY</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-fuchsia-300">
              PROMOTED
            </div>
          </div>
          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
            <div className="text-[10px] font-mono text-white/40 tracking-[0.2em] mb-1">SYSTEMS VERIFIED</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-cyan-300">
              ZERO FAILURE
            </div>
          </div>
        </div>
      </section>

      {/* ==================== COMPREHENSIVE SKILLS MATRIX ==================== */}
      <section className="mb-20">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="text-[10px] font-mono tracking-[0.25em] text-cyan-400 uppercase">
              CAPABILITY MATRIX // 4 TECHNICAL DOMAINS
            </div>
            <h2 className="text-2xl sm:text-4xl font-display font-black uppercase text-white">
              DEEP TECHNICAL SKILLS
            </h2>
          </div>
          <div className="text-xs font-mono text-white/40">
            CLICK DOMAIN TO INSPECT IMPLEMENTATION
          </div>
        </div>

        {/* Domain Navigation Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {SKILL_CATEGORIES.map((cat) => {
            const isSelected = cat.id === activeCategory;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  soundEngine.playClick(750);
                  setActiveCategory(cat.id);
                }}
                onMouseEnter={() => soundEngine.playHover()}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-cyan-400/60 bg-cyan-400/10 text-white shadow-[0_0_25px_rgba(0,240,255,0.2)]'
                    : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/25'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={16} className={isSelected ? 'text-cyan-400' : 'text-white/40'} />
                  <span className="text-[10px] font-mono tracking-widest font-bold">
                    {isSelected ? 'ACTIVE' : 'INSPECT'}
                  </span>
                </div>
                <div className="font-mono text-xs sm:text-sm font-bold text-white mb-1">
                  {cat.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Domain Skills Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="p-6 sm:p-8 rounded-3xl border border-white/15 bg-[#05060d]/85 backdrop-blur-xl space-y-6"
          >
            <div className="border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase mb-1">
                <span>{selectedCategory.name}</span>
              </div>
              <p className="text-xs sm:text-sm font-mono text-white/70">
                {selectedCategory.tagline}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {selectedCategory.skills.map((skill) => (
                <div
                  key={skill.name}
                  className="p-5 rounded-2xl border border-white/10 bg-black/40 hover:border-cyan-400/30 transition-colors space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-mono text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      {skill.name}
                    </h4>
                    <span className="px-2 py-0.5 rounded-md border border-cyan-400/30 bg-cyan-400/10 text-[9px] font-mono text-cyan-300 uppercase">
                      {skill.level}
                    </span>
                  </div>

                  <p className="text-xs font-mono text-white/70 leading-relaxed">
                    {skill.desc}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {skill.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[9px] font-mono text-white/60"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* ==================== CAREER PROVENANCE & TIMELINE ==================== */}
      <section className="mb-20 pt-8 border-t border-white/10">
        <div className="text-[10px] font-mono tracking-[0.25em] text-fuchsia-400 uppercase mb-2">
          CHRONOLOGY // PROFESSIONAL ROLES
        </div>
        <h2 className="text-3xl sm:text-5xl font-display font-black uppercase text-white mb-6">
          <ScrambleText text="CAREER PROVENANCE" />
        </h2>
        <p className="text-xs sm:text-sm font-mono text-white/60 max-w-2xl leading-relaxed mb-10">
          Professional trajectory from systems experimentation to Associate AI Engineer leading model evaluation and high-concurrency infrastructure.
        </p>

        <div className="space-y-6">
          {CAREER_TIMELINE.map((item, idx) => (
            <div
              key={idx}
              className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-xl relative transition-all ${
                item.status === 'ACTIVE ROLE'
                  ? 'border-cyan-400/40 bg-[#05060e]/90 shadow-[0_0_30px_rgba(0,240,255,0.1)]'
                  : 'border-white/10 bg-[#030409]/70'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      item.status === 'ACTIVE ROLE' ? 'bg-emerald-400 animate-pulse' : 'bg-white/40'
                    }`}
                  />
                  <h3 className="text-xl sm:text-2xl font-display font-black uppercase text-white">
                    {item.role}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-[10px] font-mono text-white/70">
                    <Calendar size={11} className="inline mr-1" />
                    {item.period}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider ${
                      item.status === 'ACTIVE ROLE'
                        ? 'bg-emerald-400/10 border border-emerald-400/30 text-emerald-300'
                        : 'bg-white/5 border border-white/10 text-white/50'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-cyan-400 mb-6">
                <span className="flex items-center gap-1.5">
                  <Building2 size={13} />
                  {item.company}
                </span>
                <span>&middot;</span>
                <span className="flex items-center gap-1.5 text-white/50">
                  <MapPin size={13} />
                  {item.location}
                </span>
              </div>

              <ul className="space-y-2.5 mb-6">
                {item.highlights.map((h, hIdx) => (
                  <li key={hIdx} className="flex items-start gap-2.5 text-xs font-mono text-white/80 leading-relaxed">
                    <CheckCircle2 size={13} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-2 pt-4 border-t border-white/[0.08]">
                {item.tech.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 rounded-full border border-white/10 bg-black/40 text-[10px] font-mono text-white/70"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default Experience;
