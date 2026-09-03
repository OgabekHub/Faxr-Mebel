import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { postNotify } from '../services/notify';
import { Mail, Phone, MapPin, Send, CheckCircle2, ChevronDown, Award } from 'lucide-react';
import { cn } from '../lib/utils';

const availableTimes = ['09:00', '11:00', '14:00', '16:00', '18:00'];

const faqs = [
  { id: 'q1' },
  { id: 'q2' },
  { id: 'q3' },
  { id: 'q4' }
];

export const Contact = () => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Tab selector between Message / Showroom Appointment booking
  const [activeFormTab, setActiveFormTab] = useState<'message' | 'appointment'>('message');
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: '',
    date: '',
    time: ''
  });

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // The message text itself is built server-side (api/_lib/notify.ts) with HTML escaping.
    const result = activeFormTab === 'message'
      ? await postNotify({
          kind: 'contact',
          payload: { name: formData.name, phone: formData.phone, message: formData.message },
        })
      : await postNotify({
          kind: 'appointment',
          payload: { name: formData.name, phone: formData.phone, date: formData.date, time: formData.time },
        });
    setIsSubmitting(false);

    if (result.ok) {
      setIsSuccess(true);
      setFormData({ name: '', phone: '', message: '', date: '', time: '' });
      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    } else {
      alert(t('contact.form.error'));
    }
  };

  return (
    <div className="pt-36 pb-20 px-6 max-w-7xl mx-auto min-h-screen">
      <div className="text-center mb-16">
        <span className="text-brand-gold uppercase tracking-hero text-[10px] font-black block">{t('contact.hero.teaser')}</span>
        <h1 className="text-4xl md:text-6xl font-editorial-title mt-2 mb-4">
          {t('contact.hero.title')} <span className="font-bold italic gold-foil-text">{t('contact.hero.titleGold')}</span>
        </h1>
        <p className="text-xs text-foreground/50 max-w-xl mx-auto leading-relaxed font-light italic">
          {t('contact.hero.desc')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
        {/* Left Side: Contact Information Cards */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card 1: Phone */}
          <div className="bento-card glow-tracer p-8 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold shrink-0 border border-brand-gold/15">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold mb-1.5 text-foreground">{t('contact.phone.title')}</h3>
              <p className="text-[11px] text-foreground/45 mb-2 leading-relaxed">{t('contact.phone.desc')}</p>
              <a href="tel:+998901234567" className="text-brand-gold hover:underline text-sm font-bold tracking-wider">+998 90 123 45 67</a>
            </div>
          </div>

          {/* Card 2: Email */}
          <div className="bento-card glow-tracer p-8 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold shrink-0 border border-brand-gold/15">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold mb-1.5 text-foreground">{t('contact.email.title')}</h3>
              <p className="text-[11px] text-foreground/45 mb-2 leading-relaxed">{t('contact.email.desc')}</p>
              <a href="mailto:info@faxrmebel.uz" className="text-brand-gold hover:underline text-sm font-bold">info@faxrmebel.uz</a>
            </div>
          </div>

          {/* Card 3: Address */}
          <div className="bento-card glow-tracer p-8 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold shrink-0 border border-brand-gold/15">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold mb-1.5 text-foreground">{t('contact.address.title')}</h3>
              <p className="text-[11px] text-foreground/45 mb-1.5 leading-relaxed">{t('contact.address.desc')}</p>
              <p className="text-xs text-foreground/75 font-semibold">{t('contact.address.value')}</p>
            </div>
          </div>

          {/* Social Links Panel */}
          <div className="bento-card p-6 border-l-4 border-l-brand-gold">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-foreground/40 mb-3 block">{t('contact.social.title')}</h3>
            <div className="flex flex-wrap gap-2.5">
              {['Instagram', 'Telegram', 'Facebook'].map((social) => (
                <a key={social} href="#" className="px-5 py-2.5 rounded-xl bg-foreground/5 hover:bg-brand-gold hover:text-black transition-colors font-bold text-xs uppercase tracking-wider">
                  {social}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Form selector message/appointment */}
        <div className="lg:col-span-7 bg-white dark:bg-white/5 bento-card p-8 md:p-10 border border-foreground/5 shadow-xl !overflow-visible">
          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="text-2xl font-editorial-title font-bold mb-2">{t('contact.form.success.title')}</h3>
              <p className="text-xs text-foreground/60 italic max-w-sm mx-auto">
                {t('contact.form.success.desc')}
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Form Tab selection */}
              <div className="flex border-b border-foreground/5 pb-4 gap-4">
                <button
                  type="button"
                  onClick={() => setActiveFormTab('message')}
                  className={cn(
                    "text-xs font-black uppercase tracking-widest pb-2 border-b-2",
                    activeFormTab === 'message' ? "border-brand-gold text-brand-gold font-bold" : "border-transparent text-foreground/40"
                  )}
                >
                  {t('contact.form.tab.message')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFormTab('appointment')}
                  className={cn(
                    "text-xs font-black uppercase tracking-widest pb-2 border-b-2",
                    activeFormTab === 'appointment' ? "border-brand-gold text-brand-gold font-bold" : "border-transparent text-foreground/40"
                  )}
                >
                  {t('contact.form.tab.appointment')}
                </button>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-foreground/45 mb-2 block ml-2">{t('contact.form.label.name')}</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder={t('contact.form.placeholder.name')} 
                  className="bg-foreground/5 border border-foreground/15 focus:border-brand-gold rounded-xl px-4 py-3.5 text-xs outline-none w-full transition-all text-foreground"
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-foreground/45 mb-2 block ml-2">{t('contact.form.label.phone')}</label>
                <input 
                  required
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder={t('contact.form.placeholder.phone')} 
                  className="bg-foreground/5 border border-foreground/15 focus:border-brand-gold rounded-xl px-4 py-3.5 text-xs outline-none w-full transition-all text-foreground"
                />
              </div>

              {activeFormTab === 'message' ? (
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-foreground/45 mb-2 block ml-2">{t('contact.form.label.message')}</label>
                  <textarea 
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder={t('contact.form.placeholder.message')} 
                    rows={4}
                    className="bg-foreground/5 border border-foreground/15 focus:border-brand-gold rounded-xl px-4 py-3.5 text-xs outline-none w-full transition-all text-foreground resize-none"
                  ></textarea>
                </div>
              ) : (
                /* Appointment scheduling elements */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-foreground/45 mb-2 block ml-2">{t('contact.form.label.date')}</label>
                    <div className="relative">
                      <input 
                        required
                        type="date" 
                        value={formData.date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="bg-foreground/5 border border-foreground/15 focus:border-brand-gold rounded-xl px-4 py-3.5 text-xs outline-none w-full transition-all text-foreground font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-foreground/45 mb-2 block ml-2">{t('contact.form.label.time')}</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                        className={cn(
                          "bg-foreground/5 border rounded-xl px-4 py-3.5 text-xs outline-none w-full transition-all font-bold flex justify-between items-center",
                          isTimeDropdownOpen ? "border-brand-gold text-foreground" : "border-foreground/15 hover:border-brand-gold text-foreground",
                          !formData.time ? "text-foreground/50" : ""
                        )}
                      >
                        {formData.time ? formData.time : t('contact.form.placeholder.time')}
                        <ChevronDown className={cn("w-4 h-4 duration-300", isTimeDropdownOpen ? "rotate-180 text-brand-gold" : "text-foreground/50")} />
                      </button>

                      {/* Hidden input for HTML5 required validation */}
                      <input 
                        type="text" 
                        required 
                        readOnly 
                        value={formData.time} 
                        className="absolute bottom-0 left-1/2 w-0 h-0 opacity-0 -z-10" 
                      />

                      <AnimatePresence>
                        {isTimeDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full left-0 w-full mt-2 p-2 bg-background border border-brand-gold/30 rounded-xl z-50 shadow-2xl shadow-brand-gold/10 flex flex-col gap-1 max-h-60 overflow-y-auto"
                          >
                            {availableTimes.map((time) => (
                              <button
                                key={time}
                                type="button"
                                onClick={() => {
                                  setFormData({...formData, time});
                                  setIsTimeDropdownOpen(false);
                                }}
                                className={cn(
                                  "w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold",
                                  formData.time === time 
                                    ? "bg-brand-gold text-black" 
                                    : "hover:bg-foreground/10 text-foreground"
                                )}
                              >
                                {time}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              )}

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-gold text-black py-4 rounded-xl font-extrabold text-xs uppercase tracking-hero hover:scale-102 shadow-xl shadow-brand-gold/15 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {isSubmitting ? t('contact.form.submitting') : t('contact.form.submit')}
                {!isSubmitting && <Send className="w-4 h-4" />}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Luxury FAQs Accordion Section */}
      <section className="py-12 border-t border-foreground/5">
         <div className="text-center mb-12">
            <span className="text-brand-gold uppercase tracking-hero text-[10px] font-black block">{t('contact.faq.teaser')}</span>
            <h2 className="text-3xl md:text-5xl font-editorial-title mt-2">{t('contact.faq.title')} <span className="font-bold italic gold-foil-text">{t('contact.faq.titleGold')}</span></h2>
         </div>

         <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                className="bento-card border border-foreground/5 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="text-sm font-bold text-foreground">{t(`contact.faq.${faq.id}.q`)}</span>
                  <ChevronDown className={cn("w-4 h-4 text-brand-gold duration-300", openFaqIndex === idx ? "rotate-180" : "")} />
                </button>

                <AnimatePresence initial={false}>
                  {openFaqIndex === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-6 pt-2 text-xs text-foreground/50 leading-relaxed font-light italic border-t border-foreground/5">
                        {t(`contact.faq.${faq.id}.a`)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
         </div>
      </section>

      {/* Decorative Brand Badge */}
      <div className="mt-16 flex justify-center text-foreground/10 gap-3">
         <Award className="w-6 h-6" />
      </div>
    </div>
  );
};
