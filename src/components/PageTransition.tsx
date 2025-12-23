import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  children: ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    rotateY: -90,
    scale: 0.9,
  },
  enter: {
    opacity: 1,
    rotateY: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.23, 1, 0.32, 1],
      opacity: { duration: 0.35, ease: 'easeOut' },
      rotateY: { duration: 0.6, ease: [0.23, 1, 0.32, 1] },
      scale: { duration: 0.5, ease: [0.23, 1, 0.32, 1] },
    },
  },
  exit: {
    opacity: 0,
    rotateY: 90,
    scale: 0.9,
    transition: {
      duration: 0.5,
      ease: [0.23, 1, 0.32, 1],
      opacity: { duration: 0.3, ease: 'easeIn' },
    },
  },
};

const PageTransition = ({ children }: PageTransitionProps) => {
  return (
    <div style={{ perspective: 1200 }}>
      <motion.div
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
        style={{ 
          transformOrigin: 'center center',
          transformStyle: 'preserve-3d',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PageTransition;
