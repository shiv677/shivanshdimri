import { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

interface CursorState {
  isHovering: boolean;
  text: string;
}

const CustomCursor = () => {
  const [cursorState, setCursorState] = useState<CursorState>({
    isHovering: false,
    text: '',
  });
  const [isVisible, setIsVisible] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 400 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Check if it's a touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    // Add event listeners for interactive elements
    const addHoverListeners = () => {
      const interactiveElements = document.querySelectorAll(
        'a, button, [data-cursor], input, textarea'
      );

      interactiveElements.forEach((el) => {
        el.addEventListener('mouseenter', () => {
          const cursorText = el.getAttribute('data-cursor') || '';
          const tagName = el.tagName.toLowerCase();
          let text = cursorText;

          if (!text) {
            if (tagName === 'a') text = 'Open';
            else if (tagName === 'button') {
              if (el.textContent?.toLowerCase().includes('resume')) text = 'Download';
              else if (el.textContent?.toLowerCase().includes('view')) text = 'View';
              else text = 'Click';
            }
          }

          setCursorState({ isHovering: true, text });
        });

        el.addEventListener('mouseleave', () => {
          setCursorState({ isHovering: false, text: '' });
        });
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.body.classList.add('custom-cursor-active');

    // Initial setup and mutation observer for dynamic content
    addHoverListeners();
    const observer = new MutationObserver(addHoverListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.body.classList.remove('custom-cursor-active');
      observer.disconnect();
    };
  }, [cursorX, cursorY]);

  // Hide on touch devices
  if (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
    return null;
  }

  return (
    <>
      {/* Main cursor dot */}
      <motion.div
        ref={cursorRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
        }}
      >
        <motion.div
          className="relative flex items-center justify-center"
          animate={{
            scale: cursorState.isHovering ? 1 : 1,
            width: cursorState.isHovering ? 80 : 12,
            height: cursorState.isHovering ? 80 : 12,
          }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          style={{
            marginLeft: cursorState.isHovering ? -40 : -6,
            marginTop: cursorState.isHovering ? -40 : -6,
          }}
        >
          <motion.div
            className="absolute rounded-full bg-foreground"
            animate={{
              width: cursorState.isHovering ? 80 : 12,
              height: cursorState.isHovering ? 80 : 12,
              opacity: isVisible ? (cursorState.isHovering ? 0.9 : 1) : 0,
            }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          />
          {cursorState.text && (
            <motion.span
              className="relative text-xs font-medium text-background uppercase tracking-wider"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              {cursorState.text}
            </motion.span>
          )}
        </motion.div>
      </motion.div>

      {/* Trailing cursor */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998]"
        style={{
          x: cursorX,
          y: cursorY,
        }}
      >
        <motion.div
          className="rounded-full border border-foreground/20"
          animate={{
            width: cursorState.isHovering ? 0 : 40,
            height: cursorState.isHovering ? 0 : 40,
            opacity: isVisible ? (cursorState.isHovering ? 0 : 0.5) : 0,
          }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          style={{
            marginLeft: -20,
            marginTop: -20,
          }}
        />
      </motion.div>
    </>
  );
};

export default CustomCursor;
