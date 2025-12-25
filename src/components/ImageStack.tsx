import { useState, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import profilePhoto1 from '@/assets/profile-photo.jpg';
import profilePhoto2 from '@/assets/profile-2.jpg';
import profilePhoto3 from '@/assets/profile-3.jpg';

const images = [profilePhoto1, profilePhoto2, profilePhoto3];

const ImageStack = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  const navigate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prev) => {
      if (newDirection > 0) {
        return prev === images.length - 1 ? 0 : prev + 1;
      }
      return prev === 0 ? images.length - 1 : prev - 1;
    });
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold) {
      navigate(-1);
    } else if (info.offset.x < -threshold) {
      navigate(1);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95,
    }),
  };

  const transition = prefersReducedMotion 
    ? { duration: 0 } 
    : { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Stack effect - back images */}
      <div className="relative aspect-[4/5] w-full">
        {/* Background stack layers */}
        {[2, 1].map((offset) => {
          const stackIndex = (currentIndex + offset) % images.length;
          return (
            <div
              key={`stack-${offset}`}
              className="absolute inset-0 rounded-xl overflow-hidden bg-muted"
              style={{
                transform: `translateY(${offset * 6}px) scale(${1 - offset * 0.02})`,
                opacity: 1 - offset * 0.2,
                zIndex: 10 - offset,
              }}
            >
              <img
                src={images[stackIndex]}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          );
        })}

        {/* Front image - interactive */}
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing z-20 bg-muted"
          >
            <img
              src={images[currentIndex]}
              alt={`Profile photo ${currentIndex + 1}`}
              className="w-full h-full object-cover"
              loading="eager"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows */}
      <div className="flex justify-center gap-4 mt-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors duration-200"
          aria-label="Previous image"
        >
          <ChevronLeft size={18} className="text-muted-foreground" />
        </button>
        <button
          onClick={() => navigate(1)}
          className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors duration-200"
          aria-label="Next image"
        >
          <ChevronRight size={18} className="text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

export default ImageStack;
