import { motion } from 'framer-motion';
import { Zap, Users, Target, Coffee } from 'lucide-react';
import Layout from '@/components/Layout';
import AnimatedSection from '@/components/AnimatedSection';
import TechPanels from '@/components/TechPanels';
import ImageStack from '@/components/ImageStack';

const values = [
  {
    icon: Target,
    title: 'Clarity',
    description: 'Clean code, clear communication. No unnecessary complexity.',
  },
  {
    icon: Zap,
    title: 'Performance',
    description: 'Fast, optimized solutions that scale with your business.',
  },
  {
    icon: Users,
    title: 'Ownership',
    description: 'End-to-end responsibility from concept to deployment.',
  },
];

const About = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="pt-32 pb-16">
        <div className="container mx-auto px-6">
          <AnimatedSection>
            <p className="text-primary text-sm font-medium tracking-wider uppercase mb-4">
              About Me
            </p>
            <h1 className="text-display-lg font-display font-bold mb-6">
              Building with <span className="text-gradient">Purpose</span>
            </h1>
          </AnimatedSection>
        </div>
      </section>

      {/* Bio Section */}
      <section className="pb-24">
        <div className="container mx-auto px-6">
          <div className="flex flex-col-reverse lg:flex-row lg:items-center gap-12 lg:gap-16">
            {/* Text Content */}
            <AnimatedSection direction="left" className="flex-1">
              <div className="space-y-6">
                <motion.p
                  className="text-xl leading-relaxed text-foreground"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  I'm a practical developer who focuses on{' '}
                  <span className="text-primary font-medium">clarity</span>,{' '}
                  <span className="text-primary font-medium">performance</span>, and{' '}
                  <span className="text-primary font-medium">real-world usability</span>.
                </motion.p>
                
                <motion.p
                  className="text-lg text-muted-foreground leading-relaxed"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  I prefer building things that work cleanly rather than overengineering. 
                  Every line of code I write serves a purpose—whether it's improving user 
                  experience, boosting performance, or making the codebase more maintainable.
                </motion.p>

                <motion.p
                  className="text-lg text-muted-foreground leading-relaxed"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  Comfortable working independently, owning projects end-to-end, and 
                  communicating directly with clients. I believe the best work comes from 
                  understanding both the technical requirements and the business goals.
                </motion.p>

                <motion.div
                  className="flex items-center gap-4 pt-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <Coffee className="text-primary" size={24} />
                  <span className="text-muted-foreground">
                    Fueled by coffee and curiosity
                  </span>
                </motion.div>
              </div>
            </AnimatedSection>

            {/* Image Stack */}
            <AnimatedSection direction="right" className="w-full lg:w-auto lg:flex-shrink-0">
              <div className="flex justify-center">
                <div className="w-64 lg:w-72">
                  <ImageStack />
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 border-t border-border/50">
        <div className="container mx-auto px-6">
          <AnimatedSection>
            <h2 className="text-display-sm font-display font-bold text-center mb-16">
              Core <span className="text-gradient">Values</span>
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <AnimatedSection key={value.title} delay={index * 0.15}>
                <div className="p-8 rounded-2xl glass border-glow hover-glow text-center group">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                    <value.icon size={32} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-display font-bold mb-3">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {value.description}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Tools & Tech */}
      <TechPanels />
    </Layout>
  );
};

export default About;
