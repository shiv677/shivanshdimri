import { motion } from 'framer-motion';
import { ExternalLink, Github } from 'lucide-react';
import Layout from '@/components/Layout';
import AnimatedSection from '@/components/AnimatedSection';
import Button from '@/components/Button';
import ProjectCard from '@/components/ProjectCard';
import InfrastructureProjects from '@/components/InfrastructureProjects';

import doctorHealthyLogo from '@/assets/doctor-healthy-logo.png';
import doctorHealthyScreenshot from '@/assets/doctor-healthy-screenshot.png';
import eliteshopScreenshot from '@/assets/eliteshop-screenshot.png';

import carbonixScreenshot from '@/assets/carbonix-screenshot.png';
import tcboScreenshot from '@/assets/tcbo-screenshot.png';
import soletraderScreenshot from '@/assets/soletrader-screenshot.png';
import yaliScreenshot from '@/assets/yali-screenshot.png';
import arkoseScreenshot from '@/assets/arkose-screenshot.png';
import arkoseBuildcomScreenshot from '@/assets/arkose-buildcom-screenshot.png';
import pearlsScreenshot from '@/assets/32pearls-screenshot.png';
import pitchandplayScreenshot from '@/assets/pitchandplay-screenshot.png';

interface Project {
  id: number;
  title: string;
  subtitle?: string;
  role: string;
  industry?: string;
  tech: string[];
  problem: string;
  solution: string;
  outcome: string;
  liveUrl: string;
  githubUrl: string | null;
  logo?: string;
  screenshot?: string;
  status?: 'in-progress' | 'live';
}

const fullProjects: Project[] = [
  {
    id: 1,
    title: 'Arkose Infosoft',
    role: 'Full-Stack Web Developer & Digital Experience Lead',
    industry: 'IT Services • Digital Marketing • Web Solutions',
    tech: ['WordPress', 'HTML5/CSS3', 'JavaScript', 'SEO'],
    problem: 'Needed a professional, conversion-focused digital presence with clear service positioning, strong trust signals, and lead-focused structure.',
    solution: 'Designed and developed a complete end-to-end business website with clean dark-toned UI, structured service pages, performance optimization, and mobile-first responsive layout.',
    outcome: 'Professional brand presence for international clients with improved lead trust and inquiry flow.',
    liveUrl: 'https://arkoseinfosoft.in/',
    githubUrl: 'https://github.com/arkoseinfosoft-lang/arkoseinfosoft',
    screenshot: arkoseScreenshot,
  },
  {
    id: 2,
    title: 'Arkose Buildcom',
    role: 'UI/UX Designer & Frontend Developer',
    industry: 'Architecture • Construction • Real Estate',
    tech: ['WordPress', 'HTML5/CSS3', 'JavaScript', 'UX Design'],
    problem: 'Existing website looked outdated, lacked visual hierarchy, and failed to communicate trust and premium construction standards.',
    solution: 'Complete UI/UX redesign with modern minimal interface, improved typography, clear service segmentation, strong hero sections, and fully responsive layouts.',
    outcome: 'Modernized digital identity with stronger visual trust and better user flow across service pages.',
    liveUrl: 'https://arkose.co.in/',
    githubUrl: null,
    screenshot: arkoseBuildcomScreenshot,
  },
  {
    id: 3,
    title: 'Doctor Healthy You',
    role: 'Full-Stack Developer',
    tech: ['React', 'Node.js', 'MongoDB', 'Express'],
    problem: 'Healthcare providers needed an efficient way to manage patient appointments and reduce no-shows.',
    solution: 'Built a comprehensive appointment booking system with real-time availability, automated reminders, and admin dashboard.',
    outcome: 'Streamlined booking process, reducing administrative overhead by 60%.',
    liveUrl: 'https://doctor-healthy-you-atd4362.public.builtwithrocket.new',
    githubUrl: '#',
    logo: doctorHealthyLogo,
    screenshot: doctorHealthyScreenshot,
  },
  {
    id: 4,
    title: 'EliteShop',
    subtitle: '(E-Commerce Website)',
    role: 'Frontend Developer',
    tech: ['Next.js', 'TypeScript', 'Stripe', 'Tailwind CSS'],
    problem: 'Client needed a modern, high-performance e-commerce platform with seamless checkout experience.',
    solution: 'Developed a responsive storefront with product filtering, cart management, and Stripe payment integration.',
    outcome: 'Achieved 40% faster page loads and improved conversion rates.',
    liveUrl: 'https://eliteshop-7u97i30.public.builtwithrocket.new',
    githubUrl: '#',
    screenshot: eliteshopScreenshot,
  },
];

