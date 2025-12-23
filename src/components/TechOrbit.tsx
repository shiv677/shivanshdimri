import { motion } from 'framer-motion';

const technologies = [
  { name: 'React', color: 'hsl(190, 95%, 60%)' },
  { name: 'Next.js', color: 'hsl(0, 0%, 90%)' },
  { name: 'TypeScript', color: 'hsl(210, 85%, 60%)' },
  { name: 'WordPress', color: 'hsl(200, 35%, 50%)' },
  { name: 'Tailwind', color: 'hsl(185, 85%, 55%)' },
  { name: 'Node.js', color: 'hsl(120, 45%, 50%)' },
];

const TechOrbit = () => {
  return (
    <div className="relative w-full h-full min-h-[400px] flex items-center justify-center">
      {/* Central glow */}
      <div className="absolute w-32 h-32 rounded-full bg-primary/20 blur-3xl" />
      
      {/* Orbiting tech pills */}
      {technologies.map((tech, index) => {
        const angle = (360 / technologies.length) * index;
        const delay = index * 0.5;
        
        return (
          <motion.div
            key={tech.name}
            className="absolute"
            style={{
              transformOrigin: 'center center',
            }}
            animate={{
              rotate: [angle, angle + 360],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: 'linear',
              delay,
            }}
          >
            <motion.div
              className="glass px-4 py-2 rounded-full text-sm font-medium"
              style={{
                transform: `translateX(${120 + index * 15}px)`,
                color: tech.color,
                boxShadow: `0 0 20px ${tech.color}20`,
              }}
              animate={{
                rotate: [-angle, -angle - 360],
              }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: 'linear',
                delay,
              }}
            >
              {tech.name}
            </motion.div>
          </motion.div>
        );
      })}

      {/* Floating glassmorphic panels */}
      <motion.div
        className="absolute top-1/4 right-0 glass-strong rounded-xl p-4 w-48"
        animate={{
          y: [0, -15, 0],
          rotate: [0, 2, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div className="text-xs text-muted-foreground mb-2">Latest Project</div>
        <div className="text-sm font-medium text-foreground">E-Commerce Platform</div>
        <div className="flex gap-1 mt-2">
          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs">Next.js</span>
          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs">Stripe</span>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-1/4 left-0 glass-strong rounded-xl p-4 w-44"
        animate={{
          y: [0, 10, 0],
          rotate: [0, -2, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      >
        <div className="text-xs text-muted-foreground mb-1">Code Quality</div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '92%' }}
            transition={{ duration: 2, delay: 1 }}
          />
        </div>
        <div className="text-xs text-primary mt-1">92%</div>
      </motion.div>

      <motion.div
        className="absolute top-1/2 left-1/4 glass-strong rounded-xl p-3"
        animate={{
          y: [0, -8, 0],
          x: [0, 5, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      >
        <code className="text-xs text-primary font-mono">
          {'const dev = "Shivansh";'}
        </code>
      </motion.div>
    </div>
  );
};

export default TechOrbit;
