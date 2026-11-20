import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  children: ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
  },
  enter: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

const PageTransition = ({ children }: PageTransitionProps) => {
  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
