import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Facebook, Instagram, Send, Phone, Mail, MapPin, ArrowRight, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { postNotify } from '../services/notify';
import { site } from '../config/site';

type SubscribeState = 'idle' | 'submitting' | 'success' | 'error';

export const Footer = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<SubscribeState>('idle');
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || state === 'submitting') return;

    setState('submitting');
    const result = await postNotify({ kind: 'newsletter', payload: { email: value } });
    if (result.ok) {
      setEmail('');
      setState('success');
    } else {
      setState('error');
    }
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setState('idle'), 5000);
  };

  return (
    <footer className="bg-foreground/[0.01] border-t border-foreground/5 pt-20 pb-12 px-8 overflow-hidden relative">
      {/* Subtle luxury glow in footer background */}
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-gold/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
        {/* Column 1: Brand & Logo */}
        <div className="md:col-span-4 space-y-6">
          <Link to="/" className="text-2xl font-display font-bold tracking-tighter">
            <span className="text-brand-gold">FAXR</span> MEBEL
          </Link>
          <p className="text-xs text-foreground/50 leading-relaxed font-light italic max-w-sm">
            {t('footer.desc')}
          </p>
          <div className="flex gap-3 text-foreground/30">
            <Award className="w-5 h-5 text-brand-gold" aria-hidden="true" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/50">{t('footer.badge')}</span>
          </div>
        </div>

        {/* Column 2: Navigation Links */}
        <div className="md:col-span-2 space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">{t('footer.nav')}</h4>
          <ul className="space-y-2.5 text-xs font-medium text-foreground/60">
            <li><Link to="/" className="hover:text-brand-gold transition-colors">{t('nav.home')}</Link></li>
            <li><Link to="/shop" className="hover:text-brand-gold transition-colors">{t('nav.shop')}</Link></li>
            <li><Link to="/about" className="hover:text-brand-gold transition-colors">{t('nav.about')}</Link></li>
            <li><Link to="/contact" className="hover:text-brand-gold transition-colors">{t('nav.contact')}</Link></li>
          </ul>
        </div>

        {/* Column 3: Contact & Showroom */}
        <div className="md:col-span-3 space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">{t('footer.showroom')}</h4>
          <ul className="space-y-3.5 text-xs text-foreground/60 leading-relaxed">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" aria-hidden="true" />
              <span>{site.address[0]}<br/>{site.address[1]}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-brand-gold shrink-0" aria-hidden="true" />
              <a href={site.phone.href} className="hover:text-brand-gold transition-colors font-bold">{site.phone.display}</a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-brand-gold shrink-0" aria-hidden="true" />
              <a href={`mailto:${site.email}`} className="hover:text-brand-gold transition-colors">{site.email}</a>
            </li>
          </ul>
        </div>

        {/* Column 4: Newsletter Subscription */}
        <div className="md:col-span-3 space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">{t('footer.newsletter')}</h4>
          <p className="text-[11px] text-foreground/50 leading-relaxed">
            {t('footer.newsletterDesc')}
          </p>

          <form onSubmit={handleSubscribe} className="space-y-2">
            <div className="relative flex items-center">
              <label htmlFor="newsletter-email" className="sr-only">{t('footer.emailPlaceholder')}</label>
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('footer.emailPlaceholder')}
                disabled={state === 'submitting'}
                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-brand-gold transition-all italic pr-12 text-foreground disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={state === 'submitting'}
                aria-label={t('footer.subscribe')}
                className="absolute right-2 p-2 bg-brand-gold hover:bg-brand-gold-muted text-black rounded-lg transition-colors disabled:opacity-50"
              >
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
            {state === 'success' && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                role="status"
                className="text-[10px] text-green-500 font-bold uppercase tracking-wider"
              >
                {t('footer.subscribed')}
              </motion.p>
            )}
            {state === 'error' && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                className="text-[10px] text-red-500 font-bold uppercase tracking-wider"
              >
                {t('footer.subscribeError')}
              </motion.p>
            )}
          </form>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="max-w-7xl mx-auto pt-8 border-t border-foreground/5 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] uppercase tracking-widest font-semibold text-foreground/40">
        <div>{t('footer.rights')}</div>

        <div className="flex space-x-8">
          <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-brand-gold transition-colors flex items-center gap-1.5"><Instagram className="w-3.5 h-3.5" aria-hidden="true" /> Instagram</a>
          <a href={site.social.telegram} target="_blank" rel="noopener noreferrer" className="hover:text-brand-gold transition-colors flex items-center gap-1.5"><Send className="w-3.5 h-3.5" aria-hidden="true" /> Telegram</a>
          <a href={site.social.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-brand-gold transition-colors flex items-center gap-1.5"><Facebook className="w-3.5 h-3.5" aria-hidden="true" /> Facebook</a>
        </div>
      </div>
    </footer>
  );
};