const clientContributions: Project[] = [
  {
    id: 5,
    title: '32 Pearls Dental World',
    role: 'WordPress Developer',
    industry: 'Healthcare • Dental Clinic',
    tech: ['WordPress', 'PHP', 'HTML5/CSS3', 'JavaScript'],
    problem: 'Dental clinic needed a professional, trustworthy online presence with clear service showcasing and conversion-focused design.',
    solution: 'Built a fully custom WordPress theme with responsive UI, clear service pages, SEO-friendly structure, and easy-to-manage backend for clinic staff.',
    outcome: 'Professional healthcare website with improved patient trust and easy content management.',
    liveUrl: 'https://32pearlsdentalworld.com/',
    githubUrl: null,
    screenshot: pearlsScreenshot,
  },
  {
    id: 6,
    title: 'Pitch & Play',
    role: 'WordPress Developer & Frontend Engineer',
    industry: 'Influencer Marketing • Digital Marketing',
    tech: ['WordPress', 'PHP', 'HTML5/CSS3', 'JavaScript'],
    problem: 'Required a modern, performance-focused website to represent influencer marketing services with bold, engaging brand presence.',
    solution: 'Developed a custom-coded WordPress website with responsive frontend, clear service positioning, and conversion-focused CTAs.',
    outcome: 'Distinct brand identity with improved clarity of offerings and scalable WordPress implementation.',
    liveUrl: 'https://pitchandplay.in/',
    githubUrl: null,
    screenshot: pitchandplayScreenshot,
  },
  {
    id: 7,
    title: 'Carbonix',
    role: 'Live Client Website',
    industry: 'Petroleum • USA',
    tech: ['WordPress', 'Custom Theme', 'Hosting Setup'],
    problem: 'Client required a professional website to establish digital presence.',
    solution: 'Designed and deployed a clean, business-focused website with reliable hosting.',
    outcome: 'Live production website delivered for a real client.',
    liveUrl: 'https://darkred-stork-731280.hostingersite.com',
    githubUrl: null,
    screenshot: carbonixScreenshot,
  },
  {
    id: 8,
    title: 'TCBO Marketing LLC',
    role: 'Live Client Website',
    industry: 'Petroleum • USA',
    tech: ['WordPress', 'Custom Theme', 'Hosting & Domain'],
    problem: 'No structured online presence for business representation.',
    solution: 'Built and launched a responsive corporate website.',
    outcome: 'Live client website supporting credibility and visibility.',
    liveUrl: 'http://darkseagreen-dog-161075.hostingersite.com/',
    githubUrl: null,
    screenshot: tcboScreenshot,
  },
  {
    id: 9,
    title: 'Sole Trader',
    role: 'Lead Web Development',
    industry: 'Petroleum • Australia',
    tech: ['WordPress', 'Custom Theme Development', 'Performance Optimization'],
    problem: 'Client needed a professional website for petroleum trading business representation.',
    solution: 'Led development, implemented clean corporate UI, optimized structure and performance.',
    outcome: 'Live production website supporting international business credibility.',
    liveUrl: 'https://soleetrader.com',
    githubUrl: null,
    screenshot: soletraderScreenshot,
  },
  {
    id: 10,
    title: 'Yali Energy Trading',
    role: 'Lead Web Development',
    industry: 'Petroleum • Canada',
    tech: ['WordPress', 'Custom Theme Configuration', 'Responsive UI'],
    problem: 'No clear digital presence for petroleum trading operations.',
    solution: 'Handled major development responsibilities including layout, responsiveness, and deployment.',
    outcome: 'Live client website successfully launched.',
    liveUrl: 'https://yalienergytrading.com',
    githubUrl: null,
    screenshot: yaliScreenshot,
  },
];

