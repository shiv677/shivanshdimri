# Shivansh Dimri - Portfolio & Systems Engineering Showcase

[![Portfolio CI/CD](https://github.com/shiv677/shivanshdimri/actions/workflows/ci.yml/badge.svg)](https://github.com/shiv677/shivanshdimri/actions)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![Vite 5](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![Tests Passing](https://img.shields.io/badge/Pytest-159%20Passed-brightgreen.svg)](projects/)

Personal portfolio and systems engineering showcase for **Shivansh Dimri**, Associate AI Engineer. Demonstrates production-grade AI systems, autonomous agent trajectory evaluation harnesses, high-concurrency distributed data pipelines, semantic caching architectures, adversarial red-teaming probes, and a modern React 18 / TypeScript frontend.

---

## 🏛️ Flagship Systems & Core Architecture

The repository contains 10 production-grade backend and AI evaluation systems located in [`projects/`](projects/), covered by an end-to-end automated test suite:

| # | System | Key Capabilities & Architecture | Path |
|---|--------|----------------------------------|------|
| 1 | **Agentic Tool Calling & Trajectory Evaluator** | Evaluates multi-step autonomous agent execution paths for tool calling precision, fuzzy signature matching, argument hallucination detection, latency/cost accounting, and goal attainment rubrics. | [`projects/agentic_tool_eval_harness`](projects/agentic_tool_eval_harness) |
| 2 | **Dataset Quality & Integrity Sentinel** | Enterprise dataset integrity pipeline featuring Unicode NFKC canonical normalization, SHA-256 collision hashing, 64-bit SimHash near-duplicate clustering, and transactional audit ledgers with automated quarantine partitions. | [`projects/dataset_quality_sentinel`](projects/dataset_quality_sentinel) |
| 3 | **Distributed MapReduce Async Crawler** | Asynchronous research corpus crawler with per-domain rate limiting and concurrency semaphores, fault-tolerant SQLite task state machine (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `FAILED`), and deterministic HTML extraction. | [`projects/distributed_mapreduce_crawler`](projects/distributed_mapreduce_crawler) |
| 4 | **Distributed Token Bucket Rate Limiter** | Concurrency-safe, thread-safe asynchronous token bucket and sliding-window rate limiter for multi-tenant LLM inference providers with P0 priority scheduling, tier quotas (TPM/RPM), and jittered backoff. | [`projects/distributed_token_bucket_limiter`](projects/distributed_token_bucket_limiter) |
| 5 | **Local Graph RAG Subgraph Retriever** | Local Graph RAG engine featuring entity-relation extraction, inverted indexing, fuzzy resolution, cycle handling, bidirectional k-hop BFS subgraph traversal, edge weighting, and structured markdown prompt synthesis. | [`projects/graph_rag_subgraph_retriever`](projects/graph_rag_subgraph_retriever) |
| 6 | **Multimodal Feature Store & Vector Cache** | Semantic vector cache using multi-table Random Projection Locality-Sensitive Hashing (LSH) and cosine similarity to deduplicate high-cost Vision-Language Model (VLM) and LLM inference calls with LRU/LFU memory eviction. | [`projects/multimodal_feature_store_cache`](projects/multimodal_feature_store_cache) |
| 7 | **Multi-Agent Consensus Evaluation Engine** | Asynchronous multi-agent debate framework orchestrating specialized agents (`GroundingAgent`, `ReasoningCritic`, `SchemaSentinel`) with weighted consensus scoring, multi-round debate triggers, and human escalation. | [`projects/multi_agent_consensus_engine`](projects/multi_agent_consensus_engine) |
| 8 | **Synthetic Adversarial Jailbreak Probe** | Automated red-teaming tool auditing LLM guardrail robustness with deterministic mutations (Base64, ROT13, prefix injection, hypothetical framing, leetspeak), refusal classification, and canary leak detection. | [`projects/synthetic_adversarial_jailbreak_probe`](projects/synthetic_adversarial_jailbreak_probe) |
| 9 | **VLM Spatial Grounding Evaluator** | Spatial grounding benchmark framework for Vision-Language Models enforcing strict Pydantic v2 schemas, computing exact Intersection-over-Union (IoU), and generating normalized spatial accuracy rubrics. | [`projects/vlm_grounding_evaluator`](projects/vlm_grounding_evaluator) |
| 10 | **SQLite WAL Checkpoint Streamer** | High-concurrency batch processing worker pool utilizing SQLite Write-Ahead Logging (WAL) atomic checkpointing, dynamic `(CPU_COUNT - 1)` worker pool scaling, and bounded 4MB chunk streaming with O(1) memory ceiling. | [`projects/wal_checkpoint_streamer`](projects/wal_checkpoint_streamer) |

---

## 🔄 Automated CI/CD Pipeline

Continuous Integration is orchestrated via GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)):

- **Triggers**: Automated runs on every `push` and `pull_request` targeting the `main` branch.
- **Environment**: `ubuntu-latest`
- **Node.js Pipeline**:
  - Sets up Node.js 20 with npm caching.
  - Installs dependencies via `npm ci`.
  - Runs TypeScript strict static type checking: `npx tsc --noEmit`.
  - Builds the production Vite bundle: `npm run build`.
- **Python Pipeline**:
  - Sets up Python 3.12.
  - Installs testing dependencies: `pip install pytest pydantic`.
  - Executes the full test suite across all systems: `pytest projects/ -v` (159 unit & integration tests passing).

---

## 🚀 Technologies Used

### Frontend & UI
- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Tooling**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- **Animations & 3D**: [Framer Motion](https://www.framer.com/motion/) + [GSAP](https://gsap.com/) + [Three.js](https://threejs.org/)
- **State & Theme**: [next-themes](https://github.com/pacocoursey/next-themes)
- **Forms & Validation**: [Zod](https://zod.dev/) + [React Hook Form](https://react-hook-form.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend & Cloud
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Row-Level Security, Role-Based Access Control)
- **Deployment**: [Vercel](https://vercel.com/)
- **Python Runtime**: Python 3.12 + [Pydantic v2](https://docs.pydantic.dev/) + [Pytest](https://pytest.org/)

---

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v20 recommended, v18+ supported)
- [Python](https://www.python.org/) (v3.12 recommended)
- `npm`

### Installation & Run

1. **Clone the repository**:
   ```bash
   git clone https://github.com/shiv677/shivanshdimri.git
   cd shivanshdimri
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables** in `.env`:
   ```env
   VITE_SUPABASE_PROJECT_ID="your-project-id"
   VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   ```

4. **Run the local development server**:
   ```bash
   npm run dev
   ```

5. **Type check and build for production**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```

6. **Run Python test suite**:
   ```bash
   pip install pytest pydantic
   pytest projects/ -v
   ```

---

## 📁 Key Features

- **Interactive Architecture Demos**: Live interactive technical breakdown of audio deduplication pipelines, parallel NAS file transfer (T2NAS), enterprise rsync orchestration, and distributed rate limiting.
- **Interactive Command Palette**: Press `⌘K` or `Ctrl+K` for keyboard-driven navigation across sections and quick theme switching.
- **Dynamic Experience Tracker**: Automated career duration calculation from start date for up-to-date metrics.
- **Dark/Light Theme**: Persistent theme selection via `next-themes`.
- **Contact Form**: Direct Supabase database insertion secured with Postgres RLS policies.
