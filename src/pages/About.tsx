import { motion } from 'framer-motion';
import { Code2, Zap, Users, Target, Coffee, Lightbulb } from 'lucide-react';
import Layout from '@/components/Layout';
import AnimatedSection from '@/components/AnimatedSection';

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

const tools = [
  { category: 'Frontend', items: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'] },
  { category: 'Backend', items: ['Node.js', 'Express', 'MongoDB', 'MySQL'] },
  { category: 'CMS', items: ['WordPress', 'Elementor', 'WooCommerce', 'PHP'] },
  { category: 'Tools', items: ['Git', 'VS Code', 'Figma', 'Vercel'] },
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
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <AnimatedSection direction="left">
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

            {/* Visual */}
            <AnimatedSection direction="right">
              <div className="relative">
                <div className="aspect-square rounded-3xl glass border-glow overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 via-transparent to-primary/10 flex items-center justify-center">
                    <motion.div
                      className="text-center"
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Code2 size={120} className="text-primary/30 mx-auto mb-4" />
                      <span className="text-xl font-display text-muted-foreground">
                        Developer at Work
                      </span>
                    </motion.div>
                  </div>
                </div>
                
                {/* Floating badge */}
                <motion.div
                  className="absolute -top-4 -right-4 glass-strong rounded-xl p-4"
                  animate={{ rotate: [0, 5, 0, -5, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Lightbulb className="text-primary" size={24} />
                </motion.div>
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
      <section className="py-24">
        <div className="container mx-auto px-6">
          <AnimatedSection>
            <h2 className="text-display-sm font-display font-bold text-center mb-16">
              Tools & <span className="text-gradient">Technologies</span>
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {tools.map((tool, index) => (
              <AnimatedSection key={tool.category} delay={index * 0.1}>
                <div className="p-6 rounded-2xl glass">
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
                    {tool.category}
                  </h3>
                  <div className="space-y-3">
                    {tool.items.map((item) => (
                      <div
                        key={item}
                        className="text-foreground font-medium flex items-center gap-3"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
