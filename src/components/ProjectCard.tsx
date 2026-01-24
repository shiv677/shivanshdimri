import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface ProjectCardProps {
  children: React.ReactNode;
  className?: string;
}

const ProjectCard = ({ children, className = '' }: ProjectCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [spotlightX, setSpotlightX] = useState(50);
  const [spotlightY, setSpotlightY] = useState(50);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    // Calculate rotation (max 8 degrees)
    const maxRotation = 8;
    const rotX = (mouseY / (rect.height / 2)) * -maxRotation;
    const rotY = (mouseX / (rect.width / 2)) * maxRotation;
    
    setRotateX(rotX);
    setRotateY(rotY);

    // Calculate spotlight position (percentage)
    const spotX = ((e.clientX - rect.left) / rect.width) * 100;
    const spotY = ((e.clientY - rect.top) / rect.height) * 100;
    setSpotlightX(spotX);
    setSpotlightY(spotY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setSpotlightX(50);
    setSpotlightY(50);
  };

  return (
    <motion.div
      ref={cardRef}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
      animate={{
        rotateX,
        rotateY,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
    >
      {/* Spotlight overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${spotlightX}% ${spotlightY}%, hsl(var(--primary) / 0.15) 0%, transparent 50%)`,
        }}
      />
      
      {/* Content */}
      <div style={{ transform: 'translateZ(20px)' }}>
        {children}
      </div>

      {/* Shine effect on hover */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(105deg, transparent 40%, hsl(var(--primary) / 0.05) 45%, hsl(var(--primary) / 0.1) 50%, hsl(var(--primary) / 0.05) 55%, transparent 60%)`,
          transform: `translateX(${(spotlightX - 50) * 2}%)`,
        }}
      />
    </motion.div>
  );
};

export default ProjectCard;
