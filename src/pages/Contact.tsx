import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Github,
  Linkedin,
  Phone,
  Send,
  Check,
  Copy,
  Download,
  Terminal,
  Shield,
  Clock,
  MapPin,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import Layout from '@/components/Layout';
import ScrambleText from '@/components/activetheory/ScrambleText';
import { soundEngine } from '@/components/activetheory/SoundEngine';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().trim().email('Please enter a valid email').max(255, 'Email must be less than 255 characters'),
  message: z.string().trim().min(1, 'Message is required').max(2000, 'Message must be less than 2000 characters'),
});

const DIRECT_CHANNELS = [
  {
    icon: Mail,
    label: 'PRIMARY DIRECT INBOX',
    value: 'dimrishiv933@gmail.com',
    href: 'mailto:dimrishiv933@gmail.com',
    actionText: 'TRANSMIT EMAIL',
  },
  {
    icon: Phone,
    label: 'WHATSAPP ENCRYPTED CHAT',
    value: '+91 8957543247',
    href: 'https://wa.me/918957543247',
    actionText: 'OPEN WHATSAPP',
  },
  {
    icon: Github,
    label: 'GITHUB SOURCE REGISTRY',
    value: 'github.com/shiv677',
    href: 'https://github.com/shiv677',
    actionText: 'VIEW COMMITS',
  },
  {
    icon: Linkedin,
    label: 'LINKEDIN PROFESSIONAL NETWORK',
    value: 'linkedin.com/in/shivansh-dimri-27820b268',
    href: 'https://www.linkedin.com/in/shivansh-dimri-27820b268',
    actionText: 'VIEW PROFILE',
  },
];

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    soundEngine.playClick(880);
    navigator.clipboard.writeText('dimrishiv933@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
    toast({
      title: 'Email Copied',
      description: 'dimrishiv933@gmail.com copied to clipboard.',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick(940);
    setIsSubmitting(true);

    try {
      const validatedData = contactSchema.parse(formData);

      const { error } = await supabase.from('contact_submissions').insert({
        name: validatedData.name,
        email: validatedData.email,
        message: validatedData.message,
      });

      if (error) {
        console.error('Error saving submission:', error);
        throw new Error('Failed to send transmission');
      }

      toast({
        title: 'Message Dispatched',
        description: 'Thank you. Shivansh Dimri will respond via email shortly.',
      });

      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Fault',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Transmission Interrupted',
          description: 'Failed to record transmission. Please use direct email.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      {/* ==================== HERO SECTION ==================== */}
      <section className="mb-16">
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-[10px] tracking-[0.3em] uppercase mb-3">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
          <span>PORTAL // 04 // DIRECT CONTACT INTERFACE</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-display font-black uppercase tracking-tight text-white mb-6">
          <ScrambleText text="TRANSMISSION INTERFACE" />
        </h1>

        <p className="text-sm sm:text-base font-mono text-white/70 max-w-3xl leading-relaxed mb-8">
          Available for AI engineering positions, high-concurrency Python backend contracts, multimodal VLM evaluation infrastructure, and open-source systems architecture.
        </p>

        {/* Telemetry bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
            <div className="text-[10px] font-mono text-white/40 tracking-[0.2em] mb-1">UPLINK STATUS</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-400">ENCRYPTED</div>
          </div>
          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
            <div className="text-[10px] font-mono text-white/40 tracking-[0.2em] mb-1">AVAILABILITY</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-cyan-300">OPEN TO OFFERS</div>
          </div>
          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
            <div className="text-[10px] font-mono text-white/40 tracking-[0.2em] mb-1">TYPICAL RESPONSE</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-fuchsia-300">24–48 HOURS</div>
          </div>
          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
            <div className="text-[10px] font-mono text-white/40 tracking-[0.2em] mb-1">REGION</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-white">ASIA // REMOTE</div>
          </div>
        </div>
      </section>

      {/* ==================== TRANSMISSION GRID ==================== */}
      <div className="grid lg:grid-cols-12 gap-8 items-start mb-20">
        {/* Transmission Form */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl border border-white/15 bg-[#05060d]/85 backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="font-mono text-xs text-white font-bold tracking-wider">
                SEND DIRECT INQUIRY
              </span>
            </div>
            <span className="text-[10px] font-mono text-white/40">TLS 1.3 // POSTGRES RLS</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-white/60 tracking-[0.2em] uppercase mb-1.5">
                IDENTIFIER // YOUR NAME OR ENTITY *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Elena Rostova // DeepMind Research"
                className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 focus:border-cyan-400 focus:outline-none text-xs font-mono text-white placeholder-white/25 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-white/60 tracking-[0.2em] uppercase mb-1.5">
                RETURN ADDRESS // YOUR EMAIL *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="elena@enterprise.ai"
                className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 focus:border-cyan-400 focus:outline-none text-xs font-mono text-white placeholder-white/25 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-white/60 tracking-[0.2em] uppercase mb-1.5">
                TRANSMISSION PAYLOAD // PROJECT SPEC OR MESSAGE *
              </label>
              <textarea
                required
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Outline project specifications, engineering scope, or role details..."
                className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 focus:border-cyan-400 focus:outline-none text-xs font-mono text-white placeholder-white/25 transition-colors resize-none"
              />
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 rounded-full bg-cyan-400 text-black hover:bg-white font-mono text-xs font-bold tracking-[0.2em] uppercase transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(0,240,255,0.3)] disabled:opacity-50"
              >
                <Send size={13} />
                <span>{isSubmitting ? 'TRANSMITTING...' : 'DISPATCH TRANSMISSION'}</span>
              </button>

              <div className="text-[10px] font-mono text-white/40">
                DIRECT TO POSTGRESQL WAL
              </div>
            </div>
          </form>
        </div>

        {/* Direct Channels & Contact Points */}
        <div className="lg:col-span-5 space-y-4">
          {/* Quick Copy Primary Email Card */}
          <div className="p-6 rounded-3xl border border-cyan-400/30 bg-[#05060d]/85 backdrop-blur-xl space-y-4">
            <div className="text-[10px] font-mono tracking-[0.25em] text-cyan-400 uppercase">
              INSTANT DIRECT CONTACT
            </div>
            <div className="font-mono text-xs text-white/60">
              Need immediate technical consultation or interview scheduling? Copy direct email address:
            </div>
            <button
              onClick={handleCopyEmail}
              onMouseEnter={() => soundEngine.playHover()}
              className="w-full p-3.5 rounded-2xl border border-white/20 bg-black/80 hover:border-cyan-400 font-mono text-xs text-white flex items-center justify-between transition-all cursor-pointer group"
            >
              <span className="truncate group-hover:text-cyan-300">dimrishiv933@gmail.com</span>
              {copiedEmail ? (
                <Check size={14} className="text-emerald-400 flex-shrink-0" />
              ) : (
                <Copy size={14} className="text-white/60 group-hover:text-cyan-400 flex-shrink-0" />
              )}
            </button>
            <a
              href="/SHIVANSH_DIMRI_CV.pdf"
              download
              onClick={() => soundEngine.playClick(920)}
              onMouseEnter={() => soundEngine.playHover()}
              className="w-full py-3 rounded-full border border-white/20 bg-white text-black hover:bg-cyan-400 font-mono text-xs font-bold tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download size={13} />
              <span>DOWNLOAD OFFICIAL CV.PDF</span>
            </a>
          </div>

          {/* Direct External Nodes */}
          <div className="p-6 rounded-3xl border border-white/10 bg-[#04050a]/70 backdrop-blur-md space-y-3">
            <div className="text-[10px] font-mono tracking-[0.25em] text-white/40 uppercase mb-2">
              VERIFIED CHANNELS
            </div>
            {DIRECT_CHANNELS.map((ch) => {
              const Icon = ch.icon;
              return (
                <a
                  key={ch.label}
                  href={ch.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => soundEngine.playClick(780)}
                  onMouseEnter={() => soundEngine.playHover()}
                  className="p-3.5 rounded-xl border border-white/[0.08] bg-black/40 hover:border-cyan-400/40 hover:bg-white/[0.02] flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/[0.04] text-cyan-400">
                      <Icon size={14} />
                    </div>
                    <div>
                      <div className="text-[9px] font-mono text-white/40 tracking-wider">
                        {ch.label}
                      </div>
                      <div className="font-mono text-xs text-white group-hover:text-cyan-300">
                        {ch.value}
                      </div>
                    </div>
                  </div>
                  <ExternalLink size={12} className="text-white/30 group-hover:text-cyan-400" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
