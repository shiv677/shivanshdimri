import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider } from "./components/ThemeProvider";
import CommandPalette from "./components/CommandPalette";
import GlobalQuakeTerminal from "./components/terminal/GlobalQuakeTerminal";
import Home from "./pages/Home";
import ScrollToTop from "./components/ScrollToTop";

// Lazy-loaded routes for code-splitting
const Work = lazy(() => import("./pages/Work"));
const ArchitectureDocs = lazy(() => import("./pages/ArchitectureDocs"));
const About = lazy(() => import("./pages/About"));
const Experience = lazy(() => import("./pages/Experience"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Active Theory themed cyber loader fallback
const CyberLoader = () => (
  <div className="min-h-screen bg-[#020205] text-[#ededed] font-mono flex flex-col items-center justify-center relative overflow-hidden select-none">
    {/* Ambient cyber glow */}
    <div className="absolute w-[500px] h-[300px] bg-cyan-500/[0.08] blur-[120px] rounded-full pointer-events-none" />
    <div className="absolute w-[300px] h-[200px] bg-fuchsia-500/[0.04] blur-[100px] rounded-full pointer-events-none" />

    <div className="relative z-10 flex flex-col items-center gap-5">
      {/* Reticle / spinner box */}
      <div className="relative w-14 h-14 flex items-center justify-center">
        <div className="absolute inset-0 border border-cyan-500/20 rounded" />
        <div className="absolute inset-0 border-t border-r border-cyan-400 rounded animate-spin" />
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
      </div>

      {/* Cyber status telemetry */}
      <div className="flex flex-col items-center gap-1.5 text-center">
        <div className="text-xs tracking-[0.25em] text-cyan-400 uppercase font-semibold flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
          <span>INITIALIZING SECTOR // DECRYPTING ASSETS</span>
        </div>
        <div className="text-[10px] tracking-widest text-zinc-500 uppercase font-mono">
          [ SYS_STATE: ROUTING // BUFFER: STREAMING ]
        </div>
      </div>
    </div>
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Suspense fallback={<CyberLoader />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/work" element={<Work />} />
          <Route path="/architecture" element={<ArchitectureDocs />} />
          <Route path="/about" element={<About />} />
          <Route path="/experience" element={<Experience />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

const App = () => (
  <ThemeProvider
    attribute="class"
    defaultTheme="dark"
    enableSystem
    disableTransitionOnChange={false}
    storageKey="portfolio-theme"
  >
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <CommandPalette />
          <GlobalQuakeTerminal />
          <AnimatedRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
