import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command } from 'lucide-react';

const ShortcutHint = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
    
    // Hide after 8 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 8000);

    // Also hide on first scroll
    const handleScroll = () => {
      setIsVisible(false);
    };

    window.addEventListener('scroll', handleScroll, { once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleClick = () => {
    // Trigger command palette
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: isMac,
      ctrlKey: !isMac,
      bubbles: true,
    });
    window.dispatchEvent(event);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          onClick={handleClick}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3 py-2 rounded-full glass-strong border border-border/50 text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors duration-200 cursor-pointer"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/50 font-mono">
            {isMac ? (
              <>
                <Command size={10} />
                <span>K</span>
              </>
            ) : (
              <span>Ctrl+K</span>
            )}
          </span>
          <span>Quick navigation</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ShortcutHint;
