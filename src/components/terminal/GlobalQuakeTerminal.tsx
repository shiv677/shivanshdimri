import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal as TerminalIcon } from 'lucide-react';
import TerminalPortfolio from './TerminalPortfolio';
import { soundEngine } from '../activetheory/SoundEngine';

export const openQuakeTerminal = () => {
  window.dispatchEvent(new CustomEvent('open-terminal'));
};

export const closeQuakeTerminal = () => {
  window.dispatchEvent(new CustomEvent('close-terminal'));
};

export const toggleQuakeTerminal = () => {
  window.dispatchEvent(new CustomEvent('toggle-terminal'));
};

export const GlobalQuakeTerminal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => {
      soundEngine.playClick(920);
      setIsOpen(true);
    };

    const handleClose = () => {
      soundEngine.playClick(500);
      setIsOpen(false);
    };

    const handleToggle = () => {
      setIsOpen((prev) => {
        soundEngine.playClick(prev ? 500 : 920);
        return !prev;
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl as HTMLElement)?.isContentEditable;

      // Backtick or Tilde hotkey toggles terminal
      if (e.key === '`' || e.key === '~') {
        if (isOpen) {
          e.preventDefault();
          handleClose();
        } else if (!isInput) {
          e.preventDefault();
          handleOpen();
        }
      }

      // Escape key closes terminal when open
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('open-terminal', handleOpen);
    window.addEventListener('close-terminal', handleClose);
    window.addEventListener('toggle-terminal', handleToggle);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('open-terminal', handleOpen);
      window.removeEventListener('close-terminal', handleClose);
      window.removeEventListener('toggle-terminal', handleToggle);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      {/* Floating Cyber HUD Pill (Bottom-Right) */}
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 select-none pointer-events-auto">
        <button
          onClick={() => {
            if (isOpen) {
              soundEngine.playClick(500);
              setIsOpen(false);
            } else {
              soundEngine.playClick(920);
              setIsOpen(true);
            }
          }}
          onMouseEnter={() => soundEngine.playHover()}
          className="px-3.5 py-1.5 rounded-full border border-cyan-400/40 hover:border-cyan-400 bg-[#060814]/85 hover:bg-[#0c1024]/95 text-cyan-300 backdrop-blur-xl shadow-[0_0_20px_rgba(0,240,255,0.15)] hover:shadow-[0_0_30px_rgba(0,240,255,0.35)] transition-all duration-300 flex items-center gap-2 group cursor-pointer text-xs font-mono"
          title="Toggle Quake CLI Terminal [ ` ]"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
          </span>
          <TerminalIcon size={13} className="text-cyan-400 group-hover:rotate-12 transition-transform" />
          <span className="tracking-[0.16em] font-semibold text-[11px] text-white/90 group-hover:text-cyan-300 transition-colors">
            &gt;_ TERMINAL // SHIV-OS
          </span>
          <span className="px-1.5 py-0.5 rounded bg-cyan-400/10 border border-cyan-400/30 text-[10px] text-cyan-300 font-mono">
            `
          </span>
        </button>
      </div>

      {/* Quake-Style Pull-Down Terminal Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-md select-text overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                soundEngine.playClick(500);
                setIsOpen(false);
              }
            }}
          >
            <motion.div
              initial={{ y: -60, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -60, opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-full max-w-5xl my-auto"
            >
              {/* Quake Status Bar */}
              <div className="flex items-center justify-between px-4 py-1.5 bg-black/90 border border-cyan-400/40 border-b-0 rounded-t-2xl text-[11px] font-mono text-cyan-300 select-none">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="font-bold tracking-wider">[CLI // SHIV-OS v2.4 (QUAKE CONSOLE)]</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline text-white/40 text-[10px]">
                    HOTKEY: <kbd className="px-1 py-0.5 rounded bg-white/10 text-cyan-300 font-mono">`</kbd> OR <kbd className="px-1 py-0.5 rounded bg-white/10 text-cyan-300 font-mono">ESC</kbd>
                  </span>
                  <button
                    onClick={() => {
                      soundEngine.playClick(500);
                      setIsOpen(false);
                    }}
                    className="p-1 rounded text-cyan-400 hover:text-white hover:bg-cyan-400/20 transition-colors cursor-pointer"
                    title="Close Terminal [ESC]"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Terminal Viewport */}
              <div className="rounded-b-2xl overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.2)]">
                <TerminalPortfolio onSwitchToGui={() => setIsOpen(false)} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GlobalQuakeTerminal;
