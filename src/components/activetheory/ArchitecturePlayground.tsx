import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu,
  Database,
  Brain,
  Sliders,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
  Activity,
  Terminal,
  Zap,
  ShieldAlert,
  ArrowRight,
  Code2,
  Crosshair,
  Scan,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { soundEngine } from './SoundEngine';

type SimulatorTab = 't2nas' | 'audio-dedup' | 'multi-agent' | 'vlm-grounding';

interface VlmDetection {
  id: string;
  label: string;
  category: 'MECHANICAL' | 'DIMENSION' | 'FASTENER' | 'SPECIFICATION';
  coords: { x: number; y: number; w: number; h: number };
  confidence: number;
  ocrText: string;
  notes: string;
}

const VLM_DETECTIONS: VlmDetection[] = [
  {
    id: 'bearing_b4',
    label: 'BALL_BEARING_6204',
    category: 'MECHANICAL',
    coords: { x: 34, y: 28, w: 28, h: 42 },
    confidence: 0.994,
    ocrText: 'SKF-6204-2RSH/C3 DEEP-GROOVE',
    notes: 'Radial clearance: 0.012mm within ISO 286 envelope. Zero runout deviation.',
  },
  {
    id: 'tolerance_callout',
    label: 'ISO_TOLERANCE_FIT',
    category: 'DIMENSION',
    coords: { x: 67, y: 16, w: 26, h: 22 },
    confidence: 0.982,
    ocrText: 'Ø 20 H7 / k6 [CYLINDRICAL]',
    notes: 'Transition fit. Shaft diameter 20mm (+0.009 / +0.002mm limits).',
  },
  {
    id: 'pressure_seal',
    label: 'VITON_O_RING_SEAL',
    category: 'FASTENER',
    coords: { x: 10, y: 38, w: 20, h: 28 },
    confidence: 0.976,
    ocrText: 'FKM-75 DUAL FLANGE SEAL',
    notes: 'Thermal operational limit: 200°C. Shore A Hardness rating 75.',
  },
  {
    id: 'impeller_shroud',
    label: 'IMPELLER_HOUSING',
    category: 'SPECIFICATION',
    coords: { x: 28, y: 72, w: 42, h: 22 },
    confidence: 0.965,
    ocrText: 'FLOW: 450 L/MIN @ 3600 RPM',
    notes: 'Fluid dynamic boundary checked against hydraulic engineering spec v4.2.',
  },
  {
    id: 'thermal_relief',
    label: 'SECONDARY_HEAT_FINS',
    category: 'SPECIFICATION',
    coords: { x: 74, y: 58, w: 22, h: 32 },
    confidence: 0.814,
    ocrText: '6061-T6 PITCH 3.2mm',
    notes: 'Lower contrast OCR region. Correctly identified above 0.80 threshold.',
  },
];