const Work = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="pt-32 pb-16">
        <div className="container mx-auto px-6">
          <AnimatedSection>
            <p className="text-primary text-sm font-medium tracking-wider uppercase mb-4">
              Portfolio
            </p>
            <h1 className="text-display-lg font-display font-bold mb-6">
              Work & Client <span className="text-gradient">Projects</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              A collection of projects that showcase my expertise in building 
              production-ready web applications.
            </p>
            <p className="text-sm text-muted-foreground/70 mt-3 italic">
              Includes live client websites and selected personal projects.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Infrastructure Projects */}
      <InfrastructureProjects />

      {/* Full Projects Section */}
      <section className="pb-16">
        <div className="container mx-auto px-6">
          <AnimatedSection>
            <div className="mb-12">
              <h2 className="text-display-sm font-display font-bold mb-2">
                Full <span className="text-gradient">Projects</span>
              </h2>
              <p className="text-muted-foreground">
                Projects where I had complete ownership and responsibility
              </p>
            </div>
          </AnimatedSection>

          {fullProjects.map((project, index) => (
            <AnimatedSection
              key={project.id}
              direction={index % 2 === 0 ? 'left' : 'right'}
              delay={0.1}
            >
              <div
                className={`grid lg:grid-cols-2 gap-12 items-center py-16 border-b border-border/30 ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Visual */}
                <ProjectCard
                  className={`relative group ${index % 2 === 1 ? 'lg:order-2' : ''}`}
                >
                  <div className="aspect-video rounded-2xl glass border-glow overflow-hidden hover-glow">
                    {project.screenshot ? (
                      <img 
                        src={project.screenshot} 
                        alt={`${project.title} screenshot`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center">
                        {project.logo ? (
                          <img 
                            src={project.logo} 
                            alt={`${project.title} logo`}
                            className="w-24 h-24 object-contain"
                          />
                        ) : (
                          <div className="text-center">
                            <div className="text-6xl font-display font-bold text-primary/20 mb-2">
                              0{project.id}
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {project.role}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Floating tech badges */}
                  <div className="absolute -bottom-4 left-4 right-4 flex flex-wrap gap-2 justify-center">
                    {project.tech.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="px-3 py-1.5 rounded-full glass-strong text-xs font-medium text-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </ProjectCard>

                {/* Content */}
                <div className={`space-y-6 ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-display-sm font-display font-bold">
                        {project.title}
                      </h2>
                    </div>
                    {project.subtitle && (
                      <p className="text-lg text-muted-foreground font-medium mb-2">
                        {project.subtitle}
                      </p>
                    )}
                    <p className="text-primary text-sm font-medium">
                      {project.role}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        The Problem
                      </h3>
                      <p className="text-foreground">{project.problem}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        The Solution
                      </h3>
                      <p className="text-foreground">{project.solution}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        The Outcome
                      </h3>
                      <p className="text-primary font-medium">{project.outcome}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="primary" size="md" data-cursor="View Live">
                        <ExternalLink size={16} />
                        Visit Website
                      </Button>
                    </a>
                    {project.githubUrl && (
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="md" data-cursor="GitHub">
                          <Github size={16} />
                          Source Code
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Client Contributions Section */}
      <section className="pb-16">
        <div className="container mx-auto px-6">
          <AnimatedSection>
            <div className="mb-12 pt-8 border-t border-primary/20">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-display-sm font-display font-bold">
                  Client <span className="text-gradient">Contributions</span>
                </h2>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  Live Client Websites
                </span>
              </div>
              <p className="text-muted-foreground">
                Client projects where I led key development responsibilities
              </p>
            </div>
          </AnimatedSection>

          {clientContributions.map((project, index) => (
            <AnimatedSection
              key={project.id}
              direction={index % 2 === 0 ? 'left' : 'right'}
              delay={0.1}
            >
              <div
                className={`grid lg:grid-cols-2 gap-12 items-center py-16 border-b border-border/30 ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Visual */}
                <ProjectCard
                  className={`relative group ${index % 2 === 1 ? 'lg:order-2' : ''}`}
                >
                  <div className="aspect-video rounded-2xl glass border-glow overflow-hidden hover-glow">
                    {project.screenshot ? (
                      <img 
                        src={project.screenshot} 
                        alt={`${project.title} screenshot`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-6xl font-display font-bold text-primary/20 mb-2">
                            0{project.id}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {project.role}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Floating tech badges */}
                  <div className="absolute -bottom-4 left-4 right-4 flex flex-wrap gap-2 justify-center">
                    {project.tech.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="px-3 py-1.5 rounded-full glass-strong text-xs font-medium text-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </ProjectCard>

                {/* Content */}
                <div className={`space-y-6 ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <div>
                    <h2 className="text-display-sm font-display font-bold mb-2">
                      {project.title}
                    </h2>
                    <div className="flex items-center gap-2">
                      <p className="text-primary text-sm font-medium">
                        {project.role}
                      </p>
                      <span className="text-muted-foreground text-xs">•</span>
                      <span className="text-xs text-muted-foreground">Major Contribution</span>
                    </div>
                    {project.industry && (
                      <p className="text-muted-foreground text-xs mt-1">
                        {project.industry}
                      </p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        The Problem
                      </h3>
                      <p className="text-foreground">{project.problem}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        The Solution
                      </h3>
                      <p className="text-foreground">{project.solution}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        The Outcome
                      </h3>
                      <p className="text-primary font-medium">{project.outcome}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="primary" size="md" data-cursor="View Live">
                        <ExternalLink size={16} />
                        Visit Website
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

    </Layout>
  );
};

export default Work;
