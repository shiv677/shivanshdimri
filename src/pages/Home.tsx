import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, Code2, Rocket, Users } from 'lucide-react';
import Layout from '@/components/Layout';
import AnimatedSection from '@/components/AnimatedSection';
import Button from '@/components/Button';
import SplineHero from '@/components/SplineHero';

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
      {/* Spline Hero Section */}
      <SplineHero />

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
