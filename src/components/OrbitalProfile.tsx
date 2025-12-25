import { motion, useReducedMotion } from 'framer-motion';
import profilePhoto from '@/assets/profile-photo.jpg';

const OrbitalProfile = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative flex items-center justify-center">
      {/* Subtle radial gradient background */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(180, 20%, 15%, 0.3) 0%, transparent 70%)',
        }}
      />

      {/* Outer ring - rotating cyan accent */}
      <motion.div
        className="absolute rounded-full border border-primary/10"
        style={{
          width: 'calc(100% + 48px)',
          height: 'calc(100% + 48px)',
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        viewport={{ once: true }}
        animate={shouldReduceMotion ? {} : { rotate: 360 }}
        {...(!shouldReduceMotion && {
          transition: {
            rotate: {
              duration: 22,
              repeat: Infinity,
              ease: 'linear',
            },
            opacity: { duration: 0.8, delay: 0.2 },
            scale: { duration: 0.8, delay: 0.2 },
          },
        })}
      />

      {/* Inner ring - static gray */}
      <motion.div
        className="absolute rounded-full border border-muted-foreground/15"
        style={{
          width: 'calc(100% + 24px)',
          height: 'calc(100% + 24px)',
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
        viewport={{ once: true }}
      />

      {/* Profile image container */}
      <motion.div
        className="relative w-64 h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 rounded-full overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        viewport={{ once: true }}
      >
        <img
          src={profilePhoto}
          alt="Shivansh Dimri - Developer"
          className="w-full h-full object-cover object-top"
          loading="eager"
        />
      </motion.div>
    </div>
  );
};

export default OrbitalProfile;
