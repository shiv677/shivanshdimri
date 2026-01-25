import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Download, MapPin, Briefcase, Code2, Rocket, Users, Fuel, ShoppingBag, Cloud } from 'lucide-react';
import Layout from '@/components/Layout';
import AnimatedSection from '@/components/AnimatedSection';
import TechOrbit from '@/components/TechOrbit';
import Button from '@/components/Button';

import arkoseScreenshot from '@/assets/arkose-screenshot.png';
import arkoseBuildcomScreenshot from '@/assets/arkose-buildcom-screenshot.png';
import pearlsScreenshot from '@/assets/32pearls-screenshot.png';
import pitchandplayScreenshot from '@/assets/pitchandplay-screenshot.png';

const proofPoints = [
  { icon: Rocket, value: '10+', label: 'Projects Delivered' },
  { icon: Briefcase, value: '6 Mo', label: 'Professional Experience' },
  { icon: Users, value: '5+', label: 'Satisfied Clients' },
  { icon: Code2, value: '100%', label: 'End-to-End Ownership' },
];

const featuredProjects = [
  {
    title: 'Arkose Infosoft',
    description: 'Full-stack business website for IT services & digital marketing',
    image: arkoseScreenshot,
    isLiveClient: true,
  },
  {
    title: 'Arkose Buildcom',
    description: 'UI/UX redesign for architecture & construction firm',
    image: arkoseBuildcomScreenshot,
    isLiveClient: true,
  },
  {
    title: '32 Pearls Dental World',
    description: 'Custom WordPress website for healthcare dental clinic',
    image: pearlsScreenshot,
    isLiveClient: true,
  },
  {
    title: 'Pitch & Play',
    description: 'Custom-coded website for influencer marketing agency',
    image: pitchandplayScreenshot,
    isLiveClient: true,
  },
];

const Home = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
        
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            {/* Left Content - 60% */}
            <div className="lg:col-span-3 space-y-8">
              {/* Meta line */}
              <motion.div
                className="flex items-center gap-2 text-muted-foreground text-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <MapPin size={14} className="text-primary" />
                <span>Kanpur, India · Open to freelance & full-time roles</span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                className="text-display-xl font-display font-bold tracking-tight"
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
                className="text-display-sm font-display text-muted-foreground"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                Web Developer | WordPress & Next.js Specialist
              </motion.p>

              {/* Credibility */}
              <motion.div
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-base text-muted-foreground/80 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
              >
                <span>Worked with global clients across</span>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="inline-flex items-center gap-1.5 text-primary/80">
                    <Fuel size={16} />
                    <span className="text-sm">Petroleum</span>
                  </span>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="inline-flex items-center gap-1.5 text-primary/80">
                    <ShoppingBag size={16} />
                    <span className="text-sm">E-commerce</span>
                  </span>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="inline-flex items-center gap-1.5 text-primary/80">
                    <Cloud size={16} />
                    <span className="text-sm">SaaS</span>
                  </span>
                </div>
              </motion.div>

              {/* Description */}
              <motion.p
                className="text-lg text-muted-foreground max-w-xl leading-relaxed"
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
                className="text-sm text-muted-foreground/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.2 }}
              >
                Available for freelance & full-time roles
              </motion.p>
            </div>

            {/* Right Visual - 40% */}
            <motion.div
              className="lg:col-span-2 hidden lg:block"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
            >
              <TechOrbit />
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.5, repeat: Infinity, repeatType: 'reverse', repeatDelay: 1 }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <motion.div
              className="w-1 h-2 rounded-full bg-primary"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </section>

      {/* Proof Strip */}
      <section className="py-24 border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {proofPoints.map((point, index) => (
              <AnimatedSection key={point.label} delay={index * 0.1}>
                <div className="text-center group">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl glass mb-4 group-hover:glow-primary transition-all duration-500">
                    <point.icon size={24} className="text-primary" />
                  </div>
                  <div className="text-display-md font-display font-bold text-foreground mb-1">
                    {point.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {point.label}
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Selected Work Preview */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <AnimatedSection>
            <div className="flex items-center justify-between mb-16">
              <h2 className="text-display-md font-display font-bold">
                Selected <span className="text-gradient">Work</span>
              </h2>
              <Link
                to="/work"
                className="hidden md:flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-300"
                data-cursor="View All"
              >
                View All Projects
                <ArrowRight size={16} />
              </Link>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProjects.map((project, index) => (
              <AnimatedSection key={project.title} delay={index * 0.1}>
                <Link to="/work" className="group block" data-cursor="View">
                  <div className="relative overflow-hidden rounded-2xl bg-card border border-border/40 shadow-sm hover:shadow-md hover:border-border/60 transition-all duration-300">
                    {/* Image */}
                    <div className="aspect-[4/3] overflow-hidden bg-muted">
                      <img 
                        src={project.image} 
                        alt={`${project.title} preview`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="p-5">
                      {/* Live Client Badge */}
                      {project.isLiveClient && (
                        <span className="inline-block px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3 border border-primary/20">
                          Live Client Website
                        </span>
                      )}
                      <h3 className="text-base font-display font-semibold mb-1.5 group-hover:text-primary transition-colors duration-300">
                        {project.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {project.description}
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-sm text-primary font-medium group-hover:gap-2.5 transition-all duration-300">
                        View Case Study
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection className="mt-12 text-center md:hidden">
            <Link to="/work">
              <Button variant="outline">
                View All Projects
                <ArrowRight size={16} />
              </Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-border/50">
        <div className="container mx-auto px-6 text-center">
          <AnimatedSection>
            <h2 className="text-display-md font-display font-bold mb-6">
              Let's Build Something <span className="text-gradient">Great</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Have a project in mind? I'm available for freelance work and full-time positions.
            </p>
            <Link to="/contact">
              <Button variant="primary" size="lg" data-cursor="Contact">
                Get in Touch
                <ArrowRight size={18} />
              </Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
