import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Github, Linkedin, Phone, Send, MapPin, Clock } from 'lucide-react';
import Layout from '@/components/Layout';
import AnimatedSection from '@/components/AnimatedSection';
import Button from '@/components/Button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().trim().email('Please enter a valid email').max(255, 'Email must be less than 255 characters'),
  message: z.string().trim().min(1, 'Message is required').max(2000, 'Message must be less than 2000 characters'),
});

const contactMethods = [
  {
    icon: Mail,
    label: 'Email',
    value: 'dimrishiv933@gmail.com',
    href: 'mailto:dimrishiv933@gmail.com',
  },
  {
    icon: Github,
    label: 'GitHub',
    value: 'github.com/shiv677',
    href: 'https://github.com/shiv677',
  },
  {
    icon: Linkedin,
    label: 'LinkedIn',
    value: 'linkedin.com/in/shivansh-dimri-27820b268',
    href: 'https://www.linkedin.com/in/shivansh-dimri-27820b268',
  },
  {
    icon: Phone,
    label: 'WhatsApp',
    value: '+91 8957543247',
    href: 'https://wa.me/918957543247',
  },
];

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form data
      const validatedData = contactSchema.parse(formData);

      // Save to database
      const { error } = await supabase
        .from('contact_submissions')
        .insert({
          name: validatedData.name,
          email: validatedData.email,
          message: validatedData.message,
        });

      if (error) {
        console.error('Error saving submission:', error);
        throw new Error('Failed to send message');
      }

      toast({
        title: 'Message sent!',
        description: "Thanks for reaching out. I'll get back to you soon.",
      });

      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to send message. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="pt-32 pb-16">
        <div className="container mx-auto px-6">
          <AnimatedSection>
            <p className="text-primary text-sm font-medium tracking-wider uppercase mb-4">
              Get in Touch
            </p>
            <h1 className="text-display-lg font-display font-bold mb-6">
              Let's Work <span className="text-gradient">Together</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Want to work together or discuss an opportunity? I'm always open 
              to new projects and collaborations.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Contact Content */}
      <section className="pb-24">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <AnimatedSection direction="left">
              <div className="p-8 md:p-10 rounded-3xl glass border-glow">
                <h2 className="text-xl font-display font-bold mb-8">
                  Send a Message
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-muted-foreground mb-2"
                    >
                      Name
                    </label>
                    <motion.input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300"
                      placeholder="Your name"
                      whileFocus={{ scale: 1.01 }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-muted-foreground mb-2"
                    >
                      Email
                    </label>
                    <motion.input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300"
                      placeholder="your@email.com"
                      whileFocus={{ scale: 1.01 }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-muted-foreground mb-2"
                    >
                      Message
                    </label>
                    <motion.textarea
                      id="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 resize-none"
                      placeholder="Tell me about your project..."
                      whileFocus={{ scale: 1.01 }}
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <motion.div
                        className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                    ) : (
                      <>
                        <Send size={18} />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </AnimatedSection>

            {/* Contact Info */}
            <AnimatedSection direction="right">
              <div className="space-y-8">
                {/* Availability */}
                <div className="p-6 rounded-2xl glass border-glow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-foreground font-medium">
                      Available for work
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <MapPin size={14} className="text-primary" />
                      Kanpur, India
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock size={14} className="text-primary" />
                      IST (UTC+5:30)
                    </span>
                  </div>
                </div>

                {/* Contact Methods */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Direct Contact
                  </h3>
                  <div className="space-y-4">
                    {contactMethods.map((method, index) => (
                      <motion.a
                        key={method.label}
                        href={method.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-xl glass hover-glow group transition-all duration-300"
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        data-cursor={method.label}
                      >
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                          <method.icon size={20} className="text-primary" />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">
                            {method.label}
                          </div>
                          <div className="text-foreground font-medium group-hover:text-primary transition-colors duration-300">
                            {method.value}
                          </div>
                        </div>
                      </motion.a>
                    ))}
                  </div>
                </div>

                {/* Quick note */}
                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    <span className="text-primary font-medium">Prefer email?</span>{' '}
                    I typically respond within 24-48 hours. For urgent matters, 
                    feel free to reach out via WhatsApp.
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
