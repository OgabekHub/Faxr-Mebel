import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SEO } from '../components/SEO';

export const NotFound = () => {
  const { t } = useTranslation();

  return (
    <div className="pt-36 pb-24 px-6 max-w-7xl mx-auto min-h-[calc(100vh-9rem)] flex flex-col items-center justify-center text-center">
      <SEO title={t('notFound.title')} />
      <span className="text-brand-gold uppercase tracking-hero text-[10px] font-black block">{t('notFound.teaser')}</span>
      <h1 className="text-5xl md:text-7xl font-editorial-title mt-3 mb-4">
        404 <span className="font-bold italic gold-foil-text">{t('notFound.title')}</span>
      </h1>
      <p className="text-xs text-foreground/50 max-w-md leading-relaxed font-light italic mb-10">{t('notFound.desc')}</p>
      <Link
        to="/"
        className="bg-brand-gold text-black px-8 py-3.5 rounded-full font-bold text-xs uppercase tracking-hero hover:scale-105 inline-flex items-center gap-2 shadow-lg shadow-brand-gold/15"
      >
        <ArrowLeft className="w-4 h-4" /> {t('notFound.cta')}
      </Link>
    </div>
  );
};