export const ArchitecturePlayground: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SimulatorTab>('t2nas');

  // --- T2NAS State ---
  const [cores, setCores] = useState<number>(8);
  const [isSimulatingKill, setIsSimulatingKill] = useState<boolean>(false);
  const [killRecoveryLog, setKillRecoveryLog] = useState<string | null>(null);

  const workers = Math.max(1, cores - 1);
  const throughputGbps = Math.min(9.85, (workers * 1.15 + (cores > 8 ? Math.log2(cores) * 0.35 : 0))).toFixed(2);
  const tbTransferMinutes = ((8000 / (parseFloat(throughputGbps) * 128)) / 60).toFixed(1);

  const handleSimulateKill = () => {
    soundEngine.playClick(500);
    setIsSimulatingKill(true);
    setKillRecoveryLog(null);
    setTimeout(() => {
      soundEngine.playClick(880);
      setIsSimulatingKill(false);
      setKillRecoveryLog(
        `[SIGKILL DETECTED] Process killed at byte offset 428,914,880. Read checkpoint_state.json... State verified! Resumed in 62ms with 0 re-transferred blocks.`
      );
    }, 1200);
  };

  // --- Audio Dedup State ---
  const [isDeduplicating, setIsDeduplicating] = useState<boolean>(false);
  const [dedupProgress, setDedupProgress] = useState<number>(0);
  const [dedupLogs, setDedupLogs] = useState<string[]>([]);
  const [dedupStats, setDedupStats] = useState<{ processed: number; duplicates: number; walCommits: number } | null>(null);

  const handleRunDedup = () => {
    soundEngine.playClick(780);
    setIsDeduplicating(true);
    setDedupProgress(0);
    setDedupLogs(['[INITIALIZE] Spawning multiprocessing worker pool for batch_vendor_04...']);
    setDedupStats(null);

    const stages = [
      { pct: 25, log: '[CHROMAPRINT] Generated acoustic fingerprints for 250 files across 7 workers' },
      { pct: 50, log: '[SHA-256] Cryptographic hash calculation & intra-batch collision scan in progress...' },
      { pct: 75, log: '[COLLISION ALERT] Found 48 duplicates matching historical catalog DB' },
      { pct: 100, log: '[SQLITE WAL] Atomic commit: 952 valid inserted, 48 duplicate files quarantined.' },
    ];

    stages.forEach((stage, idx) => {
      setTimeout(() => {
        setDedupProgress(stage.pct);
        setDedupLogs((prev) => [...prev, stage.log]);
        soundEngine.playClick(600 + idx * 80);

        if (stage.pct === 100) {
          setIsDeduplicating(false);
          setDedupStats({
            processed: 1000,
            duplicates: 48,
            walCommits: 952,
          });
        }
      }, (idx + 1) * 450);
    });
  };

  // --- Multi-Agent Consensus State ---
  const [selectedPromptIdx, setSelectedPromptIdx] = useState<number>(0);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evalStep, setEvalStep] = useState<number>(0);

  const PROMPT_SCENARIOS = [
    {
      title: 'Radiological VLM OCR & Anatomic Grounding',
      modelOutput: 'Pneumothorax detected in right pleural cavity (confidence: 0.94). Bounding box: [142, 88, 310, 420].',
      verdict: {
        factuality: 0.98,
        reasoning: 0.96,
        hallucination: false,
        pydanticScore: '100% CONFORMANT',
        decision: 'VERIFIED_ACCEPT',
      },
    },
    {
      title: 'Engineering CAD Blueprint Spatial Inspection',
      modelOutput: 'Bearing tolerance violation at Joint B4: 0.04mm clearance exceeds allowable ISO 286 envelope.',
      verdict: {
        factuality: 0.99,
        reasoning: 0.98,
        hallucination: false,
        pydanticScore: '100% CONFORMANT',
        decision: 'VERIFIED_ACCEPT',
      },
    },
    {
      title: 'Multimodal Balance Sheet Table Reconciliation',
      modelOutput: 'Q3 Operating Income matches GAAP footnote ($4.82M vs $4.82M). Footnote 12 OCR reconciled.',
      verdict: {
        factuality: 1.0,
        reasoning: 0.97,
        hallucination: false,
        pydanticScore: '100% CONFORMANT',
        decision: 'VERIFIED_ACCEPT',
      },
    },
  ];

  const handleRunAgentConsensus = () => {
    soundEngine.playClick(840);
    setIsEvaluating(true);
    setEvalStep(1);

    setTimeout(() => {
      soundEngine.playClick(920);
      setEvalStep(2);
    }, 600);

    setTimeout(() => {
      soundEngine.playClick(1000);
      setEvalStep(3);
    }, 1200);

    setTimeout(() => {
      soundEngine.playClick(1150);
      setIsEvaluating(false);
      setEvalStep(4);
    }, 1800);
  };

  // --- VLM Grounding State ---
  const [vlmShowBoxes, setVlmShowBoxes] = useState<boolean>(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.85);
  const [selectedBoxId, setSelectedBoxId] = useState<string>('bearing_b4');
  const [isScanningLaser, setIsScanningLaser] = useState<boolean>(false);

  const handleTriggerVlmScan = () => {
    soundEngine.playClick(940);
    setIsScanningLaser(true);
    setTimeout(() => {
      soundEngine.playClick(1100);
      setIsScanningLaser(false);
    }, 1200);
  };

  const selectedDetection =
    VLM_DETECTIONS.find((d) => d.id === selectedBoxId) || VLM_DETECTIONS[0];
  const visibleDetections = VLM_DETECTIONS.filter(
    (d) => d.confidence >= confidenceThreshold
  );

  return (
    <div className="rounded-3xl border border-cyan-400/30 bg-[#04050b]/90 backdrop-blur-2xl p-6 sm:p-8 relative overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.08)]">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 font-mono text-[10px] tracking-[0.25em] uppercase mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>INTERACTIVE ARCHITECTURE PLAYGROUND // LIVE SIMULATOR</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-display font-black uppercase text-white">
            HANDS-ON SYSTEMS EXPERIMENTATION
          </h3>
          <p className="text-xs font-mono text-white/60 mt-1 max-w-xl">
            Test real-world concurrency allocation, fault-tolerant crash recovery, and multi-agent VLM evaluation in real time.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-full border border-white/15 bg-black/60">
          <button
            onClick={() => {
              soundEngine.playClick(720);
              setActiveTab('t2nas');
            }}
            onMouseEnter={() => soundEngine.playHover()}
            className={`px-3.5 py-1.5 rounded-full font-mono text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
              activeTab === 't2nas'
                ? 'bg-cyan-400 text-black font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            01 // T2NAS CONCURRENCY
          </button>
          <button
            onClick={() => {
              soundEngine.playClick(760);
              setActiveTab('audio-dedup');
            }}
            onMouseEnter={() => soundEngine.playHover()}
            className={`px-3.5 py-1.5 rounded-full font-mono text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
              activeTab === 'audio-dedup'
                ? 'bg-cyan-400 text-black font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            02 // DEDUP BATCH
          </button>
          <button
            onClick={() => {
              soundEngine.playClick(800);
              setActiveTab('multi-agent');
            }}
            onMouseEnter={() => soundEngine.playHover()}
            className={`px-3.5 py-1.5 rounded-full font-mono text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
              activeTab === 'multi-agent'
                ? 'bg-cyan-400 text-black font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            03 // VLM CONSENSUS
          </button>
          <button
            onClick={() => {
              soundEngine.playClick(840);
              setActiveTab('vlm-grounding');
            }}
            onMouseEnter={() => soundEngine.playHover()}
            className={`px-3.5 py-1.5 rounded-full font-mono text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
              activeTab === 'vlm-grounding'
                ? 'bg-cyan-400 text-black font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            04 // VLM GROUNDING
          </button>
        </div>
      </div>

      {/* ==================== SIMULATOR 1: T2NAS CONCURRENCY ==================== */}
      {activeTab === 't2nas' && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-12 gap-6 items-center">
            {/* Slider Control & Telemetry */}
            <div className="lg:col-span-6 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-white/70 uppercase tracking-wider flex items-center gap-2">
                  <Sliders size={14} className="text-cyan-400" />
                  PHYSICAL CPU CORES ALLOCATED:
                </span>
                <span className="font-mono text-lg font-bold text-cyan-300">
                  {cores} CORES
                </span>
              </div>

              {/* Range input */}
              <input
                type="range"
                min={2}
                max={64}
                step={2}
                value={cores}
                onChange={(e) => {
                  soundEngine.playHover();
                  setCores(parseInt(e.target.value));
                }}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[9px] font-mono text-white/40">
                <span>2 CORES (MIN)</span>
                <span>16 CORES (NAS SERVER)</span>
                <span>64 CORES (DATACENTER SAN)</span>
              </div>

              {/* Dynamic Metric Cards */}
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                <div className="p-3 rounded-xl bg-black/60 border border-white/10">
                  <div className="text-[9px] font-mono text-white/40 uppercase">ACTIVE WORKERS</div>
                  <div className="text-base font-mono font-bold text-cyan-300">
                    {workers} (CORES - 1)
                  </div>
                  <div className="text-[9px] font-mono text-white/50">1 CORE RESERVED OS</div>
                </div>
                <div className="p-3 rounded-xl bg-black/60 border border-white/10">
                  <div className="text-[9px] font-mono text-white/40 uppercase">EST. THROUGHPUT</div>
                  <div className="text-base font-mono font-bold text-emerald-400">
                    {throughputGbps} Gbps
                  </div>
                  <div className="text-[9px] font-mono text-white/50">{throughputGbps >= '9.00' ? '10GbE SATURATED' : 'SCALING SPEED'}</div>
                </div>
                <div className="p-3 rounded-xl bg-black/60 border border-white/10">
                  <div className="text-[9px] font-mono text-white/40 uppercase">1TB TRANSFER TIME</div>
                  <div className="text-base font-mono font-bold text-fuchsia-300">
                    ~{tbTransferMinutes} MIN
                  </div>
                  <div className="text-[9px] font-mono text-white/50">PARALLEL CHUNKS</div>
                </div>
              </div>

              {/* Memory Ceiling Guarantee */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-emerald-400/30 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 size={14} />
                  <span>MEMORY CEILING: STRICTLY CLAMPED AT &lt; 384 MB</span>
                </div>
                <span className="text-[10px] text-white/50">O(1) STREAM BUFFER</span>
              </div>
            </div>

            {/* Visual Worker Thread Mesh & Fault Injection */}
            <div className="lg:col-span-6 space-y-4 p-5 rounded-2xl border border-white/10 bg-black/70">
              <div className="flex items-center justify-between text-[10px] font-mono text-white/50 uppercase">
                <span>MULTIPROCESSING WORKER THREAD TOPOLOGY</span>
                <span className="text-cyan-400">{workers} WORKERS DISPATCHED</span>
              </div>

              {/* Grid of worker badges */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 scrollbar-none">
                {Array.from({ length: workers }).map((_, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-lg border border-cyan-400/25 bg-cyan-400/5 text-center text-[9px] font-mono text-cyan-300"
                  >
                    W_{String(i + 1).padStart(2, '0')}
                  </div>
                ))}
              </div>

              {/* Fault-Tolerance Simulation Trigger */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <button
                  onClick={handleSimulateKill}
                  disabled={isSimulatingKill}
                  className="w-full py-2.5 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-300 font-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShieldAlert size={14} />
                  <span>
                    {isSimulatingKill
                      ? 'INJECTING SIGKILL & TESTING RECOVERY...'
                      : 'SIMULATE FORCED POWER-LOSS // SIGKILL'}
                  </span>
                </button>

                {killRecoveryLog && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 text-[11px] font-mono leading-relaxed"
                  >
                    {killRecoveryLog}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SIMULATOR 2: AUDIO DEDUP BATCH ==================== */}
      {activeTab === 'audio-dedup' && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4">
              <div className="text-xs font-mono text-white/70 uppercase">
                DETERMINISTIC FINGERPRINT PIPELINE
              </div>
              <p className="text-xs font-mono text-white/60 leading-relaxed">
                Processes high-volume audio batches with Chromaprint acoustic waveform hashing, followed by byte-level SHA-256 verification and atomic SQLite WAL insertion.
              </p>

              <button
                onClick={handleRunDedup}
                disabled={isDeduplicating}
                className="w-full py-3 rounded-full bg-cyan-400 text-black hover:bg-white font-mono text-xs font-bold tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.3)] disabled:opacity-50"
              >
                <Play size={13} />
                <span>{isDeduplicating ? 'PROCESSING BATCH...' : 'INJECT 1,000 VENDOR SAMPLES'}</span>
              </button>

              {dedupStats && (
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 text-center">
                    <div className="text-[9px] font-mono text-white/40">PROCESSED</div>
                    <div className="text-sm font-mono font-bold text-white">{dedupStats.processed}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 text-center">
                    <div className="text-[9px] font-mono text-red-400">DUPLICATES</div>
                    <div className="text-sm font-mono font-bold text-red-400">{dedupStats.duplicates}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 text-center">
                    <div className="text-[9px] font-mono text-emerald-400">WAL WRITES</div>
                    <div className="text-sm font-mono font-bold text-emerald-400">{dedupStats.walCommits}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Terminal Live Log Stream */}
            <div className="lg:col-span-7 rounded-2xl border border-white/15 bg-black/90 p-4 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[10px] text-white/50">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Terminal size={12} />
                  <span>DEDUP_ENGINE.STDOUT</span>
                </span>
                <span>PROGRESS: {dedupProgress}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-300"
                  style={{ width: `${dedupProgress}%` }}
                />
              </div>

              <div className="space-y-1.5 pt-2 min-h-[140px]">
                {dedupLogs.length === 0 ? (
                  <div className="text-white/30 text-[11px] pt-8 text-center">
                    Click 'INJECT 1,000 VENDOR SAMPLES' to observe deterministic batch validation.
                  </div>
                ) : (
                  dedupLogs.map((log, i) => (
                    <div
                      key={i}
                      className={`text-[11px] ${
                        log.includes('COLLISION') ? 'text-red-400' : log.includes('WAL') ? 'text-emerald-300' : 'text-white/80'
                      }`}
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SIMULATOR 3: MULTI-AGENT VLM CONSENSUS ==================== */}
      {activeTab === 'multi-agent' && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* Scenario Picker */}
            <div className="lg:col-span-5 space-y-4">
              <div className="text-xs font-mono text-white/70 uppercase">
                SELECT MULTIMODAL BENCHMARK TASK
              </div>
              <div className="space-y-2">
                {PROMPT_SCENARIOS.map((sc, idx) => (
                  <button
                    key={sc.title}
                    onClick={() => {
                      soundEngine.playClick(750);
                      setSelectedPromptIdx(idx);
                      setEvalStep(0);
                    }}
                    className={`w-full p-3 rounded-xl border text-left font-mono text-xs transition-all cursor-pointer ${
                      selectedPromptIdx === idx
                        ? 'border-cyan-400 bg-cyan-400/10 text-white font-bold'
                        : 'border-white/10 bg-black/40 text-white/60 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <div className="text-[10px] text-cyan-400">SCENARIO 0{idx + 1}</div>
                    <div className="truncate">{sc.title}</div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleRunAgentConsensus}
                disabled={isEvaluating}
                className="w-full py-3 rounded-full bg-cyan-400 text-black hover:bg-white font-mono text-xs font-bold tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.3)] disabled:opacity-50"
              >
                <Zap size={13} />
                <span>{isEvaluating ? 'AGENTS IN CONSENSUS DEBATE...' : 'RUN MULTI-AGENT EVALUATION'}</span>
              </button>
            </div>

            {/* Tri-Agent Debate & Pydantic Schema Verification */}
            <div className="lg:col-span-7 p-5 rounded-2xl border border-white/15 bg-black/80 space-y-4 font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[10px] text-white/50">
                <span>TRI-PERSPECTIVE AGENT EVALUATION SWARM</span>
                <span className="text-cyan-400">
                  {evalStep === 0 && 'STANDBY'}
                  {evalStep === 1 && 'AGENT 1: FACTUALITY OCR INSPECT'}
                  {evalStep === 2 && 'AGENT 2: REASONING PARITY CHECK'}
                  {evalStep === 3 && 'AGENT 3: PYDANTIC SCHEMA LOCK'}
                  {evalStep === 4 && 'CONSENSUS REACHED'}
                </span>
              </div>

              {/* 3 Agents Visualization */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div
                  className={`p-2.5 rounded-xl border transition-all ${
                    evalStep >= 1
                      ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-300'
                      : 'border-white/10 text-white/40'
                  }`}
                >
                  <div className="text-[9px] uppercase">AGENT 01</div>
                  <div className="font-bold text-[10px] sm:text-xs">GROUNDING</div>
                  <div className="text-[8px] text-white/50">OCR & Bounding</div>
                </div>

                <div
                  className={`p-2.5 rounded-xl border transition-all ${
                    evalStep >= 2
                      ? 'border-fuchsia-400/60 bg-fuchsia-400/10 text-fuchsia-300'
                      : 'border-white/10 text-white/40'
                  }`}
                >
                  <div className="text-[9px] uppercase">AGENT 02</div>
                  <div className="font-bold text-[10px] sm:text-xs">REASONING</div>
                  <div className="text-[8px] text-white/50">Logic Parity</div>
                </div>

                <div
                  className={`p-2.5 rounded-xl border transition-all ${
                    evalStep >= 3
                      ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-300'
                      : 'border-white/10 text-white/40'
                  }`}
                >
                  <div className="text-[9px] uppercase">AGENT 03</div>
                  <div className="font-bold text-[10px] sm:text-xs">SENTINEL</div>
                  <div className="text-[8px] text-white/50">Schema Guard</div>
                </div>
              </div>

              {/* Output Rubric Box */}
              <div className="p-3.5 rounded-xl bg-[#020205] border border-white/10 text-xs space-y-2">
                <div className="flex items-center justify-between text-[10px] text-white/50">
                  <span>PYDANTIC_V2_OUTPUT.JSON</span>
                  <span className="text-emerald-400">STATUS: VALIDATED</span>
                </div>
                <pre className="text-[11px] text-white/80 overflow-x-auto leading-relaxed">
                  <code>{JSON.stringify(PROMPT_SCENARIOS[selectedPromptIdx].verdict, null, 2)}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SIMULATOR 4: VLM VISUAL GROUNDING INSPECTOR ==================== */}
      {activeTab === 'vlm-grounding' && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Interactive Schematic Canvas */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl border border-white/10 bg-black/40">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      soundEngine.playClick(750);
                      setVlmShowBoxes(!vlmShowBoxes);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-mono text-[10px] tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                      vlmShowBoxes
                        ? 'bg-cyan-400 text-black font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                        : 'border border-white/20 text-white/60 hover:text-white'
                    }`}
                  >
                    <Eye size={12} />
                    <span>{vlmShowBoxes ? 'VLM BOUNDING BOXES: ON' : 'RAW BLUEPRINT ONLY'}</span>
                  </button>

                  <button
                    onClick={handleTriggerVlmScan}
                    disabled={isScanningLaser}
                    className="px-3 py-1.5 rounded-xl border border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-300 font-mono text-[10px] tracking-wider uppercase hover:bg-fuchsia-400/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Scan size={12} className={isScanningLaser ? 'animate-spin' : ''} />
                    <span>{isScanningLaser ? 'SCANNING SPATIAL TENSORS...' : 'RUN VLM SCAN'}</span>
                  </button>
                </div>

                <div className="text-[10px] font-mono text-white/50">
                  INPUT: <span className="text-cyan-300 font-bold">CAD_SCHEMATIC_B4.SVG</span>
                </div>
              </div>

              {/* Blueprint & Grounding Box Canvas */}
              <div className="relative w-full aspect-[4/3] rounded-2xl border border-cyan-400/30 bg-[#02050c] overflow-hidden select-none shadow-[inset_0_0_30px_rgba(0,240,255,0.06)]">
                {/* Engineering Blueprint Grid */}
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: `linear-gradient(to right, rgba(0,240,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,240,255,0.15) 1px, transparent 1px)`,
                    backgroundSize: '24px 24px',
                  }}
                />

                {/* SVG Technical Blueprint Schematic */}
                <svg
                  className="absolute inset-0 w-full h-full text-cyan-400/40"
                  viewBox="0 0 600 450"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Centerlines */}
                  <line x1="30" y1="225" x2="570" y2="225" stroke="currentColor" strokeDasharray="6 3" strokeWidth="0.8" />
                  <line x1="300" y1="30" x2="300" y2="420" stroke="currentColor" strokeDasharray="6 3" strokeWidth="0.8" />

                  {/* Main housing circles */}
                  <circle cx="300" cy="225" r="140" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="300" cy="225" r="105" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 2" />
                  <circle cx="300" cy="225" r="65" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="300" cy="225" r="30" stroke="currentColor" strokeWidth="1" />

                  {/* Impeller Blades */}
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                    <line
                      key={angle}
                      x1="300"
                      y1="225"
                      x2={300 + 95 * Math.cos((angle * Math.PI) / 180)}
                      y2={225 + 95 * Math.sin((angle * Math.PI) / 180)}
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Flange & Bolt Holes */}
                  {[30, 90, 150, 210, 270, 330].map((angle) => (
                    <circle
                      key={`bolt-${angle}`}
                      cx={300 + 125 * Math.cos((angle * Math.PI) / 180)}
                      cy={225 + 125 * Math.sin((angle * Math.PI) / 180)}
                      r="6"
                      stroke="currentColor"
                      strokeWidth="0.9"
                    />
                  ))}

                  {/* Dimension lines & Text */}
                  <line x1="160" y1="75" x2="440" y2="75" stroke="currentColor" strokeWidth="0.8" />
                  <line x1="160" y1="70" x2="160" y2="80" stroke="currentColor" strokeWidth="0.8" />
                  <line x1="440" y1="70" x2="440" y2="80" stroke="currentColor" strokeWidth="0.8" />
                  <text x="300" y="68" fill="#00f0ff" fontSize="10" fontFamily="monospace" textAnchor="middle" opacity="0.6">
                    Ø 280.00mm &plusmn;0.05
                  </text>

                  {/* Corner Engineering Stamp */}
                  <rect x="420" y="375" width="160" height="60" stroke="currentColor" strokeWidth="0.8" />
                  <text x="430" y="395" fill="white" fontSize="9" fontFamily="monospace" opacity="0.6">
                    PROJECT: T2-HYDRAULIC
                  </text>
                  <text x="430" y="410" fill="white" fontSize="8" fontFamily="monospace" opacity="0.4">
                    TOLERANCE: ISO 286-1
                  </text>
                  <text x="430" y="425" fill="#00f0ff" fontSize="8" fontFamily="monospace" opacity="0.7">
                    APPROVED: S. DIMRI
                  </text>
                </svg>

                {/* Laser Scanning Line Animation */}
                {isScanningLaser && (
                  <motion.div
                    initial={{ top: '0%' }}
                    animate={{ top: '100%' }}
                    transition={{ duration: 1.2, ease: 'linear' }}
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#00f0ff] z-20 pointer-events-none"
                  />
                )}

                {/* Interactive VLM Bounding Boxes */}
                {vlmShowBoxes &&
                  visibleDetections.map((d) => {
                    const isSelected = selectedBoxId === d.id;
                    const borderColor =
                      d.category === 'MECHANICAL'
                        ? '#00f0ff'
                        : d.category === 'DIMENSION'
                        ? '#34d399'
                        : d.category === 'FASTENER'
                        ? '#e879f9'
                        : '#fbbf24';

                    return (
                      <div
                        key={d.id}
                        onClick={() => {
                          soundEngine.playClick(880);
                          setSelectedBoxId(d.id);
                        }}
                        style={{
                          left: `${d.coords.x}%`,
                          top: `${d.coords.y}%`,
                          width: `${d.coords.w}%`,
                          height: `${d.coords.h}%`,
                          borderColor: borderColor,
                        }}
                        className={`absolute border-2 transition-all cursor-pointer group ${
                          isSelected
                            ? 'bg-cyan-400/15 shadow-[0_0_20px_rgba(0,240,255,0.35)] ring-2 ring-white/50 z-10'
                            : 'bg-black/30 hover:bg-white/10'
                        }`}
                      >
                        {/* Corner brackets */}
                        <span className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white" />
                        <span className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white" />
                        <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white" />

                        {/* Tag Badge */}
                        <div
                          style={{ backgroundColor: borderColor }}
                          className="absolute -top-5 left-0 px-1.5 py-0.5 text-black font-mono font-bold text-[8px] tracking-wider uppercase rounded flex items-center gap-1 shadow-sm whitespace-nowrap"
                        >
                          <Crosshair size={9} />
                          <span>{d.label}</span>
                          <span className="opacity-75">{(d.confidence * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Status footer */}
              <div className="flex items-center justify-between text-[10px] font-mono text-white/50 px-1">
                <span>VLM SPATIAL RESOLUTION: 1000x1000 NORMALIZED</span>
                <span className="text-cyan-400 font-bold">
                  {visibleDetections.length} OBJECTS GROUNDED
                </span>
              </div>
            </div>

            {/* Right Column: VLM Inspector & Filter Controls */}
            <div className="lg:col-span-5 space-y-4">
              {/* Confidence Threshold Slider */}
              <div className="p-4 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md space-y-2.5">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-white/60 flex items-center gap-1.5">
                    <SlidersHorizontal size={13} className="text-cyan-400" />
                    CONFIDENCE CUTOFF:
                  </span>
                  <span className="text-cyan-300 font-bold">
                    &ge; {(confidenceThreshold * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.70"
                  max="0.99"
                  step="0.01"
                  value={confidenceThreshold}
                  onChange={(e) => {
                    setConfidenceThreshold(parseFloat(e.target.value));
                    soundEngine.playHover();
                  }}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[9px] font-mono text-white/40">
                  <span>0.70 (LOOSE)</span>
                  <span>FILTERED: {visibleDetections.length} of {VLM_DETECTIONS.length} ACTIVE</span>
                  <span>0.99 (STRICT)</span>
                </div>
              </div>

              {/* Detection Navigation Pills */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono tracking-wider text-white/40 uppercase">
                  DETECTED ENTITIES ({visibleDetections.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {VLM_DETECTIONS.map((d) => {
                    const isVisible = d.confidence >= confidenceThreshold;
                    const isSelected = selectedBoxId === d.id;
                    return (
                      <button
                        key={d.id}
                        disabled={!isVisible}
                        onClick={() => {
                          soundEngine.playClick(820);
                          setSelectedBoxId(d.id);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-mono text-[9px] tracking-wider uppercase transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-400 text-black font-bold'
                            : isVisible
                            ? 'border border-white/15 bg-white/[0.04] text-white/70 hover:text-white'
                            : 'opacity-30 border border-white/5 line-through text-white/30 cursor-not-allowed'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Entity Card */}
              <div className="p-4 rounded-2xl border border-white/10 bg-[#03040a] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                  <div>
                    <div className="text-[9px] font-mono text-cyan-400 tracking-wider">
                      TARGET: {selectedDetection.category}
                    </div>
                    <div className="text-sm font-display font-black text-white">
                      {selectedDetection.label}
                    </div>
                  </div>
                  <div className="px-2 py-0.5 rounded bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 font-mono text-[10px] font-bold">
                    {(selectedDetection.confidence * 100).toFixed(1)}% CONF
                  </div>
                </div>

                <div className="space-y-1 text-xs font-mono">
                  <div className="text-[10px] text-white/40">OCR GROUND TRUTH TEXT:</div>
                  <div className="p-2 rounded-lg bg-black/60 border border-white/10 text-cyan-200 text-[11px]">
                    "{selectedDetection.ocrText}"
                  </div>
                </div>

                <p className="text-[10px] font-mono text-white/60 leading-relaxed">
                  {selectedDetection.notes}
                </p>

                {/* Structured JSON Coordinate Tensor */}
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex items-center justify-between text-[10px] text-white/40">
                    <span>NORMALIZED PYDANTIC TENSOR</span>
                    <span className="text-emerald-400">SCHEMA: PASS</span>
                  </div>
                  <pre className="p-2.5 rounded-lg bg-black/80 border border-white/10 text-[10px] text-white/80 overflow-x-auto leading-relaxed">
                    <code>
{JSON.stringify(
  {
    box_2d: [
      Math.round(selectedDetection.coords.y * 10),
      Math.round(selectedDetection.coords.x * 10),
      Math.round((selectedDetection.coords.y + selectedDetection.coords.h) * 10),
      Math.round((selectedDetection.coords.x + selectedDetection.coords.w) * 10),
    ],
    label: selectedDetection.label,
    category: selectedDetection.category,
    confidence: selectedDetection.confidence,
    ocr_payload: selectedDetection.ocrText,
    verdict: 'GROUNDED_VERIFIED',
  },
  null,
  2
)}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchitecturePlayground;
