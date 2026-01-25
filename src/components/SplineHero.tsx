'use client';

import { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Download, MapPin, Fuel, ShoppingBag, Cloud } from 'lucide-react';
import Button from '@/components/Button';

// Lazy load Spline to avoid SSR issues
const Spline = lazy(() => import('@splinetool/react-spline'));

const SplineHero = () => {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Spline 3D Background */}
      <div className="absolute inset-0 z-0">
        <Suspense
          fallback={
            <div className="w-full h-full bg-background flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <Spline
            scene="https://prod.spline.design/aPcEaLcCpiXDoQMr/scene.splinecode"
            className="w-full h-full"
          />
        </Suspense>
      </div>

      {/* Dark Overlay for text readability */}
      <div className="absolute inset-0 z-10 bg-black/55 pointer-events-none" />

      {/* Foreground Content */}
      <div className="relative z-20 h-full flex items-center">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            {/* Meta line */}
            <motion.div
              className="flex items-center gap-2 text-white/70 text-sm mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <MapPin size={14} className="text-primary" />
              <span>Kanpur, India · Open to freelance & full-time roles</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              className="text-display-xl font-display font-bold tracking-tight text-white mb-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <motion.span
                className="inline-block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                Shivansh
              </motion.span>{' '}
              <motion.span
                className="inline-block text-gradient glow-text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                Dimri
              </motion.span>
            </motion.h1>

            {/* Title */}
            <motion.p
              className="text-display-sm font-display text-white/80 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              Web Developer | WordPress & Next.js Specialist
            </motion.p>

            {/* Credibility */}
            <motion.div
              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-base text-white/60 font-medium mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }}
            >
              <span>Worked with global clients across</span>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="inline-flex items-center gap-1.5 text-primary">
                  <Fuel size={16} />
                  <span className="text-sm">Petroleum</span>
                </span>
                <span className="text-white/30">·</span>
                <span className="inline-flex items-center gap-1.5 text-primary">
                  <ShoppingBag size={16} />
                  <span className="text-sm">E-commerce</span>
                </span>
                <span className="text-white/30">·</span>
                <span className="inline-flex items-center gap-1.5 text-primary">
                  <Cloud size={16} />
                  <span className="text-sm">SaaS</span>
                </span>
              </div>
            </motion.div>

            {/* Description */}
            <motion.p
              className="text-lg text-white/70 max-w-xl leading-relaxed mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              I design and build fast, clean, production-ready websites that scale.
              Focused on clarity, performance, and real-world usability.
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              <Link to="/work">
                <Button variant="primary" size="lg" data-cursor="View">
                  View Selected Work
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <a href="/SHIVANSH_DIMRI_CV.pdf" download>
                <Button variant="outline" size="lg" data-cursor="Download">
                  <Download size={18} />
                  Download Resume
                </Button>
              </a>
            </motion.div>

            {/* Micro-copy */}
            <motion.p
              className="text-sm text-white/40 mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              Available for freelance & full-time roles
            </motion.p>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          delay: 1.5,
          repeat: Infinity,
          repeatType: 'reverse',
          repeatDelay: 1,
        }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
          <motion.div
            className="w-1 h-2 rounded-full bg-primary"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </section>
  );
};

export default SplineHero;
