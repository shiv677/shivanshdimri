import { motion } from 'framer-motion';
import { Github, Linkedin, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: Github, href: 'https://github.com/shiv677', label: 'GitHub' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Mail, href: 'mailto:dimrishiv933@gmail.com', label: 'Email' },
    { icon: Phone, href: 'https://wa.me/918957543247', label: 'WhatsApp' },
  ];

  return (
    <motion.footer
      className="relative py-16 border-t border-border/50"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Left - Copyright & Credit */}
          <div className="text-center md:text-left">
            <p className="text-muted-foreground text-sm">
              © {currentYear} Shivansh Dimri. All rights reserved.
            </p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Designed & Built by me
            </p>
          </div>

          {/* Center - Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-full glass hover-glow text-muted-foreground hover:text-primary transition-colors duration-300"
                data-cursor={social.label}
              >
                <social.icon size={18} />
              </a>
            ))}
          </div>

          {/* Right - Resume Download */}
          <a
            href="/SHIVANSH_DIMRI_CV.pdf"
            download
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass hover-glow text-sm font-medium text-foreground hover:text-primary transition-all duration-300"
            data-cursor="Download"
          >
            Download Resume
          </a>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
