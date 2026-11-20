import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const techCategories = [
  {
    title: 'AI & Model Engineering',
    items: ['LLM Integration', 'Agentic AI & Multi-Agent Systems', 'Retrieval-Augmented Generation (RAG)', 'Vision-Language Models (VLMs)', 'PyTorch & Computer Vision', 'Model Evaluation & Benchmarking', 'Grad-CAM & Deep Learning', 'Prompt Engineering'],
  },
  {
    title: 'Core Systems & Data Engineering',
    items: ['Python', 'AsyncIO & Concurrency', 'Multiprocessing & Multithreading', 'Large-Scale Data Processing', 'ETL Pipelines & Web Scraping', 'Fault Tolerance & Checkpoint Recovery', 'Data Deduplication & Validation', 'Memory Optimisation', 'SQLite / MySQL'],
  },
  {
    title: 'Web Development & Deployment',
    items: ['React / Next.js', 'TypeScript', 'Tailwind CSS', 'WordPress / WooCommerce', 'REST APIs', 'Deployment & Hosting'],
  },
  {
    title: 'Infrastructure & AI Tooling',
    items: ['Docker', 'Linux', 'Git & SSH', 'Hugging Face', 'Ollama & LM Studio', 'OpenAI Codex', 'CI/CD & Automated QA'],
  },
];

const TechPanels = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const accentLineRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Left column animations
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            once: true,
          },
        }
      );

      gsap.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          delay: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            once: true,
          },
        }
      );

      gsap.fromTo(
        accentLineRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          duration: 0.6,
          delay: 0.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            once: true,
          },
        }
      );

      // Categories stagger
      categoriesRef.current.forEach((category, index) => {
        if (!category) return;

        gsap.fromTo(
          category,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            delay: 0.15 + index * 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 70%',
              once: true,
            },
          }
        );

        // Items stagger
        const items = category.querySelectorAll('.tech-item');
        gsap.fromTo(
          items,
          { opacity: 0, x: -8 },
          {
            opacity: 1,
            x: 0,
            duration: 0.4,
            stagger: 0.05,
            delay: 0.3 + index * 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 70%',
              once: true,
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left Column - Editorial Header */}
          <div className="lg:col-span-5 lg:sticky lg:top-32 lg:self-start">
            <div className="flex gap-6">
              {/* Accent Line */}
              <div
                ref={accentLineRef}
                className="hidden lg:block w-px bg-gradient-to-b from-primary via-primary/40 to-transparent origin-top"
                style={{ height: '120px' }}
              />

              <div>
                <h2
                  ref={titleRef}
                  className="text-display-sm font-display font-bold mb-4 opacity-0"
                >
                  Tools & <span className="text-gradient">Technologies</span>
                </h2>
                <p
                  ref={subtitleRef}
                  className="text-muted-foreground text-lg leading-relaxed max-w-sm opacity-0"
                >
                  The stack I use to build production-ready systems.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Clean Grid */}
          <div className="lg:col-span-7">
            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-10">
              {techCategories.map((category, index) => (
                <div
                  key={category.title}
                  ref={(el) => (categoriesRef.current[index] = el)}
                  className="opacity-0"
                >
                  {/* Category Title */}
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-widest mb-4 flex items-center gap-3">
                    <span className="w-2 h-px bg-primary" />
                    {category.title}
                  </h3>

                  {/* Tech Items */}
                  <ul className="space-y-2.5">
                    {category.items.map((item) => (
                      <li
                        key={item}
                        className="tech-item text-foreground/90 font-medium text-base tracking-tight"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechPanels;
