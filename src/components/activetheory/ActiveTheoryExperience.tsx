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

interface FlagshipSystem {
  index: string;
  zoneIndex: number;
  id: string;
  title: string;
  shortTitle: string;
  category: string;
  accent: string;
  tagline: string;
  description: string;
  pipeline: { step: string; name: string; spec: string }[];
  telemetry: { label: string; value: string; sub: string }[];
  code: string;
  stack: string[];
  github: string;
}

const FLAGSHIP_SYSTEMS: FlagshipSystem[] = [
  {
    index: '01',
    zoneIndex: 1,
    id: 'audio-duplicacy',
    title: 'AUDIO DUPLICACY CHECKER',
    shortTitle: 'HASH.DEDUP.ENGINE',
    category: 'MULTIPROCESSING // CRYPTOGRAPHIC FINGERPRINTING',
    accent: '#a855f7',
    tagline: 'Deterministic audio fingerprint deduplication across massive batch corpora.',
    description:
      'High-speed audio deduplication engine generating deterministic cryptographic hash fingerprints across large internal and external audio datasets. Eliminates redundant database ingestion using multi-core worker pools while maintaining a strictly bounded O(1) per-worker memory ceiling.',
    pipeline: [
      { step: '01', name: 'STREAM INGEST', spec: '1MB bounded binary chunks' },
      { step: '02', name: 'WORKER POOL', spec: 'Multiprocessing core dispatch' },
      { step: '03', name: 'SHA-256 HASH', spec: 'Deterministic digest compute' },
      { step: '04', name: 'COLLISION MATRIX', spec: 'Internal & external set diff' },
      { step: '05', name: 'AUDIT LEDGER', spec: 'Normalized CSV report export' },
    ],
    telemetry: [
      { label: 'HASH PRECISION', value: '100%', sub: 'Zero false positives' },
      { label: 'EXECUTION', value: 'MULTI-CORE', sub: 'Parallel process pool' },
      { label: 'MEMORY CEILING', value: 'O(1)', sub: 'Chunk-stream bounded' },
      { label: 'COLLISION DRIFT', value: '0.00%', sub: 'Deterministic audit' },
    ],
    code: `def compute_audio_fingerprint(path: Path, chunk_size: int = 1048576) -> str:
    """Streams binary audio chunks into SHA-256 digest with O(1) memory."""
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        while frame := stream.read(chunk_size):
            digest.update(frame)
    return digest.hexdigest()`,
    stack: ['Python 3.12', 'Multiprocessing', 'SHA-256 Fingerprinting', 'Batch CSV Ledger'],
    github: 'https://github.com/shiv677/Audio-Internal-External-Duplicacy-Checker',
  },
  {
    index: '02',
    zoneIndex: 2,
    id: 't2nas',
    title: 'T2NAS PARALLEL TRANSFER',
    shortTitle: 'NAS.VORTEX.ENGINE',
    category: 'DISTRIBUTED STORAGE // CPU-AWARE CONCURRENCY',
    accent: '#00f0ff',
    tagline: 'CPU-aware parallel migration engine with atomic checkpoint recovery.',
    description:
      'High-throughput network storage transfer engine built for saturating NAS I/O bandwidth. Dynamically allocates worker processes to (CPU_COUNT - 1) to prevent host starvation, validates every chunk via SHA-256 checksums, and persists atomic state checkpoints for instant resume on network drop.',
    pipeline: [
      { step: '01', name: 'NAS MOUNT SCAN', spec: 'Recursive manifest indexing' },
      { step: '02', name: 'CORE ALLOCATION', spec: 'Dynamic (CPU - 1) workers' },
      { step: '03', name: 'CHUNK STREAM', spec: 'Parallel socket throughput' },
      { step: '04', name: 'SHA-256 VERIFY', spec: 'End-to-end byte parity check' },
      { step: '05', name: 'STATE LEDGER', spec: 'Atomic crash-resume journal' },
    ],
    telemetry: [
      { label: 'WORKER SCALING', value: 'CPU - 1', sub: 'Hardware-aware pool' },
      { label: 'FAULT RECOVERY', value: 'ATOMIC', sub: 'Zero-loss checkpoint resume' },
      { label: 'VERIFICATION', value: 'SHA-256', sub: 'Bit-level parity lock' },
      { label: 'THROUGHPUT', value: 'LINEAR', sub: 'Saturated NAS IOPS' },
    ],
    code: `async def execute_t2nas_migration(manifest: list[TransferItem]):
    """Scales worker pool to CPU_COUNT - 1 with atomic checkpoint journal."""
    workers = max(1, (os.cpu_count() or 2) - 1)
    sem = asyncio.Semaphore(workers)
    return await asyncio.gather(*(transfer_with_checkpoint(item, sem) for item in manifest))`,
    stack: ['Python 3.12', 'CPU-1 Scaling', 'SHA-256 Parity', 'Checkpoint Recovery'],
    github: 'https://github.com/shiv677/T2NAS',
  },
  {
    index: '03',
    zoneIndex: 3,
    id: 'enterprise-rsync',
    title: 'ENTERPRISE RSYNC PLATFORM',
    shortTitle: 'RSYNC.RBAC.RUNTIME',
    category: 'EMBEDDED RUNTIMES // HARDENED ORCHESTRATION',
    accent: '#ff006a',
    tagline: 'Zero-dependency Windows executable bundling embedded rsync & OpenSSH.',
    description:
      'Self-contained enterprise synchronization platform packaged as a standalone Windows executable. Bundles embedded rsync and OpenSSH binaries directly inside the runtime, featuring real-time subprocess telemetry parsing, job queue orchestration, cryptographic RBAC authentication, and SSH keep-alive failsafes.',
    pipeline: [
      { step: '01', name: 'PORTABLE BINARY', spec: 'Zero host dependencies' },
      { step: '02', name: 'CRYPTO RBAC', spec: 'Role-gated session auth' },
      { step: '03', name: 'EMBEDDED SSH', spec: 'Hardened tunnel & keep-alive' },
      { step: '04', name: 'PIPE TELEMETRY', spec: 'Real-time stdout parser' },
      { step: '05', name: 'REMOTE REPLICA', spec: 'Delta-compressed sync lock' },
    ],
    telemetry: [
      { label: 'DISTRIBUTION', value: 'STANDALONE', sub: 'Embedded OpenSSH + Rsync' },
      { label: 'ACCESS CONTROL', value: 'RBAC', sub: 'Cryptographic role guard' },
      { label: 'STREAM PARSER', value: '< 5ms', sub: 'Real-time subprocess pipe' },
      { label: 'FAULT TOLERANCE', value: 'AUTO-RETRY', sub: 'SSH keep-alive heartbeat' },
    ],
    code: `def stream_embedded_rsync(job: SyncPayload) -> Iterator[TelemetryFrame]:
    """Spawns isolated embedded OpenSSH + rsync runtime and parses live stdout."""
    proc = subprocess.Popen(
        [RSYNC_BIN, "-avzP", "--stats", "-e", f'"{SSH_BIN}" -o ServerAliveInterval=15', job.src, job.dst],
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
    )
    yield from parse_realtime_progress(proc.stdout)`,
    stack: ['Python', 'Embedded OpenSSH', 'Subprocess Telemetry', 'RBAC Security'],
    github: 'https://github.com/shiv677/sync_tool',
  },
  {
    index: '04',
    zoneIndex: 4,
    id: 'ai-eval-harness',
    title: 'AUTONOMOUS AI & VLM EVALUATION HARNESS',
    shortTitle: 'AI.HARNESS',
    category: 'DISTRIBUTED AI BENCHMARKING & MULTI-AGENT SWARMS',
    accent: '#00f0ff',
    tagline: 'High-throughput VLM & multi-agent evaluation framework with Pydantic v2 schema enforcement.',
    description:
      'High-throughput evaluation framework distributing Vision-Language Model and multi-turn agent benchmarks across concurrent worker pools with Pydantic v2 schema validation, token-bucket rate limiting, and continuous regression drift detection.',
    pipeline: [
      { step: '01', name: 'TASK DISPATCH', spec: 'Token-bucket async semaphore' },
      { step: '02', name: 'AGENT DEBATE', spec: 'Multi-perspective consensus scoring' },
      { step: '03', name: 'VLM GROUNDING', spec: 'OCR & bounding-box verification' },
      { step: '04', name: 'SCHEMA GUARD', spec: 'Pydantic v2 grammar enforcement' },
      { step: '05', name: 'REGRESSION DB', spec: 'Continuous drift telemetry store' },
    ],
    telemetry: [
      { label: 'EVAL SCALE', value: '50K+ / DAY', sub: 'AsyncIO concurrency pool' },
      { label: 'SCHEMA LOCK', value: '100%', sub: 'Zero non-compliant outputs' },
      { label: 'RATE THROTTLE', value: 'DYNAMIC', sub: 'Token-bucket quota shield' },
      { label: 'FAULT TOLERANCE', value: 'RESUMABLE', sub: 'Per-sample state checkpoint' },
    ],
    code: `async def evaluate_sample_with_consensus(sample: dict, client, semaphore) -> EvaluationRubric:
    """Asynchronous model evaluation with rate-limit semaphores and structured schema."""
    async with semaphore:
        prompt = f"Evaluate model response against reference ground truth:\\n{sample}"
        response = await client.models.generate_content(
            model="gemini-2.5-pro",
            contents=prompt,
            config={"response_mime_type": "application/json", "response_schema": EvaluationRubric}
        )
        return EvaluationRubric.model_validate_json(response.text)`,
    stack: ['Python 3.12', 'LangGraph', 'Vision-Language Models', 'Pydantic v2', 'AsyncIO'],
    github: 'https://github.com/shiv677/multi-agent-consensus-engine',
  },
  {
    index: '05',
    zoneIndex: 4,
    id: 'dataset-quality-engineering',
    title: 'DATASET QUALITY & INTEGRITY PIPELINE',
    shortTitle: 'DATA.SENTINEL',
    category: 'DATA INTEGRITY // DEDUPLICATION // CORRUPTION AUDIT',
    accent: '#10b981',
    tagline: 'Multi-pass normalization, semantic deduplication, and corruption quarantine.',
    description:
      'High-reliability dataset quality-control pipeline with Unicode NFKC normalization, SimHash 64-bit near-duplicate detection, and atomic SQLite WAL checkpoints for zero-loss batch processing.',
    pipeline: [
      { step: '01', name: 'CANONICAL NORM', spec: 'Unicode NFKC normalization' },
      { step: '02', name: 'EXACT HASH', spec: 'SHA-256 collision index' },
      { step: '03', name: 'SIMHASH DEDUP', spec: 'Hamming distance near-dedup' },
      { step: '04', name: 'CORRUPTION GUARD', spec: 'Null-byte & schema validation' },
      { step: '05', name: 'AUDIT LEDGER', spec: 'Quarantine & clean CSV ledger' },
    ],
    telemetry: [
      { label: 'SCHEMA LOCK', value: 'STRICT', sub: 'Pydantic v2 validation' },
      { label: 'DEDUP PASS', value: 'DUAL', sub: 'Exact hash + SimHash' },
      { label: 'CORRUPTION', value: 'QUARANTINE', sub: 'Null-byte & encoding catch' },
      { label: 'FAULT RECOVERY', value: 'ATOMIC', sub: 'WAL checkpoint resume' },
    ],
    code: `def normalize_and_audit_record(row: dict) -> RecordAudit:
    """Normalizes Unicode NFKC text and computes 64-bit SimHash for near-duplicate quarantine."""
    text = unicodedata.normalize("NFKC", row.get("text", "").strip())
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
    sim = compute_simhash64(text)
    return RecordAudit(raw_id=row["id"], clean_text=text, sha256=digest, simhash=sim)`,
    stack: ['Python 3.12', 'Pydantic v2', 'Unicode NFKC', 'SimHash', 'SQLite WAL'],
    github: 'https://github.com/shiv677/dataset-quality-sentinel',
  },
  {
    index: '06',
    zoneIndex: 4,
    id: 'research-discovery-pipeline',
    title: 'RESEARCH & WEBSITE DISCOVERY ENGINE',
    shortTitle: 'DISCOVERY.STREAM',
    category: 'ASYNC WEB SCRAPING // RESEARCH AUTOMATION',
    accent: '#f59e0b',
    tagline: 'Asynchronous target discovery and structured QA harvesting pipeline.',
    description:
      'Automated source discovery and web harvesting pipeline targeting domain-specialized question datasets with rate-limiting queues, headless browser automation, and structured extraction.',
    pipeline: [
      { step: '01', name: 'DOMAIN SHORTLIST', spec: 'Relevance & question density' },
      { step: '02', name: 'RATE SHIELD', spec: 'Async token-bucket queues' },
      { step: '03', name: 'HEADLESS BROWSER', spec: 'Dynamic DOM rendering' },
      { step: '04', name: 'QA EXTRACTION', spec: 'Structured container harvest' },
      { step: '05', name: 'PROVENANCE LOG', spec: 'Transactional SQLite store' },
    ],
    telemetry: [
      { label: 'DISCOVERY', value: 'TARGETED', sub: 'Domain relevance heuristic' },
      { label: 'THROTTLING', value: 'ADAPTIVE', sub: 'Token-bucket rate limit' },
      { label: 'RECOVERY', value: 'EXPONENTIAL', sub: 'Backoff & auto-retry' },
      { label: 'STORAGE', value: 'RESUMABLE', sub: 'SQLite WAL checkpoint' },
    ],
    code: `async def harvest_qa_stream(session: aiohttp.ClientSession, url: str) -> list[dict]:
    """Asynchronous question harvesting with token-bucket rate limiter and resilient DOM parsing."""
    async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as response:
        if response.status != 200:
            return []
        soup = BeautifulSoup(await response.text(), "html.parser")
        return [
            {"url": url, "qa": item.get_text(strip=True)}
            for item in soup.select(".question-block, .qa-item")
        ]`,
    stack: ['Python 3.12', 'AsyncIO', 'Playwright', 'BeautifulSoup4', 'SQLite WAL'],
    github: 'https://github.com/shiv677',
  },
  {
    index: '07',
    zoneIndex: 4,
    id: 'vlm-grounding-evaluator',
    title: 'VLM SPATIAL GROUNDING & IOU EVALUATOR',
    shortTitle: 'VLM.GROUNDING',
    category: 'MULTIMODAL AI EVALUATION & SPATIAL LOCALIZATION',
    accent: '#00f0ff',
    tagline: 'High-precision Vision-Language Model spatial grounding and IoU benchmarking.',
    description:
      'High-precision evaluation framework benchmarking Vision-Language Model spatial grounding predictions against ground-truth bounding box coordinates with Pydantic v2 schema constraints and normalized IoU matrices.',
    pipeline: [
      { step: '01', name: 'COORDINATE INGEST', spec: 'Normalized [ymin, xmin, ymax, xmax] parser' },
      { step: '02', name: 'PYDANTIC V2 GUARD', spec: 'Strict boundary invariant verification' },
      { step: '03', name: 'SPATIAL IOU', spec: 'Exact 2D intersection-over-union matrix' },
      { step: '04', name: 'LABEL PARITY', spec: 'Categorical confidence alignment score' },
      { step: '05', name: 'RUBRIC EXPORT', spec: 'Normalized evaluation rubric JSON' },
    ],
    telemetry: [
      { label: 'COORDINATE LOCK', value: 'STRICT', sub: 'Pydantic v2 invariants' },
      { label: 'IOU PRECISION', value: 'EXACT 2D', sub: 'Zero-division protection' },
      { label: 'EVALUATION', value: 'MULTIMODAL', sub: 'Spatial + label alignment' },
      { label: 'FAULT RECOVERY', value: 'ISOLATED', sub: 'Per-sample exception catch' },
    ],
    code: `def calculate_iou(b1: BoundingBox2D, b2: BoundingBox2D) -> float:
    """Exact 2D intersection-over-union with zero-area division guards."""
    inter_y1 = max(b1.ymin, b2.ymin)
    inter_x1 = max(b1.xmin, b2.xmin)
    inter_y2 = min(b1.ymax, b2.ymax)
    inter_x2 = min(b1.xmax, b2.xmax)
    inter_area = max(0.0, inter_y2 - inter_y1) * max(0.0, inter_x2 - inter_x1)
    union_area = (b1.ymax - b1.ymin) * (b1.xmax - b1.xmin) + (b2.ymax - b2.ymin) * (b2.xmax - b2.xmin) - inter_area
    return inter_area / union_area if union_area > 0 else 0.0`,
    stack: ['Python 3.12', 'Pydantic v2', 'VLM Spatial Grounding', 'IoU Metrics'],
    github: 'https://github.com/shiv677/vlm-grounding-evaluator',
  },
  {
    index: '08',
    zoneIndex: 2,
    id: 'wal-checkpoint-streamer',
    title: 'HIGH-THROUGHPUT SQLITE WAL CHECKPOINT STREAMER',
    shortTitle: 'WAL.STREAMER',
    category: 'DISTRIBUTED DATA ENGINEERING // CRASH RESILIENCE',
    accent: '#00ffaa',
    tagline: 'Hardware-aware concurrency pool with SQLite WAL crash-recovery journaling.',
    description:
      'High-concurrency data streaming worker pool built for crash resilience. Implements SQLite Write-Ahead Logging (WAL) for atomic transaction commits, dynamic CPU-1 worker scaling, and bounded 4MB chunk streaming with an O(1) resident memory ceiling.',
    pipeline: [
      { step: '01', name: 'MANIFEST INGEST', spec: 'Batch file partition indexing' },
      { step: '02', name: 'WAL DB INIT', spec: 'PRAGMA journal_mode=WAL' },
      { step: '03', name: 'CORE SCALING', spec: 'max(1, cpu_count() - 1) process pool' },
      { step: '04', name: 'BOUNDED STREAM', spec: '4MB chunk streaming with O(1) RAM' },
      { step: '05', name: 'ATOMIC CHECKPOINT', spec: 'Zero-loss state journal commit' },
    ],
    telemetry: [
      { label: 'JOURNAL MODE', value: 'SQLITE WAL', sub: 'Non-blocking concurrent writes' },
      { label: 'WORKER POOL', value: 'CPU - 1', sub: 'Hardware-aware scaling' },
      { label: 'MEMORY FOOTPRINT', value: 'O(1)', sub: 'Bounded 4MB chunk buffers' },
      { label: 'FAULT RECOVERY', value: 'ATOMIC', sub: 'Zero duplicate processing' },
    ],
    code: `def init_wal_checkpoint_db(db_path: str) -> sqlite3.Connection:
    """Enables Write-Ahead Logging for high-throughput crash resilience."""
    conn = sqlite3.connect(db_path, timeout=30.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("""
        CREATE TABLE IF NOT EXISTS checkpoints (
            item_id TEXT PRIMARY KEY,
            status TEXT NOT NULL,
            checksum TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    return conn`,
    stack: ['Python 3.12', 'SQLite WAL', 'Multiprocessing', 'Streaming I/O'],
    github: 'https://github.com/shiv677/wal-checkpoint-streamer',
  },
];

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
      'Crash-Proof Checkpointing (SQLite WAL)',
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

  const [modalSystem, setModalSystem] = useState<FlagshipSystem | null>(null);
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
        'NAVIGATED TO PORTAL 04 [Z = -88m] // Autonomous AI & VLM Evaluation Harness distributes multi-agent benchmarking prompts with 100% Pydantic v2 schema conformance.'
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
    activeZone >= 1 && activeZone <= 4 ? FLAGSHIP_SYSTEMS[activeZone - 1] : null;

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
          setModalSystem(FLAGSHIP_SYSTEMS[sysIdx]);
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
                  { val: '8 CORE', label: 'FLAGSHIP ARCHITECTURES' },
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
                  <span>[Z = {ZONE_Z_POSITIONS[currentSystem.zoneIndex]}m]</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-display font-black uppercase tracking-tight text-white">
                  <ScrambleText text={currentSystem.title} />
                </h2>

                <p className="text-xs font-mono text-white/70 leading-relaxed">
                  {currentSystem.description}
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {(currentSystem.telemetry || []).map((t) => (
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
                    <code>{currentSystem.code}</code>
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
                  01 // FLAGSHIP PYTHON &amp; CONCURRENCY SYSTEMS
                </div>
                <div className="grid md:grid-cols-3 gap-5">
                  {FLAGSHIP_SYSTEMS.map((sys) => (
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
                            setShowIndexDrawer(false);
                            flyToZone(sys.zoneIndex);
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

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {modalSystem.telemetry.map((t) => (
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
                  <code>{modalSystem.code}</code>
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
