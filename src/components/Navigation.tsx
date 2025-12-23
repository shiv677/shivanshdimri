import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/work', label: 'Work' },
  { href: '/about', label: 'About' },
  { href: '/experience', label: 'Experience' },
  { href: '/contact', label: 'Contact' },
];

const logoText = "Shivansh Dimri";

const letterVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.8 + i * 0.04,
      duration: 0.4,
      ease: [0.23, 1, 0.32, 1],
    },
  }),
};

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled ? 'glass-strong py-4' : 'py-6'
        }`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
      >
        <nav className="container mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="text-base font-medium tracking-tight text-foreground/80 hover:text-primary transition-colors duration-200 ease-out flex"
            data-cursor="Home"
          >
            {logoText.split('').map((letter, index) => (
              <motion.span
                key={index}
                custom={index}
                variants={letterVariants}
                initial="hidden"
                animate="visible"
                className={letter === ' ' ? 'w-1.5' : ''}
              >
                {letter}
              </motion.span>
            ))}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link, index) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link
                  to={link.href}
                  className={`relative text-sm font-medium transition-colors duration-300 group ${
                    location.pathname === link.href
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  data-cursor={link.label}
                >
                  {link.label}
                  {location.pathname === link.href ? (
                    <motion.div
                      className="absolute -bottom-1 left-0 right-0 h-px bg-primary"
                      layoutId="activeNav"
                      transition={{ duration: 0.3 }}
                    />
                  ) : (
                    <span className="absolute -bottom-1 left-0 right-0 h-px bg-foreground/40 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left" />
                  )}
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            data-cursor="Menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-background/95 backdrop-blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.nav
              className="relative h-full flex flex-col items-center justify-center gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Link
                    to={link.href}
                    className={`text-3xl font-display font-bold transition-colors duration-300 ${
                      location.pathname === link.href
                        ? 'text-primary'
                        : 'text-foreground hover:text-primary'
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navigation;
