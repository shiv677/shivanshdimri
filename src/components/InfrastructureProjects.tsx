import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ExternalLink, Github, Terminal, Shield, Cpu, Database } from 'lucide-react';
import AnimatedSection from '@/components/AnimatedSection';

interface ValidationItem {
  label: string;
  value: string;
}

interface InfraProject {
  title: string;
  positioning: string;
  overview: string;
  github: string;
  folderStructure: string;
  coreConcepts: string[];
  validation: ValidationItem[];
  icon: typeof Terminal;
}

const projects: InfraProject[] = [
  {
    title: 'Code Security Auditor: Multilingual CVE/CWE Vulnerability Engine',
    positioning: 'Fine-tuned Qwen2.5-Coder-1.5B-Instruct LoRA vulnerability detection, exploit analysis, and automated patching engine live on Hugging Face Hub.',
    overview: 'An autonomous multilingual security auditing model and CLI pipeline fine-tuned via Low-Rank Adaptation (LoRA r=16, alpha=32 across all 7 linear projections) in native bfloat16 on an NVIDIA RTX 5070 (PyTorch 2.11+cu128). Trained on 4,568 curated 3-turn ChatML CVE/CWE traces and evaluated on 240 stratified holdout records across Rust, Java, Ruby, PHP, Python, C/C++, Go, JavaScript, and Solidity. Accurately maps MITRE CWE identifiers, scores CVSS severity, explains exploit vectors, and synthesizes remediated patches.',
    github: 'https://github.com/shiv677/code-security-auditor',
    folderStructure: `code-security-auditor/
├── dataset/
│   ├── build_multilingual_dataset.py
│   ├── train_dataset_multilingual.jsonl
│   └── eval_dataset_multilingual.jsonl
├── scripts/
│   ├── train_lora.py
│   ├── audit.py
│   └── push_to_hub.py
├── tests/
│   └── test_auditor.py
└── README.md`,
    coreConcepts: [
      'Qwen2.5-Coder-1.5B LoRA / PEFT (r=16, alpha=32)',
      '4,568+ Multilingual ChatML CVE/CWE Traces',
      'PyTorch 2.11+cu128 bfloat16 RTX 5070 Training',
      'MITRE CWE Mapping & Exploit Vector Analysis',
      'Automated Secure Patch Synthesis',
      'Hugging Face Hub Model Deployment',
    ],
    validation: [
      { label: 'Dataset scale verified', value: '4,568 ChatML training traces + 240 holdout evaluation traces' },
      { label: 'Training convergence', value: '0.04948 final loss in native bfloat16 on NVIDIA RTX 5070' },
      { label: 'Multilingual audit accuracy', value: 'Verified across Rust unsafe FFI, Java JNDI, Ruby YAML, PHP POP, Python/C/Go/Solidity' },
      { label: 'Hugging Face Hub release', value: 'huggingface.co/shivanshDIMRI/code-security-auditor-qwen (4/4 test suite passing)' },
    ],
    icon: Shield,
  },
  {
    title: 'Audio Internal & External Duplicacy Checker',
    positioning: 'Deterministic fingerprint-based audio deduplication system preventing redundant database insertion across vendor batches.',
    overview: 'A batch-processing pipeline that generates hash-based audio fingerprints, performs internal duplicate detection (within batch), cross-batch validation (against historical datasets), and ensures database-safe insertion. Designed with multiprocessing execution, structured CSV outputs, and deterministic validation logic to preserve metric integrity.',
    github: 'https://github.com/shiv677/Audio-Internal-External-Duplicacy-Checker',
    folderStructure: `Audio-Internal-External-Duplicacy-Checker/
├── generateFingerprints.py
├── detectDuplicates.py
├── utils/
├── sample_batches/
├── output_fingerprints/
└── README.md`,
    coreConcepts: [
      'Hash-based fingerprinting',
      'Internal & cross-batch validation',
      'Multiprocessing execution',
      'Database-first integrity enforcement',
      'Structured CSV pipelines',
    ],
    validation: [
      { label: 'Max dataset tested', value: 'Production-scale batch volumes' },
      { label: 'Resume simulation', value: 'Validated' },
      { label: 'Memory peak observed', value: 'Within safe thresholds' },
      { label: 'Failure scenarios', value: 'Corrupt file handling, duplicate injection test, concurrent batch execution' },
    ],
    icon: Database,
  },
  {
    title: 'T2NAS – Production Parallel NAS Transfer Tool',
    positioning: 'CPU-aware, resumable high-volume file migration system optimised for NAS and local transfers.',
    overview: 'A parallelised transfer engine that segments large datasets into controlled batches and dynamically scales workers based on available CPU cores (CPU count − 1 strategy). Supports SHA-256 verification, resumable execution via checkpoint state tracking, structured logging, and controlled memory footprint to prevent RAM exhaustion during large-scale transfers.',
    github: 'https://github.com/shiv677/T2NAS',
    folderStructure: `T2NAS/
├── Filetransfer.py
├── transferEngine/
├── logs/
├── checkpoint_state.json
├── requirements.txt
└── README.md`,
    coreConcepts: [
      'Core-aware worker scaling',
      'Batch segmentation architecture',
      'Chunk-level transfer control',
      'Checkpoint-based resumability',
      'SHA-256 integrity verification',
      'Memory-safe execution',
    ],
    validation: [
      { label: 'Max dataset tested', value: 'Large-scale NAS volumes' },
      { label: 'Resume simulation', value: 'Interrupted mid-transfer and resumed' },
      { label: 'Memory peak observed', value: 'Controlled under memory ceiling' },
      { label: 'Failure scenarios', value: 'Network drop simulation, forced process kill, checksum mismatch detection' },
    ],
    icon: Cpu,
  },
  {
    title: 'Enterprise Rsync Transfer Platform',
    positioning: 'Self-contained enterprise-grade rsync orchestration system with reliability hardening and embedded runtime.',
    overview: 'A Windows-based standalone executable integrating embedded rsync and OpenSSH runtimes. Acts as an orchestration layer for subprocess-managed transfers across local, remote SSH, VPN, and cloud environments. Includes retry logic, SSH keep-alives, queue-based execution, checksum validation, role-based access control with secure hashing, and real-time progress parsing.',
    github: 'https://github.com/shiv677/sync_tool',
    folderStructure: `sync_tool/
├── main.py
├── gui/
├── executor/
├── auth/
├── config/
├── embedded_runtime/
├── requirements.txt
└── README.md`,
    coreConcepts: [
      'Embedded runtime packaging (rsync + SSH)',
      'Subprocess streaming with live progress parsing',
      'Queue-based execution engine',
      'Retry & keep-alive fault tolerance',
      'Role-based access control',
      'Checksum validation',
    ],
    validation: [
      { label: 'Max dataset tested', value: 'Enterprise-scale verified' },
      { label: 'Resume simulation', value: 'SSH interruption recovery validated' },
      { label: 'Memory peak observed', value: 'Stable under sustained load' },
      { label: 'Failure scenarios', value: 'VPN drop test, forced retry exhaustion, authentication failure handling' },
    ],
    icon: Shield,
  },
];

