import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal as TerminalIcon, 
  Maximize2, 
  Minimize2, 
  Download, 
  ExternalLink, 
  Github, 
  Linkedin, 
  Mail, 
  Phone, 
  Sparkles,
  Layers,
  Cpu,
  Brain,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

type ThemeName = 'dracula' | 'matrix' | 'cyberpunk' | 'onedark' | 'amber';

interface ThemeStyles {
  bg: string;
  cardBg: string;
  headerBg: string;
  border: string;
  text: string;
  prompt: string;
  accent: string;
  secondary: string;
  highlight: string;
}

const themes: Record<ThemeName, ThemeStyles> = {
  dracula: {
    bg: 'bg-[#1e1f29]/95',
    cardBg: 'bg-[#282a36]',
    headerBg: 'bg-[#21222c]',
    border: 'border-[#44475a]',
    text: 'text-[#f8f8f2]',
    prompt: 'text-[#50fa7b]',
    accent: 'text-[#bd93f9]',
    secondary: 'text-[#8be9fd]',
    highlight: 'text-[#ff79c6]',
  },
  matrix: {
    bg: 'bg-[#050d08]/95',
    cardBg: 'bg-[#0a180f]',
    headerBg: 'bg-[#07130b]',
    border: 'border-[#15803d]/40',
    text: 'text-[#4ade80]',
    prompt: 'text-[#22c55e]',
    accent: 'text-[#86efac]',
    secondary: 'text-[#16a34a]',
    highlight: 'text-[#bbf7d0]',
  },
  cyberpunk: {
    bg: 'bg-[#0c051a]/95',
    cardBg: 'bg-[#180a33]',
    headerBg: 'bg-[#120726]',
    border: 'border-[#00f0ff]/30',
    text: 'text-[#00f0ff]',
    prompt: 'text-[#ff007f]',
    accent: 'text-[#ffe600]',
    secondary: 'text-[#a855f7]',
    highlight: 'text-[#ff007f]',
  },
  onedark: {
    bg: 'bg-[#1e1e2e]/95',
    cardBg: 'bg-[#252538]',
    headerBg: 'bg-[#181825]',
    border: 'border-[#45475a]',
    text: 'text-[#cdd6f4]',
    prompt: 'text-[#a6e3a1]',
    accent: 'text-[#89b4fa]',
    secondary: 'text-[#f38ba8]',
    highlight: 'text-[#fab387]',
  },
  amber: {
    bg: 'bg-[#120a02]/95',
    cardBg: 'bg-[#1c1103]',
    headerBg: 'bg-[#170e03]',
    border: 'border-[#d97706]/40',
    text: 'text-[#fbbf24]',
    prompt: 'text-[#f59e0b]',
    accent: 'text-[#fde68a]',
    secondary: 'text-[#b45309]',
    highlight: 'text-[#d97706]',
  },
};

interface HistoryItem {
  id: string;
  command: string;
  output: React.ReactNode;
}

interface TerminalPortfolioProps {
  onSwitchToGui?: () => void;
}

