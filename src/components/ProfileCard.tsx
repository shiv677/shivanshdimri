import { motion, useReducedMotion } from 'framer-motion';
import profilePhoto from '@/assets/profile-photo.jpg';

const ProfileCard = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="relative w-full max-w-xs mx-auto lg:mx-0"
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      viewport={{ once: true }}
    >
      {/* Card container with subtle surface */}
      <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-surface-dark">
        <img
          src={profilePhoto}
          alt="Shivansh Dimri - Developer"
          className="w-full h-full object-cover object-top"
          loading="eager"
        />
      </div>
    </motion.div>
  );
};

export default ProfileCard;
