import { motion } from 'framer-motion';
import { Calendar, MapPin, Building2, Briefcase, Rocket } from 'lucide-react';
import Layout from '@/components/Layout';
import AnimatedSection from '@/components/AnimatedSection';

const experiences = [
  {
    id: 1,
    title: 'Web Developer',
    company: 'Global Connection 21',
    location: 'Remote',
    period: 'Jun 2025 – Dec 2025',
    type: 'Professional',
    responsibilities: [
      'Built and maintained WordPress websites for multiple clients',
      'Improved UI/UX, SEO, and overall website performance',
      'Implemented automations and API-based workflows',
      'Worked directly with clients to understand requirements',
      'Delivered production-ready solutions on tight deadlines',
    ],
  },
  {
    id: 2,
    title: 'Founder & Lead Developer',
    company: 'Zynex Studio',
    location: 'Kanpur, India',
    period: '2025 – Present',
    type: 'Entrepreneurial',
    responsibilities: [
      'Transitioned from freelance work to formally launching Zynex Studio',
      'Building custom web applications using React and Next.js',
      'Managing client relationships and end-to-end project delivery',
      'Providing WordPress development and maintenance services',
      'Leveraging early experimentation to establish efficient workflows',
    ],
  },
];

const Experience = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="pt-32 pb-16">
        <div className="container mx-auto px-6">
          <AnimatedSection>
            <p className="text-primary text-sm font-medium tracking-wider uppercase mb-4">
              Experience
            </p>
            <h1 className="text-display-lg font-display font-bold mb-6">
              Professional <span className="text-gradient">Journey</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              From building client projects to founding my own studio—here's 
              where I've been and what I've accomplished.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Timeline */}
      <section className="pb-24">
        <div className="container mx-auto px-6">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-border md:-translate-x-1/2" />

            {experiences.map((exp, index) => (
              <AnimatedSection
                key={exp.id}
                direction={index % 2 === 0 ? 'left' : 'right'}
                delay={index * 0.2}
              >
                <div
                  className={`relative grid md:grid-cols-2 gap-8 mb-16 ${
                    index % 2 === 1 ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  {/* Timeline dot */}
                  <motion.div
                    className="absolute left-0 md:left-1/2 w-4 h-4 rounded-full bg-primary border-4 border-background md:-translate-x-1/2 z-10"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  />

                  {/* Content card */}
                  <div
                    className={`ml-8 md:ml-0 ${
                      index % 2 === 0
                        ? 'md:pr-16 md:text-right'
                        : 'md:col-start-2 md:pl-16'
                    }`}
                  >
                    <div
                      className={`p-8 rounded-2xl glass border-glow hover-glow ${
                        index % 2 === 0 ? 'md:ml-auto' : ''
                      }`}
                    >
                      {/* Badge */}
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                        {exp.type === 'Professional' ? (
                          <Briefcase size={12} />
                        ) : (
                          <Rocket size={12} />
                        )}
                        {exp.type}
                      </span>

                      {/* Title */}
                      <h3 className="text-xl font-display font-bold text-foreground mb-2">
                        {exp.title}
                      </h3>

                      {/* Company */}
                      <div className="flex items-center gap-2 text-primary font-medium mb-4 flex-wrap">
                        <Building2 size={16} />
                        {exp.company}
                      </div>

                      {/* Meta */}
                      <div
                        className={`flex flex-wrap gap-4 text-sm text-muted-foreground mb-6 ${
                          index % 2 === 0 ? 'md:justify-end' : ''
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} />
                          {exp.period}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin size={14} />
                          {exp.location}
                        </span>
                      </div>

                      {/* Responsibilities */}
                      <ul
                        className={`space-y-3 ${
                          index % 2 === 0 ? 'md:text-left' : ''
                        }`}
                      >
                        {exp.responsibilities.map((resp, i) => (
                          <motion.li
                            key={i}
                            className="flex items-start gap-3 text-sm text-muted-foreground"
                            initial={{ opacity: 0, x: index % 2 === 0 ? 20 : -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                            {resp}
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Empty column for layout */}
                  <div
                    className={`hidden md:block ${
                      index % 2 === 0 ? 'md:col-start-2' : ''
                    }`}
                  />
                </div>
              </AnimatedSection>
            ))}

            {/* Timeline end */}
            <motion.div
              className="absolute left-0 md:left-1/2 bottom-0 w-4 h-4 rounded-full bg-muted border-4 border-background md:-translate-x-1/2"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
            />
          </div>
        </div>
      </section>

      {/* Summary Stats */}
      <section className="py-24 border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <AnimatedSection delay={0}>
              <div className="p-8 rounded-2xl glass">
                <div className="text-display-md font-display font-bold text-primary mb-2">
                  6+
                </div>
                <div className="text-muted-foreground">Months Experience</div>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <div className="p-8 rounded-2xl glass">
                <div className="text-display-md font-display font-bold text-primary mb-2">
                  10+
                </div>
                <div className="text-muted-foreground">Projects Completed</div>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <div className="p-8 rounded-2xl glass">
                <div className="text-display-md font-display font-bold text-primary mb-2">
                  5+
                </div>
                <div className="text-muted-foreground">Happy Clients</div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Experience;
