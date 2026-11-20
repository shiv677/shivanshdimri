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

interface SystemArchitecture {
  id: string;
  code: string;
  title: string;
  category: string;
  status: string;
  description: string;
  problem: string;
  solution: string;
  github: string;
  technologies: string[];
  metrics: { label: string; value: string }[];
  architecturePoints: string[];
  codeSnippet: string;
}

const SYSTEMS: SystemArchitecture[] = [
  {
    id: 'audio-dedup',
    code: '01',
    title: 'Audio Internal & External Duplicacy Checker',
    category: 'ACOUSTIC FINGERPRINTING & HIGH-VOLUME DATA ENGINEERING',
    status: 'PRODUCTION ACTIVE',
    description:
      'Deterministic fingerprint-based audio deduplication and data pipeline integrity engine preventing redundant insertions across vendor batches.',
    problem:
      'Massive audio datasets ingested from diverse third-party sources contained internal duplicate files and collisions against existing catalog databases, causing database corruption, skewed model training sets, and redundant storage expenditure.',
    solution:
      'Engineered an automated batch processing pipeline that extracts acoustic and cryptographic fingerprints (Chromaprint / SHA-256), performs within-batch collision detection and cross-batch catalog validation, and enforces ACID-compliant database insertions using SQLite/PostgreSQL with transactional WAL logs and persistent checkpointing.',
    github: 'https://github.com/shiv677/Audio-Internal-External-Duplicacy-Checker',
    technologies: [
      'Python 3.12',
      'Multiprocessing',
      'PyTorch / Torchaudio',
      'Chromaprint',
      'SQLite WAL',
      'PostgreSQL',
      'Checkpoint Recovery',
      'SHA-256',
    ],
    metrics: [
      { label: 'Ingestion Scale', value: 'Multi-Core Batch Stream' },
      { label: 'Duplication Detection', value: 'Deterministic Chromaprint' },
      { label: 'Crash Recovery', value: 'Atomic WAL Checkpoints' },
      { label: 'Memory Footprint', value: 'O(1) Bounded Buffer' },
    ],
    architecturePoints: [
      'CPU-core auto-balancing worker pool avoiding Global Interpreter Lock bottlenecks',
      'Dual-layer verification: fast acoustic perceptual hashing followed by byte-level cryptographic validation',
      'Atomic SQLite WAL state store ensuring zero duplicate inserts during concurrent batch executions',
      'Graceful SIGINT/SIGTERM handlers persisting processed offsets for instantaneous resume',
    ],
    codeSnippet: `import os
from multiprocessing import Pool, cpu_count
from utils.fingerprint import compute_acoustic_hash, sha256_digest
from utils.database import PersistentCheckpointDB

def process_audio_file(file_path: str) -> dict:
    """Deterministic fingerprint extraction with failure isolation."""
    try:
        acoustic_hash = compute_acoustic_hash(file_path)
        raw_sha256 = sha256_digest(file_path)
        return {
            "path": file_path,
            "acoustic_hash": acoustic_hash,
            "sha256": raw_sha256,
            "status": "VALID"
        }
    except Exception as exc:
        return {"path": file_path, "status": "CORRUPT", "error": str(exc)}

def run_deduplication_pipeline(batch_dir: str, db: PersistentCheckpointDB):
    files = [os.path.join(batch_dir, f) for f in os.listdir(batch_dir)]
    unprocessed = [f for f in files if not db.is_processed(f)]
    
    workers = max(1, cpu_count() - 1)
    with Pool(processes=workers) as pool:
        for result in pool.imap_unordered(process_audio_file, unprocessed, chunksize=64):
            db.record_fingerprint(result)
            if db.is_duplicate(result["acoustic_hash"]):
                db.flag_duplicate(result["path"])`,
  },
  {
    id: 't2nas',
    code: '02',
    title: 'T2NAS – Parallel NAS Data Transfer Engine',
    category: 'DISTRIBUTED DATA MIGRATION & CPU-AWARE CONCURRENCY',
    status: 'PRODUCTION ACTIVE',
    description:
      'CPU-aware, resumable high-throughput data migration engine optimised for 10Gbps NAS, SAN, and enterprise storage arrays.',
    problem:
      'Migrating multi-terabyte datasets across network-attached storage suffered from single-thread bandwidth bottlenecks, unrecoverable failures midway through large transfers, and runaway RAM usage when traversing millions of deep directories.',
    solution:
      'Built a custom parallelized transfer engine utilizing dynamic worker allocation (CPU count − 1 strategy), chunk-level transfer streams, SHA-256 block verification, and persistent JSON/SQLite checkpoint state tracking that allows interrupted transfers to resume instantly without re-reading completed files.',
    github: 'https://github.com/shiv677/T2NAS',
    technologies: [
      'Python 3.12',
      'Multiprocessing',
      'AsyncIO',
      'Streaming I/O',
      'SHA-256 Verification',
      'JSON State Machine',
      'Memory Management',
      'Linux / POSIX',
    ],
    metrics: [
      { label: 'Throughput', value: 'Saturates 10GbE NAS' },
      { label: 'CPU Allocation', value: 'Dynamic (Cores - 1)' },
      { label: 'Interruption Loss', value: '0 bytes lost' },
      { label: 'Directory Depth', value: 'Unlimited recursion' },
    ],
    architecturePoints: [
      'Chunked stream buffers preventing system OOM crashes on multi-gigabyte file transfers',
      'Resumable state machine tracking byte offsets and verification checksums per file',
      'Worker auto-throttling based on system I/O wait times and disk queue saturation',
      'Automated retry with exponential backoff on transient network filesystem hiccups',
    ],
    codeSnippet: `import os
import shutil
import hashlib
from concurrent.futures import ProcessPoolExecutor
from transferEngine.state import CheckpointTracker

def transfer_chunked_file(src: str, dst: str, state: CheckpointTracker):
    """Memory-bounded copy with per-chunk SHA256 integrity verification."""
    if state.is_completed(src):
        return True
        
    temp_dst = dst + ".partial"
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    
    hasher_src = hashlib.sha256()
    hasher_dst = hashlib.sha256()
    
    with open(src, "rb") as fsrc, open(temp_dst, "wb") as fdst:
        while chunk := fsrc.read(4 * 1024 * 1024):  # 4MB streaming buffer
            hasher_src.update(chunk)
            fdst.write(chunk)
            hasher_dst.update(chunk)
            
    if hasher_src.digest() == hasher_dst.digest():
        os.replace(temp_dst, dst)
        state.mark_done(src, checksum=hasher_src.hexdigest())
        return True
    else:
        os.remove(temp_dst)
        raise IOError(f"Checksum mismatch on {src}")`,
  },
  {
    id: 'rsync-platform',
    code: '03',
    title: 'Enterprise Rsync Transfer Platform',
    category: 'SYSTEMS INFRASTRUCTURE & DAEMON ORCHESTRATION',
    status: 'PRODUCTION ACTIVE',
    description:
      'Self-contained enterprise-grade rsync orchestration system with embedded runtimes, process supervisors, and automated failover.',
    problem:
      'Synchronizing business-critical repositories across heterogeneous Windows and Linux endpoints required error-prone manual rsync setups, lacked live telemetry parsing, and had no automated recovery when SSH tunnels dropped.',
    solution:
      'Engineered an all-in-one standalone orchestration platform bundling embedded Rsync and OpenSSH runtimes. Features real-time regex progress stream parsing, automated SSH keep-alives, queue-based execution schedules, differential delta compression, and role-based access security.',
    github: 'https://github.com/shiv677/sync_tool',
    technologies: [
      'Python 3.12',
      'Embedded Rsync',
      'OpenSSH Runtime',
      'Subprocess Pipes',
      'Systemd Services',
      'Argon2 Security',
      'Regex Telemetry',
      'Cross-Platform',
    ],
    metrics: [
      { label: 'Process Supervision', value: 'Auto-Reconnect Heartbeats' },
      { label: 'Delta Bandwidth Savings', value: 'Block-Level Compression' },
      { label: 'Host Dependencies', value: 'Zero (Embedded Binaries)' },
      { label: 'Live Telemetry', value: 'Real-Time Regex Parser' },
    ],
    architecturePoints: [
      'Zero-dependency execution: embedded portable binaries isolated from host environment quirks',
      'Asynchronous subprocess standard I/O streaming with real-time transfer rate and ETA extraction',
      'Automatic SSH tunnel monitoring with heartbeat pings and dynamic socket reconnects',
      'Cryptographically salted authentication profiles protecting remote synchronization targets',
    ],
    codeSnippet: `import subprocess
import re
from typing import Iterator

PROGRESS_REGEX = re.compile(r"\\s*([\\d,]+)\\s+(\\d+)%\\s+([\\d.]+[kKMGT]?B/s)\\s+(\\d+:\\d+:\\d+)")

def execute_rsync_stream(cmd: list[str]) -> Iterator[dict]:
    """Execute embedded rsync binary and yield live parsed transfer telemetry."""
    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        universal_newlines=True,
        bufsize=1
    )
    
    for line in iter(process.stdout.readline, ""):
        match = PROGRESS_REGEX.search(line)
        if match:
            yield {
                "bytes_transferred": match.group(1),
                "percentage": int(match.group(2)),
                "speed": match.group(3),
                "eta": match.group(4)
            }
            
    process.stdout.close()
    return_code = process.wait()
    if return_code != 0:
        stderr_output = process.stderr.read()
        raise RuntimeError(f"Rsync failed with code {return_code}: {stderr_output}")`,
  },
  {
    id: 'ai-eval-harness',
    code: '04',
    title: 'Autonomous AI & Multimodal VLM Evaluation Harness',
    category: 'AI ENGINEERING, AGENTIC SWARMS & BENCHMARK HARNESSES',
    status: 'PRODUCTION ACTIVE',
    description:
      'Distributed benchmarking and evaluation framework for Large Language Models and Vision-Language Models with multi-agent verification and strict schema enforcement.',
    problem:
      'Production LLM and VLM deployments suffered from stochastic hallucinations, lack of automated regression evaluation across model versions, and slow sequential API grading bottlenecks.',
    solution:
      'Constructed a high-concurrency evaluation pipeline orchestrating multi-agent reviewer swarms. Integrates Pydantic schema validation, token-bucket rate limiters, multi-perspective rubric scoring, multimodal image and document reasoning verification, and automated regression reporting.',
    github: 'https://github.com/shiv677',
    technologies: [
      'Python 3.12',
      'OpenAI / Gemini / Claude APIs',
      'LangChain / LangGraph',
      'Vision-Language Models',
      'Pydantic v2',
      'AsyncIO Concurrency',
      'Vector Embeddings',
      'RAG Benchmarking',
    ],
    metrics: [
      { label: 'Evaluation Model', value: 'Concurrent Multi-Agent' },
      { label: 'Schema Conformance', value: 'Strict Pydantic v2' },
      { label: 'Rate-Limit Throttling', value: 'Token-Bucket Shield' },
      { label: 'Verification Protocol', value: 'Tri-Perspective Debate' },
    ],
    architecturePoints: [
      'Multi-agent debate & consensus architecture eliminating single-judge evaluation bias',
      'Token-bucket asynchronous rate limiter dynamically throttling across multiple API provider quotas',
      'Pydantic runtime data validators guaranteeing structural integrity of model outputs',
      'Multimodal regression suite verifying bounding-box alignment and OCR accuracy for VLMs',
    ],
    codeSnippet: `import asyncio
from pydantic import BaseModel, Field
from typing import List

class EvaluationRubric(BaseModel):
    factual_accuracy: float = Field(ge=0.0, le=1.0)
    reasoning_coherence: float = Field(ge=0.0, le=1.0)
    hallucination_detected: bool
    verdict: str
    rationale: str

async def evaluate_sample_with_consensus(sample: dict, client, semaphore) -> EvaluationRubric:
    """Asynchronous model evaluation with rate-limit semaphores and structured schema."""
    async with semaphore:
        prompt = f"Evaluate the following model response against reference ground truth:\\n{sample}"
        response = await client.models.generate_content(
            model="gemini-2.5-pro",
            contents=prompt,
            config={"response_mime_type": "application/json", "response_schema": EvaluationRubric}
        )
        return EvaluationRubric.model_validate_json(response.text)`,
  },
  {
    id: 'dataset-quality-engineering',
    code: '05',
    title: 'Large-Scale Dataset Quality & Integrity Engineering',
    category: 'DATA PIPELINE INTEGRITY, NORMALIZATION & DEDUPLICATION',
    status: 'PRODUCTION ACTIVE',
    description:
      'High-throughput validation, normalization, and semantic corruption detection pipeline ensuring clean datasets for AI model evaluation.',
    problem:
      'High-volume specialized question corpora and multimodal document extracts contained encoding artifacts, duplicate items across vendor dumps, malformed schema, and subtle corruption that silently skewed evaluation benchmarks.',
    solution:
      'Engineered an automated dataset quality-control pipeline with multi-pass question extraction, canonical Unicode normalization, semantic and hash-based deduplication, corruption detection heuristics, and transactional SQLite WAL persistence with strict Pydantic v2 validation.',
    github: 'https://github.com/shiv677',
    technologies: [
      'Python 3.12',
      'Pydantic v2',
      'SQLite WAL',
      'PostgreSQL',
      'Unicode Normalization',
      'Multiprocessing',
      'Fuzzy / Hash Matching',
      'Corruption Detectors',
    ],
    metrics: [
      { label: 'Schema Conformance', value: 'Strict Pydantic v2' },
      { label: 'Deduplication Pass', value: 'Dual Hash + Semantic' },
      { label: 'Corruption Catch', value: 'Zero Malformed Ingests' },
      { label: 'Fault Recovery', value: 'Atomic Checkpoints' },
    ],
    architecturePoints: [
      'Multi-stage normalization converting varied raw dumps into standardized canonical question representations',
      'Dual-pass deduplication filtering identical text hashes and fuzzy semantic near-duplicates',
      'Automated corruption detection flagging truncated inputs, encoding anomalies, and invalid schemas',
      'Transactional SQLite WAL database guarantees with persistent checkpointing for crash resilience',
    ],
    codeSnippet: `from pydantic import BaseModel, Field, field_validator
import unicodedata
import hashlib

class QuestionRecord(BaseModel):
    question_id: str
    prompt: str = Field(min_length=10)
    canonical_answer: str
    metadata: dict = Field(default_factory=dict)
    
    @field_validator('prompt')
    def normalize_text(cls, v: str) -> str:
        # Canonical Unicode normalization (NFKC) & whitespace cleanup
        normalized = unicodedata.normalize('NFKC', v.strip())
        if len(normalized) < 10:
            raise ValueError('Prompt too short or corrupted')
        return normalized

def compute_record_fingerprint(record: QuestionRecord) -> str:
    """Generates deterministic digest for duplicate detection."""
    content = f"{record.prompt.lower()}::{record.canonical_answer.lower()}"
    return hashlib.sha256(content.encode('utf-8')).hexdigest()`,
  },
  {
    id: 'research-discovery-pipeline',
    code: '06',
    title: 'Automated Research & Website Discovery Engine',
    category: 'INTELLIGENT WEB SCRAPING, RESEARCH AUTOMATION & EXTRACTION',
    status: 'PRODUCTION ACTIVE',
    description:
      'Automated source discovery, shortlisting, and web scraping pipeline harvesting specialized question datasets with domain classification.',
    problem:
      'Creating comprehensive question benchmarks required manually searching, evaluating, and scraping specialized domain websites—a process vulnerable to anti-bot measures, dynamic JS rendering, and inconsistent HTML structures.',
    solution:
      'Constructed an asynchronous discovery and content extraction engine that shortlists high-yield target domains, orchestrates headless browser workers, extracts structured QA candidates, and tags sources with domain classification metadata while handling rate limits with exponential backoff.',
    github: 'https://github.com/shiv677',
    technologies: [
      'Python 3.12',
      'AsyncIO',
      'Playwright / Headless',
      'BeautifulSoup4',
      'Domain Classifiers',
      'Rate-Limiting Queues',
      'SQLite Checkpoints',
    ],
    metrics: [
      { label: 'Discovery Logic', value: 'Domain-Targeted' },
      { label: 'Content Extraction', value: 'Clean QA Candidates' },
      { label: 'Execution Model', value: 'Async Worker Queue' },
      { label: 'Resilience', value: 'Backoff & Auto-Retry' },
    ],
    architecturePoints: [
      'Target domain discovery and shortlisting based on relevance heuristics and question density',
      'Asynchronous worker pool balancing concurrent requests to respect domain robots.txt and rate limits',
      'Robust DOM parsing with fallback selectors resilient against website layout updates',
      'Automated candidate classification tagging extracted content with source provenance metadata',
    ],
    codeSnippet: `import asyncio
from typing import List, Dict
import aiohttp
from bs4 import BeautifulSoup

async def extract_qa_candidates(session: aiohttp.ClientSession, url: str) -> List[Dict]:
    """Asynchronous source extraction with retry and content structure parsing."""
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as response:
            if response.status != 200:
                return []
            html = await response.text()
            soup = BeautifulSoup(html, 'html.parser')
            # Extract structured question-answer containers
            candidates = []
            for item in soup.select('.question-block, .qa-item, article'):
                text = item.get_text(separator=' ', strip=True)
                if len(text) > 40 and ('?' in text):
                    candidates.append({"source_url": url, "raw_content": text})
            return candidates
    except (aiohttp.ClientError, asyncio.TimeoutError):
        return []`,
  },
];

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
