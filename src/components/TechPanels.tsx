import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const techCategories = [
  {
    title: 'Frontend',
    items: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
    position: { desktop: 'top-0 left-0', zIndex: 40 },
    rotation: -2,
  },
  {
    title: 'Backend',
    items: ['Node.js', 'Express', 'MongoDB', 'MySQL'],
    position: { desktop: 'top-8 left-[45%]', zIndex: 30 },
    rotation: 1.5,
  },
  {
    title: 'CMS',
    items: ['WordPress', 'Elementor', 'WooCommerce', 'PHP'],
    position: { desktop: 'top-48 left-[10%]', zIndex: 20 },
    rotation: 2,
  },
  {
    title: 'Tools',
    items: ['Git', 'VS Code', 'Figma', 'Vercel'],
    position: { desktop: 'top-40 left-[55%]', zIndex: 10 },
    rotation: -1.5,
  },
];

const TechPanels = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const panelsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Title animation
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, letterSpacing: '0.3em' },
        {
          opacity: 1,
          letterSpacing: '0.05em',
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            once: true,
          },
        }
      );

      // Panels animation
      panelsRef.current.forEach((panel, index) => {
        if (!panel) return;

        const rotation = techCategories[index].rotation;

        // Entry animation
        gsap.fromTo(
          panel,
          {
            opacity: 0,
            y: 60,
            rotateZ: rotation * 2,
            boxShadow: '0 0 0 rgba(0, 0, 0, 0)',
          },
          {
            opacity: 1,
            y: 0,
            rotateZ: rotation,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            duration: 0.7,
            delay: index * 0.15,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 70%',
              once: true,
            },
          }
        );

        // Items stagger animation
        const items = panel.querySelectorAll('.tech-item');
        gsap.fromTo(
          items,
          { opacity: 0, x: -10 },
          {
            opacity: 1,
            x: 0,
            duration: 0.4,
            stagger: 0.08,
            delay: 0.3 + index * 0.15,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 70%',
              once: true,
            },
          }
        );

        // Idle floating animation
        gsap.to(panel, {
          y: '+=4',
          duration: 4 + index * 0.5,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: index * 0.3,
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleMouseEnter = (index: number) => {
    const panel = panelsRef.current[index];
    if (!panel) return;
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.to(panel, {
      y: -8,
      boxShadow: '0 35px 60px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 212, 255, 0.1)',
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  const handleMouseLeave = (index: number) => {
    const panel = panelsRef.current[index];
    if (!panel) return;
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.to(panel, {
      y: 0,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  return (
    <section ref={sectionRef} className="py-24 overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Section Title */}
        <h2
          ref={titleRef}
          className="text-display-sm font-display font-bold text-center mb-20 opacity-0"
        >
          Tools & <span className="text-gradient">Technologies</span>
        </h2>

        {/* Panels Container */}
        <div className="relative min-h-[500px] lg:min-h-[450px]">
          {/* Desktop: Absolute positioned overlapping panels */}
          <div className="hidden lg:block relative w-full h-full">
            {techCategories.map((category, index) => (
              <div
                key={category.title}
                ref={(el) => (panelsRef.current[index] = el)}
                className={`absolute ${category.position.desktop} w-64 opacity-0`}
                style={{
                  zIndex: category.position.zIndex,
                  transform: `rotateZ(${category.rotation}deg)`,
                }}
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={() => handleMouseLeave(index)}
              >
                <div className="p-6 rounded-2xl backdrop-blur-xl bg-card/80 border border-border/50 shadow-2xl transition-colors duration-300 hover:border-primary/30">
                  {/* Category Title */}
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-5">
                    {category.title}
                  </h3>

                  {/* Tech Items */}
                  <div className="space-y-3">
                    {category.items.map((item) => (
                      <div
                        key={item}
                        className="tech-item flex items-center gap-3 text-foreground font-medium"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile: Stacked cards */}
          <div className="lg:hidden grid md:grid-cols-2 gap-6">
            {techCategories.map((category, index) => (
              <div
                key={category.title}
                ref={(el) => {
                  // Only set ref for mobile if not already set
                  if (!panelsRef.current[index]) {
                    panelsRef.current[index] = el;
                  }
                }}
                className="p-6 rounded-2xl backdrop-blur-xl bg-card/80 border border-border/50"
              >
                {/* Category Title */}
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-5">
                  {category.title}
                </h3>

                {/* Tech Items */}
                <div className="space-y-3">
                  {category.items.map((item) => (
                    <div
                      key={item}
                      className="tech-item flex items-center gap-3 text-foreground font-medium"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechPanels;
