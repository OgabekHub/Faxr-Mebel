import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Award, Compass, Sparkles } from 'lucide-react';

const historyTimeline = [
  { year: '1996', id: 'step1' },
  { year: '2008', id: 'step2' },
  { year: '2018', id: 'step3' },
  { year: '2026', id: 'step4' }
];

const artisans = [
  { id: 'rustam', name: 'Usta Rustamali', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300' },
  { id: 'kamola', name: 'Kamola Sobirova', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300' },
  { id: 'diyor', name: 'Usta Doniyor', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300' }
];

export const About = () => {
  const { t } = useTranslation();

  return (
    <div className="pt-36 pb-20 px-6 max-w-7xl mx-auto min-h-screen space-y-24">
      {/* Title Header */}
      <section className="text-center">
        <span className="text-brand-gold uppercase tracking-hero text-[10px] font-black block">{t('about.heritage.teaser')}</span>
        <h1 className="text-4xl md:text-6xl font-editorial-title mt-2 mb-4">
          {t('about.heritage.title')} <span className="font-bold italic gold-foil-text">{t('about.heritage.titleGold')}</span>
        </h1>
        <p className="text-xs text-foreground/50 max-w-xl mx-auto leading-relaxed font-light italic">
          {t('about.heritage.desc')}
        </p>
      </section>

      {/* Hero Brand Credentials */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <span className="text-brand-gold uppercase tracking-widest text-[9px] font-black block">{t('about.story.teaser')}</span>
          <h2 className="text-3xl font-editorial-title">{t('about.story.title')} <span className="font-bold italic">{t('about.story.titleItalic')}</span></h2>
          <p className="text-xs text-foreground/60 leading-relaxed font-light">
            {t('about.story.desc')}
          </p>
          <div className="grid grid-cols-2 gap-6 pt-4">
            <div className="flex gap-3">
              <Award className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-foreground">{t('about.story.stat1.title')}</h4>
                <p className="text-[10px] text-foreground/45 mt-1">{t('about.story.stat1.desc')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Compass className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-foreground">{t('about.story.stat2.title')}</h4>
                <p className="text-[10px] text-foreground/45 mt-1">{t('about.story.stat2.desc')}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative rounded-[2.5rem] overflow-hidden aspect-[4/3] group shadow-2xl">
          <img src="/images/dining_table.png" alt="Showroom" className="w-full h-full object-cover group-hover:scale-105" />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center p-6 text-center">
            <span className="text-[9px] uppercase tracking-hero text-white/90 border border-white/20 px-5 py-2.5 rounded-full font-black">{t('about.story.workshop')}</span>
          </div>
        </div>
      </section>

      {/* History Timeline */}
      <section className="py-12 border-t border-b border-foreground/5">
        <div className="text-center mb-16">
          <span className="text-brand-gold uppercase tracking-hero text-[10px] font-black block">{t('about.timeline.teaser')}</span>
          <h2 className="text-2xl md:text-4xl font-editorial-title mt-2">{t('about.timeline.title')} <span className="font-bold italic">{t('about.timeline.titleItalic')}</span></h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {historyTimeline.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15 }}
              viewport={{ once: true }}
              className="bento-card glow-tracer p-8 flex flex-col justify-between h-[250px] relative border border-foreground/5"
            >
              <div>
                <span className="text-3xl font-editorial-title font-bold text-brand-gold">{item.year}</span>
                <h3 className="text-sm font-bold text-foreground mt-3 mb-2">{t(`about.timeline.${item.id}.title`)}</h3>
                <p className="text-[10px] text-foreground/50 leading-relaxed italic">{t(`about.timeline.${item.id}.desc`)}</p>
              </div>
              <div className="absolute bottom-6 right-6 text-foreground/5 font-black text-6xl select-none pointer-events-none">
                0{idx + 1}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Meet the Artisans */}
      <section className="py-12">
        <div className="text-center mb-16">
          <span className="text-brand-gold uppercase tracking-hero text-[10px] font-black block">{t('about.team.teaser')}</span>
          <h2 className="text-3xl md:text-5xl font-editorial-title mt-2">{t('about.team.title')}</h2>
          <p className="text-xs text-foreground/50 mt-3 max-w-sm mx-auto leading-relaxed italic">
            {t('about.team.desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {artisans.map((artisan, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -8 }}
              className="bento-card glow-tracer p-6 text-center"
            >
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6 border border-brand-gold/20 bg-foreground/5">
                <img src={artisan.avatar} alt={artisan.name} className="w-full h-full object-cover" />
              </div>
              
              <h3 className="text-base font-bold text-foreground mb-1">{artisan.name}</h3>
              <span className="text-[9px] font-black uppercase tracking-widest text-brand-gold block mb-4">{t(`about.artisan.${artisan.id}.role`)}</span>
              <p className="text-[11px] text-foreground/50 leading-relaxed font-light italic">{t(`about.artisan.${artisan.id}.bio`)}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Brand values card */}
      <section className="bento-card p-10 md:p-16 bg-brand-gold text-black text-center relative overflow-hidden group shadow-xl shadow-brand-gold/10">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200')] bg-cover bg-center opacity-10 group-hover:scale-102 transition-all duration-1000 ease-out" />
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <Sparkles className="w-8 h-8 mx-auto text-black animate-pulse-slow" />
          <h3 className="text-3xl md:text-5xl font-editorial-title font-bold leading-tight whitespace-pre-line">{t('about.footer.title')}</h3>
          <p className="text-[11px] leading-relaxed max-w-md mx-auto font-semibold opacity-75">
            {t('about.footer.desc')}
          </p>
        </div>
      </section>
    </div>
  );
};