const ProjectCard = ({ project, index }: { project: InfraProject; index: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = project.icon;

  return (
    <AnimatedSection delay={index * 0.15}>
      <motion.div
        className="border border-border/40 rounded-xl bg-card/30 backdrop-blur-sm overflow-hidden hover:border-primary/30 transition-colors duration-300"
        whileHover={{ scale: 1.005, transition: { duration: 0.2 } }}
      >
        {/* Header – always visible */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-left px-6 py-5 flex items-start gap-4 group cursor-pointer"
        >
          <motion.div
            className="mt-1 p-2 rounded-lg bg-primary/10 text-primary shrink-0"
            whileHover={{ rotate: 8, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            <Icon size={20} />
          </motion.div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-display font-bold text-foreground group-hover:text-primary transition-colors">
              {project.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {project.positioning}
            </p>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="mt-2 text-muted-foreground shrink-0"
          >
            <ChevronDown size={18} />
          </motion.div>
        </button>

        {/* Expandable content */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 space-y-6 border-t border-border/20 pt-5">
                {/* Technical Overview */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05, duration: 0.4 }}
                >
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                    Technical Overview
                  </h4>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {project.overview}
                  </p>
                </motion.div>

                {/* GitHub */}
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                >
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                  >
                    <Github size={16} />
                    View Repository
                    <ExternalLink size={14} />
                  </a>
                </motion.div>

                {/* Folder Structure */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                >
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                    Project Structure
                  </h4>
                  <pre className="text-xs text-primary/80 bg-background/60 border border-border/30 rounded-lg p-4 font-mono overflow-x-auto">
                    {project.folderStructure}
                  </pre>
                </motion.div>

                {/* Core Concepts */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                    Core Technologies & Architecture
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {project.coreConcepts.map((concept, i) => (
                      <motion.span
                        key={concept}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.25 + i * 0.04, duration: 0.3 }}
                        className="px-3 py-1.5 rounded-full bg-primary/5 border border-primary/15 text-xs font-medium text-foreground/80"
                      >
                        {concept}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>

                {/* Validation & Stress Testing */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Shield size={14} className="text-primary" />
                    Validation & Stress Testing
                  </h4>
                  <div className="grid gap-2">
                    {project.validation.map((item, i) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 + i * 0.05, duration: 0.35 }}
                        className="flex gap-3 text-sm bg-background/40 rounded-lg px-4 py-2.5 border border-border/20"
                      >
                        <span className="text-muted-foreground font-medium shrink-0 min-w-[180px]">
                          {item.label}
                        </span>
                        <span className="text-foreground/80">{item.value}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatedSection>
  );
};

const InfrastructureProjects = () => {
  return (
    <section className="pb-20" id="backend">
      <div className="container mx-auto px-6">
        <AnimatedSection>
          <div className="mb-12 pt-8 border-t border-primary/20">
            <div className="flex items-center gap-3 mb-1">
              <Terminal size={22} className="text-primary" />
              <h2 className="text-display-sm font-display font-bold">
                Systems Reliability & Data{' '}
                <span className="text-gradient">Infrastructure</span>
              </h2>
            </div>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Backend infrastructure tools built for deterministic behaviour,
              fault tolerance, and production-grade data integrity.
            </p>
          </div>
        </AnimatedSection>

        <div className="space-y-4">
          {projects.map((project, index) => (
            <ProjectCard key={project.title} project={project} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default InfrastructureProjects;