export const TerminalPortfolio: React.FC<TerminalPortfolioProps> = ({ onSwitchToGui }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [theme, setTheme] = useState<ThemeName>('cyberpunk');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [matrixActive, setMatrixActive] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const matrixCanvasRef = useRef<HTMLCanvasElement>(null);

  const t = themes[theme];

  // Auto-scroll terminal output
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Focus input on mount & click
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Welcome sequence on load
  useEffect(() => {
    const welcome = (
      <div className="space-y-3 font-mono text-xs sm:text-sm">
        <pre className={`text-[10px] sm:text-xs leading-none font-bold ${t.highlight} select-none overflow-x-auto py-2`}>
{`  ███████╗██╗  ██╗██╗██╗   ██╗ █████╗ ███╗   ██╗███████╗██╗  ██╗
  ██╔════╝██║  ██║██║██║   ██║██╔══██╗████╗  ██║██╔════╝██║  ██║
  ███████╗███████║██║██║   ██║███████║██╔██╗ ██║███████╗███████║
  ╚════██║██╔══██║██║╚██╗ ██╔╝██╔══██║██║╚██╗██║╚════██║██╔══██║
  ███████║██║  ██║██║ ╚████╔╝ ██║  ██║██║ ╚████║███████║██║  ██║
  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝`}
        </pre>
        <div className="border-l-2 border-primary/50 pl-3 space-y-1">
          <p className="font-semibold text-foreground">
            SHIVANSH DIMRI &middot; <span className={t.accent}>Associate AI Engineer</span>
          </p>
          <p className="text-muted-foreground">
            AI Systems &middot; Multimodal Evaluation &middot; Python Concurrency &middot; Data Pipelines
          </p>
          <p className="text-muted-foreground text-xs">
            Location: <span className="text-foreground">Lucknow, India</span> &middot; System: <span className="text-foreground">AI Core v2.4 (x86_64)</span>
          </p>
        </div>
        <div className="bg-card/40 border border-border/40 p-2.5 rounded-lg flex flex-wrap items-center gap-2">
          <span className={`${t.prompt} font-bold`}>Quick Start:</span>
          <span className="text-muted-foreground">Type</span>
          <code className={`${t.highlight} bg-background/50 px-1.5 py-0.5 rounded font-bold`}>help</code>
          <span className="text-muted-foreground">to inspect available commands or click the chips below.</span>
        </div>
      </div>
    );

    setHistory([{ id: 'init', command: 'system.boot', output: welcome }]);
  }, [theme, t.accent, t.highlight, t.prompt]);

  // Matrix digital rain effect
  useEffect(() => {
    if (!matrixActive || !matrixCanvasRef.current) return;
    const canvas = matrixCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 800;
    canvas.height = canvas.parentElement?.clientHeight || 500;

    const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテト';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    let animationFrameId: number;

    const render = () => {
      ctx.fillStyle = 'rgba(10, 10, 15, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#00ff88';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [matrixActive]);

  const executeCommand = (cmdStr: string) => {
    const rawCmd = cmdStr.trim();
    if (!rawCmd) return;

    setCommandHistory((prev) => [...prev, rawCmd]);
    setHistoryIndex(-1);

    const parts = rawCmd.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ').toLowerCase();

    let output: React.ReactNode = null;

    switch (command) {
      case 'help':
      case 'man':
      case 'ls':
        output = (
          <div className="space-y-3 font-mono text-xs sm:text-sm">
            <p className={`${t.highlight} font-bold`}>=== AVAILABLE TERMINAL COMMANDS ===</p>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
              <div>
                <span className={`${t.prompt} font-semibold w-24 inline-block`}>about</span>
                <span className="text-muted-foreground">Professional summary & background</span>
              </div>
              <div>
                <span className={`${t.prompt} font-semibold w-24 inline-block`}>exp</span>
                <span className="text-muted-foreground">Work history & roles</span>
              </div>
              <div>
                <span className={`${t.prompt} font-semibold w-24 inline-block`}>projects</span>
                <span className="text-muted-foreground">Systems engineering & web client work</span>
              </div>
              <div>
                <span className={`${t.prompt} font-semibold w-24 inline-block`}>project &lt;name&gt;</span>
                <span className="text-muted-foreground">Deep dive (audio | t2nas | rsync)</span>
              </div>
              <div>
                <span className={`${t.prompt} font-semibold w-24 inline-block`}>skills</span>
                <span className="text-muted-foreground">Technical proficiencies & models</span>
              </div>
              <div>
                <span className={`${t.prompt} font-semibold w-24 inline-block`}>resume</span>
                <span className="text-muted-foreground">Download latest resume (PDF)</span>
              </div>
              <div>
                <span className={`${t.prompt} font-semibold w-24 inline-block`}>contact</span>
                <span className="text-muted-foreground">Social links & contact form</span>
              </div>
              <div>
                <span className={`${t.prompt} font-semibold w-24 inline-block`}>theme &lt;name&gt;</span>
                <span className="text-muted-foreground">dracula, matrix, cyberpunk, onedark, amber</span>
              </div>
              <div>
                <span className={`${t.prompt} font-semibold w-24 inline-block`}>matrix</span>
                <span className="text-muted-foreground">Toggle digital rain simulation</span>
              </div>
              <div>
                <span className={`${t.prompt} font-semibold w-24 inline-block`}>gui</span>
                <span className="text-muted-foreground">Switch to visual web portfolio layout</span>
              </div>
              <div>
                <span className={`${t.prompt} font-semibold w-24 inline-block`}>clear</span>
                <span className="text-muted-foreground">Clear current terminal session</span>
              </div>
            </div>
          </div>
        );
        break;

      case 'about':
      case 'whoami':
        output = (
          <div className="space-y-3 font-mono text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <Brain className={t.accent} size={18} />
              <span className={`${t.highlight} font-bold text-base`}>Shivansh Dimri</span>
              <span className="text-xs text-muted-foreground">(Associate AI Engineer)</span>
            </div>
            <p className="text-foreground/90 leading-relaxed">
              AI Engineer specializing in Python-based engineering systems, LLM integration, agentic AI,
              data engineering, and intelligent automation. Experienced in developing scalable data processing
              workflows, integrating AI models and agents, automating complex operations, and building reliable software systems.
            </p>
            <div className="grid sm:grid-cols-2 gap-2 text-xs border-t border-border/30 pt-2">
              <div><span className="text-muted-foreground">Location:</span> Lucknow, India</div>
              <div><span className="text-muted-foreground">Email:</span> dimrishiv933@gmail.com</div>
              <div><span className="text-muted-foreground">Status:</span> Open to full-time & consulting roles</div>
              <div><span className="text-muted-foreground">GitHub:</span> github.com/shiv677</div>
            </div>
          </div>
        );
        break;

      case 'exp':
      case 'experience':
      case 'history':
        output = (
          <div className="space-y-4 font-mono text-xs sm:text-sm">
            <p className={`${t.highlight} font-bold`}>=== PROFESSIONAL EXPERIENCE (2+ YEARS // RAPID ADVANCES) ===</p>

            <div className="space-y-3">
              <div className="border-l-2 border-primary/60 pl-3">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="font-bold text-foreground">Associate AI Engineer &middot; InfoBay AI Limited</span>
                  <span className={`${t.accent} text-xs`}>Feb 2026 – Present (On-site)</span>
                </div>
                <ul className="list-disc list-inside text-muted-foreground text-xs mt-1.5 space-y-1">
                  <li>Developing Python automation and high-throughput data-processing systems for enterprise operations.</li>
                  <li>Building AI/LLM evaluation and benchmarking workflows with automated scoring and structured schema validation.</li>
                  <li>Designing dataset validation, deduplication, and quality-control pipelines across large-scale question corpora.</li>
                  <li>Working with multimodal models (VLMs) and structured Pydantic v2 schema evaluation.</li>
                  <li>Automating research and discovery workflows for specialised question datasets and source classification.</li>
                  <li>Developing reliable processing systems with checkpointing, concurrency, and recovery mechanisms.</li>
                </ul>
              </div>

              <div className="border-l-2 border-amber-500/60 pl-3">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="font-bold text-foreground">Lead Systems Developer &middot; Independent Systems Research</span>
                  <span className={`${t.accent} text-xs`}>2024 – 2026 (Remote)</span>
                </div>
                <ul className="list-disc list-inside text-muted-foreground text-xs mt-1.5 space-y-1">
                  <li>Authored T2NAS, a CPU-aware resumable parallel transfer engine for 10Gbps NAS network environments.</li>
                  <li>Developed Audio Internal & External Duplicacy Checker combining acoustic hashing with atomic SQLite WAL checkpointing.</li>
                  <li>Constructed Enterprise Rsync Transfer Platform with embedded runtimes and live stdout regex telemetry.</li>
                </ul>
              </div>
            </div>
          </div>
        );
        break;

      case 'skills':
        output = (
          <div className="space-y-4 font-mono text-xs sm:text-sm">
            <p className={`${t.highlight} font-bold`}>=== TECHNICAL SKILLS & PROFICIENCIES ===</p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2 bg-card/30 p-3 rounded-lg border border-border/30">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <Brain size={14} className={t.accent} />
                  <span>AI & Model Engineering</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  LLM Integration, Agentic AI, Multi-Agent Systems, RAG, PyTorch, Vision-Language Models (VLMs), Computer Vision, Grad-CAM, Model Benchmarking.
                </p>
                <div className="text-[11px] text-primary">Proficiency: [████████████████░░] 88%</div>
              </div>

              <div className="space-y-2 bg-card/30 p-3 rounded-lg border border-border/30">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <Cpu size={14} className={t.accent} />
                  <span>Core & Systems Engineering</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Python, AsyncIO, Multiprocessing, Multithreading, Concurrent Programming, Fault Tolerance, Checkpointing, Data Deduplication, Memory Safety.
                </p>
                <div className="text-[11px] text-primary">Proficiency: [██████████████████] 95%</div>
              </div>

              <div className="space-y-2 bg-card/30 p-3 rounded-lg border border-border/30">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <Layers size={14} className={t.accent} />
                  <span>Data Engineering & Pipelines</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Large-Scale Processing, ETL Pipelines, Web Scraping, Data Validation, Structured Extraction, SQLite, MySQL.
                </p>
                <div className="text-[11px] text-primary">Proficiency: [████████████████░░] 90%</div>
              </div>

              <div className="space-y-2 bg-card/30 p-3 rounded-lg border border-border/30">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <ShieldCheck size={14} className={t.accent} />
                  <span>Tooling, Web & Infrastructure</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Linux, Docker, Git, SSH, REST APIs, Hugging Face, Ollama, LM Studio, React, Next.js, TypeScript, Tailwind CSS.
                </p>
                <div className="text-[11px] text-primary">Proficiency: [███████████████░░░] 85%</div>
              </div>
            </div>
          </div>
        );
        break;

      case 'projects':
      case 'work':
        output = (
          <div className="space-y-4 font-mono text-xs sm:text-sm">
            <p className={`${t.highlight} font-bold`}>=== FEATURED PROJECTS & SYSTEMS ===</p>
            <p className="text-muted-foreground text-xs">
              Type <code className={`${t.accent} font-bold`}>project &lt;name&gt;</code> to inspect details (e.g. <code className="text-foreground">project audio</code>, <code className="text-foreground">project t2nas</code>, <code className="text-foreground">project rsync</code>).
            </p>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-card/40 border border-border/40 hover:border-primary/50 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-foreground">1. Audio Internal & External Duplicacy Checker</span>
                  <a href="https://github.com/shiv677/Audio-Internal-External-Duplicacy-Checker" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <Github size={12} /> repo <ExternalLink size={10} />
                  </a>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Deterministic fingerprint-based audio deduplication system preventing redundant database insertion across vendor batches with multiprocessing.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px]">Python</span>
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px]">Multiprocessing</span>
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px]">Hash Fingerprinting</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-card/40 border border-border/40 hover:border-primary/50 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-foreground">2. T2NAS – Production Parallel NAS Transfer Tool</span>
                  <a href="https://github.com/shiv677/T2NAS" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <Github size={12} /> repo <ExternalLink size={10} />
                  </a>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  CPU-aware, resumable high-volume file migration engine with SHA-256 validation, checkpoint state recovery, and memory-safe execution.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px]">Python</span>
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px]">Checkpointing</span>
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px]">SHA-256</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-card/40 border border-border/40 hover:border-primary/50 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-foreground">3. Enterprise Rsync Transfer Platform</span>
                  <a href="https://github.com/shiv677/sync_tool" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <Github size={12} /> repo <ExternalLink size={10} />
                  </a>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Self-contained Windows executable packaging embedded rsync and OpenSSH runtimes with subprocess streaming and RBAC security.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px]">Python</span>
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px]">Embedded Rsync</span>
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px]">Subprocess Streaming</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-card/40 border border-border/40 hover:border-primary/50 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-foreground">4. Autonomous AI & Multimodal VLM Evaluation Harness</span>
                  <a href="https://github.com/shiv677" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <Github size={12} /> repo <ExternalLink size={10} />
                  </a>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Distributed model benchmarking framework orchestrating multi-agent consensus swarms, Pydantic v2 schema constraints, and multimodal VLM regression suites.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px]">Python 3.12</span>
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px]">LangGraph</span>
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px]">Pydantic v2</span>
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px]">VLM Reasoning</span>
                </div>
              </div>
            </div>
          </div>
        );
        break;

      case 'project':
        if (args.includes('audio') || args.includes('duplicacy')) {
          output = (
            <div className="space-y-3 font-mono text-xs sm:text-sm">
              <p className={`${t.highlight} font-bold`}>=== Audio Duplicacy Checker ===</p>
              <p className="text-foreground/90">
                Deterministic fingerprint-based audio deduplication system preventing redundant database insertion across vendor batches.
              </p>
              <div className="bg-card/50 p-3 rounded font-mono text-xs space-y-1">
                <div>&bull; Multiprocessing execution across CPU cores</div>
                <div>&bull; Internal batch validation + Cross-batch database integrity</div>
                <div>&bull; Structured CSV audit logs with deterministic hash comparisons</div>
                <div>&bull; Memory peak tested and constrained within safe thresholds</div>
              </div>
              <a href="https://github.com/shiv677/Audio-Internal-External-Duplicacy-Checker" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                <Github size={14} /> Open Repository <ExternalLink size={12} />
              </a>
            </div>
          );
        } else if (args.includes('t2nas') || args.includes('nas')) {
          output = (
            <div className="space-y-3 font-mono text-xs sm:text-sm">
              <p className={`${t.highlight} font-bold`}>=== T2NAS &middot; Parallel File Transfer Engine ===</p>
              <p className="text-foreground/90">
                CPU-aware, resumable high-volume file migration system optimised for NAS and network transfers.
              </p>
              <div className="bg-card/50 p-3 rounded font-mono text-xs space-y-1">
                <div>&bull; Dynamic worker scaling: CPU count - 1 strategy</div>
                <div>&bull; Checkpoint state tracking in checkpoint_state.json for mid-flight resumes</div>
                <div>&bull; End-to-end SHA-256 chunk-level verification</div>
                <div>&bull; Tested with network drop simulation & forced process kill recovery</div>
              </div>
              <a href="https://github.com/shiv677/T2NAS" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                <Github size={14} /> Open Repository <ExternalLink size={12} />
              </a>
            </div>
          );
        } else if (args.includes('rsync') || args.includes('sync')) {
          output = (
            <div className="space-y-3 font-mono text-xs sm:text-sm">
              <p className={`${t.highlight} font-bold`}>=== Enterprise Rsync Transfer Platform ===</p>
              <p className="text-foreground/90">
                Self-contained enterprise-grade rsync orchestration system with reliability hardening and embedded runtime.
              </p>
              <div className="bg-card/50 p-3 rounded font-mono text-xs space-y-1">
                <div>&bull; Standalone packaging with embedded rsync and OpenSSH runtimes</div>
                <div>&bull; Subprocess progress streaming with real-time CLI status parsing</div>
                <div>&bull; Queue-based fault-tolerant execution engine with SSH keep-alives</div>
                <div>&bull; Role-based access control (RBAC) with cryptographic authentication</div>
              </div>
              <a href="https://github.com/shiv677/sync_tool" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                <Github size={14} /> Open Repository <ExternalLink size={12} />
              </a>
            </div>
          );
        } else if (args.includes('ai') || args.includes('vlm') || args.includes('eval') || args.includes('harness')) {
          output = (
            <div className="space-y-3 font-mono text-xs sm:text-sm">
              <p className={`${t.highlight} font-bold`}>=== Autonomous AI & Multimodal VLM Evaluation Harness ===</p>
              <p className="text-foreground/90">
                Distributed benchmarking framework distributing multimodal vision-language model and agentic evaluations with 100% Pydantic schema validation.
              </p>
              <div className="bg-card/50 p-3 rounded font-mono text-xs space-y-1">
                <div>&bull; Multi-agent consensus debate scoring eliminating evaluator bias</div>
                <div>&bull; Asynchronous token-bucket rate limiter with zero dropped 429 requests</div>
                <div>&bull; Pydantic v2 runtime schema enforcement for guaranteed structured output</div>
                <div>&bull; Multimodal bounding-box, OCR, and reasoning regression verification</div>
              </div>
              <a href="https://github.com/shiv677" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                <Github size={14} /> Open Repository <ExternalLink size={12} />
              </a>
            </div>
          );
        } else {
          output = (
            <div className="text-xs text-muted-foreground font-mono">
              Project not found. Available names: <span className="text-foreground">audio</span>, <span className="text-foreground">t2nas</span>, <span className="text-foreground">rsync</span>, <span className="text-foreground">ai</span>.
            </div>
          );
        }
        break;

      case 'resume':
      case 'cv': {
        output = (
          <div className="space-y-2 font-mono text-xs sm:text-sm">
            <p className={`${t.prompt} font-bold`}>Downloading SHIVANSH_DIMRI_CV.pdf ...</p>
            <p className="text-muted-foreground text-xs">
              File: <span className="text-foreground font-semibold">SHIVANSH_DIMRI_CV.pdf</span> (Updated November 2026)
            </p>
            <a
              href="/SHIVANSH_DIMRI_CV.pdf"
              download
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 transition-colors text-xs font-semibold"
            >
              <Download size={14} />
              Click here if download did not trigger automatically
            </a>
          </div>
        );
        // Trigger download
        const link = document.createElement('a');
        link.href = '/SHIVANSH_DIMRI_CV.pdf';
        link.download = 'SHIVANSH_DIMRI_CV.pdf';
        link.click();
        break;
      }

      case 'contact':
      case 'email':
        output = (
          <div className="space-y-3 font-mono text-xs sm:text-sm">
            <p className={`${t.highlight} font-bold`}>=== GET IN TOUCH ===</p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-3">
                <Mail size={14} className={t.accent} />
                <span className="text-muted-foreground w-20">Email:</span>
                <a href="mailto:dimrishiv933@gmail.com" className="text-foreground hover:text-primary transition-colors">
                  dimrishiv933@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={14} className={t.accent} />
                <span className="text-muted-foreground w-20">WhatsApp:</span>
                <a href="https://wa.me/918957543247" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary transition-colors">
                  +91 8957543247
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Github size={14} className={t.accent} />
                <span className="text-muted-foreground w-20">GitHub:</span>
                <a href="https://github.com/shiv677" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary transition-colors">
                  github.com/shiv677
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Linkedin size={14} className={t.accent} />
                <span className="text-muted-foreground w-20">LinkedIn:</span>
                <a href="https://www.linkedin.com/in/shivansh-dimri-27820b268" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary transition-colors">
                  linkedin.com/in/shivansh-dimri-27820b268
                </a>
              </div>
            </div>
          </div>
        );
        break;

      case 'theme':
        if (args && (args in themes)) {
          setTheme(args as ThemeName);
          output = <p className="text-xs font-mono text-foreground">Theme switched to <span className={t.accent}>{args}</span>.</p>;
        } else {
          output = (
            <div className="text-xs font-mono space-y-1">
              <p className="text-foreground">Available themes:</p>
              <p className="text-muted-foreground">
                dracula &middot; matrix &middot; cyberpunk &middot; onedark &middot; amber
              </p>
              <p className="text-xs text-muted-foreground">Usage: <code className="text-foreground">theme dracula</code></p>
            </div>
          );
        }
        break;

      case 'matrix':
        setMatrixActive((prev) => !prev);
        output = <p className="text-xs font-mono text-foreground">Matrix rain mode toggled {matrixActive ? 'OFF' : 'ON'}.</p>;
        break;

      case 'gui':
      case 'web':
        if (onSwitchToGui) {
          onSwitchToGui();
          output = <p className="text-xs font-mono text-foreground">Switching to Visual GUI mode...</p>;
        } else {
          output = <p className="text-xs font-mono text-foreground">Click the GUI toggle button on the header to switch view modes.</p>;
        }
        break;

      case 'clear':
      case 'cls':
        setHistory([]);
        return;

      case 'sudo':
        output = (
          <p className="text-xs font-mono text-red-400">
            Permission denied: User `guest` is not in the sudoers file. This incident will be reported to Shivansh. 😉
          </p>
        );
        break;

      default:
        output = (
          <div className="text-xs font-mono space-y-1">
            <p className="text-red-400">Command not recognized: <span className="text-foreground">{command}</span></p>
            <p className="text-muted-foreground">Type <code className={`${t.prompt} font-bold`}>help</code> for a list of valid commands.</p>
          </div>
        );
        break;
    }

    setHistory((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        command: rawCmd,
        output,
      },
    ]);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIndex);
        setInput(commandHistory[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const nextIndex = historyIndex + 1;
        if (nextIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(nextIndex);
          setInput(commandHistory[nextIndex]);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const available = ['help', 'about', 'experience', 'projects', 'skills', 'resume', 'contact', 'theme', 'clear', 'matrix', 'gui'];
      const match = available.find((c) => c.startsWith(input.toLowerCase().trim()));
      if (match) {
        setInput(match);
      }
    }
  };

  const quickCommands = ['help', 'about', 'experience', 'projects', 'skills', 'resume', 'contact', 'matrix'];

  return (
    <div
      className={`relative w-full ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none h-screen'
          : 'max-w-5xl mx-auto rounded-2xl h-[750px] shadow-2xl my-6'
      } border ${t.border} ${t.bg} backdrop-blur-xl flex flex-col overflow-hidden transition-all duration-300 font-mono`}
    >
      {/* Matrix Canvas Overlay */}
      {matrixActive && (
        <canvas
          ref={matrixCanvasRef}
          className="absolute inset-0 pointer-events-none opacity-20 z-0"
        />
      )}

      {/* Terminal Window Header Bar */}
      <div className={`px-4 py-3 ${t.headerBg} border-b ${t.border} flex items-center justify-between z-10 select-none`}>
        {/* Left window buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHistory([])}
            className="w-3 h-3 rounded-full bg-[#ff5f56] hover:brightness-125 transition-all cursor-pointer"
            title="Clear terminal"
          />
          <button
            onClick={() => setMatrixActive(!matrixActive)}
            className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:brightness-125 transition-all cursor-pointer"
            title="Toggle Matrix Mode"
          />
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="w-3 h-3 rounded-full bg-[#27c93f] hover:brightness-125 transition-all cursor-pointer"
            title="Toggle Fullscreen"
          />
          <span className="ml-3 text-xs text-muted-foreground flex items-center gap-1.5 hidden sm:flex">
            <TerminalIcon size={12} className={t.accent} />
            <span>shivansh@ai-core: ~/portfolio (zsh)</span>
          </span>
        </div>

        {/* Center Title (Mobile) */}
        <span className="text-xs text-muted-foreground sm:hidden font-mono">
          shivansh@ai-core
        </span>

        {/* Right Action buttons */}
        <div className="flex items-center gap-3">
          {/* Theme switcher pill */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground">
            <span>theme:</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as ThemeName)}
              className="bg-background/50 border border-border/40 rounded px-1.5 py-0.5 text-xs text-foreground cursor-pointer focus:outline-none"
            >
              <option value="cyberpunk">cyberpunk</option>
              <option value="matrix">matrix</option>
              <option value="dracula">dracula</option>
              <option value="onedark">onedark</option>
              <option value="amber">amber</option>
            </select>
          </div>

          {/* Switch to GUI mode */}
          {onSwitchToGui && (
            <button
              onClick={onSwitchToGui}
              className="px-2.5 py-1 rounded bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 transition-all text-xs font-sans font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <span>Visual GUI</span>
            </button>
          )}

          {/* Fullscreen button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 z-10 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {history.map((item) => (
          <div key={item.id} className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-mono">
              <span className={`${t.prompt} font-bold`}>shivansh@ai-core:~$</span>
              <span className="text-foreground font-semibold">{item.command}</span>
            </div>
            <div className="pl-4 sm:pl-6">{item.output}</div>
          </div>
        ))}

        {/* Active Command Input Line */}
        <div className="flex items-center gap-2 text-xs sm:text-sm font-mono pt-1">
          <span className={`${t.prompt} font-bold shrink-0`}>shivansh@ai-core:~$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-foreground font-mono placeholder:text-muted-foreground/40 text-xs sm:text-sm p-0 m-0"
            placeholder="type 'help' or any command..."
            autoFocus
            spellCheck={false}
          />
        </div>

        <div ref={terminalEndRef} />
      </div>

      {/* Quick Action Footer Chips */}
      <div className={`px-4 py-2.5 ${t.headerBg} border-t ${t.border} z-10 flex items-center justify-between gap-2 overflow-x-auto select-none`}>
        <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
          <span className="text-[11px] text-muted-foreground mr-1 hidden sm:inline">shortcuts:</span>
          {quickCommands.map((cmd) => (
            <button
              key={cmd}
              onClick={() => executeCommand(cmd)}
              className="px-2 py-0.5 rounded text-[11px] font-mono bg-background/50 hover:bg-primary/20 text-muted-foreground hover:text-foreground border border-border/40 transition-colors cursor-pointer shrink-0"
            >
              {cmd}
            </button>
          ))}
        </div>

        <button
          onClick={() => setHistory([])}
          className="text-muted-foreground hover:text-foreground p-1 transition-colors shrink-0"
          title="Clear screen"
        >
          <RotateCcw size={13} />
        </button>
      </div>
    </div>
  );
};

export default TerminalPortfolio;
