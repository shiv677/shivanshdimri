# Shivansh Dimri - Portfolio & Systems Engineering Showcase

Personal portfolio website for **Shivansh Dimri**, Associate AI Engineer. Showcases AI systems, benchmark evaluation workflows, Python data engineering pipelines, deduplication architectures, and production client web applications.

## 🚀 Technologies Used

- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) + [GSAP](https://gsap.com/)
- **Database & Backend**: [Supabase](https://supabase.com/) (Form submissions, Row-Level Security, Role-Based Access Control)
- **Forms & Validation**: [Zod](https://zod.dev/) + [React Hook Form](https://react-hook-form.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` or `bun`

### Installation

1. Clone or navigate to the project root:
   ```bash
   cd shivanshdimri-main
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:
   ```env
   VITE_SUPABASE_PROJECT_ID="your-project-id"
   VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   ```

4. Start the local development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

6. Lint codebase:
   ```bash
   npm run lint
   ```

## 📁 Key Features

- **Interactive Command Palette**: Press `⌘K` or `Ctrl+K` for keyboard-driven navigation across sections and quick theme switching.
- **Backend Architecture Demos**: Technical breakdown of multiprocessing audio deduplication, parallel NAS file transfer (T2NAS), and enterprise rsync orchestration.
- **Dynamic Experience Tracker**: Automated month/year calculation from start date for up-to-date career metrics.
- **Dark/Light Theme**: Persistent theme selection via `next-themes`.
- **Contact Form**: Direct Supabase database insertion secured with Postgres RLS policies.
