import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Star, Shield, MapPin, Clock, Phone, Send, Check, QrCode, Smartphone, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { ARModal } from '../components/ARModal';
import { BespokeModal } from '../components/BespokeModal';
import { BentoSpotlight } from '../components/BentoSpotlight';
import { SEO } from '../components/SEO';

interface HeroSlide {
  image: string;
  collectionKey: string;
  ctaLink: string;
  /** Either translation keys... */
  titleKey?: string;
  titleGoldKey?: string;
  /** ...or inline per-language titles (moved to i18n keys in Faza 5). */
  titleUz?: string;
  titleRu?: string;
  titleEn?: string;
  titleGoldUz?: string;
  titleGoldRu?: string;
  titleGoldEn?: string;
}

// Immersive Hero slides data
const heroSlides: HeroSlide[] = [
  {
    image: '/images/sofa.png',
    collectionKey: 'home.hero.collection',
    titleKey: 'home.hero.title',
    titleGoldKey: 'home.hero.titleGold',
    ctaLink: '/shop',
  },
  {
    image: '/images/bedroom_gold_black.png',
    collectionKey: 'about.heritage.teaser',
    titleUz: 'Dabdabali Yotoqxona',
    titleRu: 'Роскошная Спальня',
    titleEn: 'Luxury Bedchamber',
    titleGoldUz: 'Mukammal Orom.',
    titleGoldRu: 'Королевский Сон.',
    titleGoldEn: 'Royal Comfort.',
    ctaLink: '/shop',
  },
  {
    image: '/images/kitchen_neoclassic.png',
    collectionKey: 'materials.teaser',
    titleUz: 'Premium Oshxonalar',
    titleRu: 'Премиум Кухни',
    titleEn: 'Artisan Kitchens',
    titleGoldUz: 'Masterklass Sifat.',
    titleGoldRu: 'Идеальный Дизайн.',
    titleGoldEn: 'Exquisite Style.',
    ctaLink: '/shop',
  }
];

// Premium locally hosted generated mebel assets
const featuredProducts = [
  {
    id: '1',
    name: 'Baby Blue Chesterfield Sofa',
    price: 12000000,
    rating: 4.9,
    image: '/images/sofa_blue.png',
    category: 'Sofa'
  },
  {
    id: '2',
    name: 'Marble Dining Table Set',
    price: 8500000,
    rating: 4.8,
    image: '/images/sofa_brown.png',
    category: 'Dining'
  },
  {
    id: '3',
    name: 'Gold & Black Luxury Bedroom Set',
    price: 15000000,
    rating: 5.0,
    image: '/images/bedroom_gold_black.png',
    category: 'Bedroom'
  }
];

type FeaturedProduct = (typeof featuredProducts)[number];

export const Home = () => {
  const { t, i18n } = useTranslation();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [addedToast, setAddedToast] = useState<string | null>(null);
  const [isAROpen, setIsAROpen] = useState(false);
  const [isBespokeOpen, setIsBespokeOpen] = useState(false);

  // Hero Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  const handleNextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const handlePrevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const getSlideTexts = (slide: HeroSlide) => {
    const lang = i18n.language || 'uz';
    let collection = '';
    let title = '';
    let titleGold = '';

    if (slide.collectionKey) {
      collection = t(slide.collectionKey);
    }
    if (slide.titleKey && slide.titleGoldKey) {
      title = t(slide.titleKey);
      titleGold = t(slide.titleGoldKey);
    } else {
      if (lang.startsWith('uz')) {
        title = slide.titleUz || '';
        titleGold = slide.titleGoldUz || '';
      } else if (lang.startsWith('ru')) {
        title = slide.titleRu || '';
        titleGold = slide.titleGoldRu || '';
      } else {
        title = slide.titleEn || '';
        titleGold = slide.titleGoldEn || '';
      }
    }
    return { collection, title, titleGold };
  };

  const handleAddToCart = (product: FeaturedProduct) => {
    const name = t(`product.${product.id}.name`);
    addToCart({
      id: product.id,
      name,
      price: product.price,
      image: product.image,
      category: t(`shop.category.${product.category}`),
    });
    setAddedToast(name);
    setTimeout(() => setAddedToast(null), 3000);
  };

  const currentSlideData = heroSlides[currentSlide];
  const { collection: sCollection, title: sTitle, titleGold: sTitleGold } = getSlideTexts(currentSlideData);

  const handleToggleWishlist = (product: FeaturedProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({
      id: product.id,
      name: t(`product.${product.id}.name`),
      price: product.price,
      image: product.image,
      category: t(`shop.category.${product.category}`)
    });
    setAddedToast(isInWishlist(product.id) ? t('shop.toast.wishlistRemoved') : t('shop.toast.wishlistAdded'));
    setTimeout(() => setAddedToast(null), 3000);
  };

  return (
    <div className="flex flex-col pt-32 px-6 gap-16 max-w-7xl mx-auto mb-20 overflow-hidden">
      <SEO title={t('nav.home')} />
      
      {/* Toast Notification */}
      <AnimatePresence>
        {addedToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-28 left-1/2 -translate-x-1/2 z-50 glass px-6 py-3.5 rounded-full border border-brand-gold/30 shadow-2xl flex items-center gap-3"
          >
            <div className="w-5 h-5 bg-brand-gold text-black rounded-full flex items-center justify-center">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              {addedToast} {t('home.toast.added')}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bento Grid Header / Hero */}
      <div className="grid grid-cols-1 md:grid-cols-12 grid-rows-auto md:grid-rows-6 gap-5 min-h-[850px] md:h-[90vh]">
        
        {/* Main Hero Card - Animated Slider */}
        <div className="col-span-1 md:col-span-8 row-span-4 rounded-[3rem] overflow-hidden relative group border border-foreground/5 bento-card">
          
          {/* Background Image Carousel with Ken Burns effect */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 0.65, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
              className="absolute inset-0 bg-cover bg-center animate-ken-burns"
              style={{ backgroundImage: `url(${currentSlideData.image})` }}
            />
          </AnimatePresence>
          
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent"></div>
          
          {/* Slide Content */}
          <div className="absolute bottom-12 left-8 md:left-12 right-12 text-white z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
              >
                <span className="text-brand-gold uppercase tracking-hero text-[10px] font-extrabold mb-4 block">
                  {sCollection}
                </span>
                
                {/* Cinematic animated heading */}
                <h1 className="text-4xl md:text-6xl font-editorial-title mb-6 leading-tight">
                  {sTitle.split(' ').map((word, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                      className="inline-block mr-3"
                    >
                      {word}
                    </motion.span>
                  ))}
                  <br className="hidden sm:inline" />
                  <motion.span
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="font-bold italic gold-foil-text block sm:inline-block"
                  >
                    {sTitleGold}
                  </motion.span>
                </h1>
                
                <div className="flex items-center gap-4">
                  <Link to="/shop" className="bg-brand-gold text-black px-8 py-4 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-brand-gold-muted shadow-xl shadow-brand-gold/20">
                    {t('cta.shop')}
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Left/Right controls (Fade in on hover) */}
          <button
            onClick={handlePrevSlide}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full glass border border-white/10 hover:border-brand-gold text-white hover:text-brand-gold flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextSlide}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full glass border border-white/10 hover:border-brand-gold text-white hover:text-brand-gold flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicators / Progress bars */}
          <div className="absolute bottom-6 right-8 left-8 sm:left-auto sm:right-12 z-20 flex gap-2.5">
            {heroSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentSlide(idx);
                }}
                className="group/btn relative py-2"
              >
                <div className={`h-[3px] rounded-full transition-all duration-500 ${
                  currentSlide === idx ? 'w-8 bg-brand-gold' : 'w-3.5 bg-white/35 hover:bg-white/60'
                }`} />
              </button>
            ))}
          </div>

        </div>

        {/* Featured Mini Card */}
        <motion.div
          initial={{ opacity: 0, x: 25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="col-span-1 md:col-span-4 row-span-2 flex"
        >
          <BentoSpotlight className="p-8 justify-between flex-grow flex flex-col">
            <div>
              <span className="text-foreground/45 text-[10px] uppercase tracking-widest font-black block">{t('home.featured.teaser')}</span>
              <h3 className="text-xl font-bold mt-2">{t(`product.${featuredProducts[0].id}.name`)}</h3>
              <p className="text-foreground/50 text-[11px] mt-1.5 font-light italic">{t('home.featured.desc')}</p>
              <span className="price-tag text-2xl mt-4 block italic">{formatPrice(12000000)}</span>
            </div>
            <div className="flex gap-2 mt-6">
              <button 
                onClick={() => handleAddToCart(featuredProducts[0])}
                className="flex-1 py-3.5 bg-brand-gold text-black rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-brand-gold-muted shadow-lg shadow-brand-gold/10"
              >
                {t('common.addToCart')}
              </button>
              <button 
                onClick={() => setIsBespokeOpen(true)}
                className="p-3.5 bg-foreground/5 border border-foreground/10 hover:border-brand-gold hover:text-brand-gold rounded-2xl flex items-center justify-center"
                title="Bespoke Order"
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsAROpen(true)}
                className="p-3.5 bg-foreground/5 border border-foreground/10 hover:border-brand-gold hover:text-brand-gold rounded-2xl flex items-center justify-center"
                title="AR View"
              >
                <QrCode className="w-4 h-4" />
              </button>
            </div>
          </BentoSpotlight>
        </motion.div>

        {/* Warranty Card */}
        <motion.div
           initial={{ opacity: 0, x: 25 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.3, duration: 0.6 }}
           className="col-span-1 md:col-span-2 row-span-2 flex"
        >
          <BentoSpotlight className="bg-brand-gold text-black p-8 justify-between flex-grow flex flex-col relative overflow-hidden group shadow-lg shadow-brand-gold/10">
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125" />
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white shrink-0">
              <Shield className="w-5 h-5 text-brand-gold" />
            </div>
            <div className="mt-4">
              <h4 className="font-extrabold text-sm uppercase tracking-wider leading-tight whitespace-pre-line">{t('home.warranty.title')}</h4>
              <p className="text-[9px] opacity-75 mt-1 font-semibold italic">{t('home.warranty.desc')}</p>
            </div>
          </BentoSpotlight>
        </motion.div>

        {/* Rating Card */}
        <motion.div
           initial={{ opacity: 0, x: 25 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.4, duration: 0.6 }}
           className="col-span-1 md:col-span-2 row-span-2 flex"
        >
          <BentoSpotlight className="flex-col items-center justify-center text-center p-6 flex-grow flex">
            <div className="text-4xl font-editorial-title text-brand-gold mb-1 font-bold">4.9 / 5</div>
            <div className="flex space-x-1 mb-2 text-brand-gold">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
            </div>
            <div className="text-[9px] uppercase font-black text-foreground/45 tracking-widest">{t('home.rating.desc')}</div>
          </BentoSpotlight>
        </motion.div>

        {/* Small Teasers */}
        <BentoSpotlight className="col-span-1 md:col-span-4 row-span-2 overflow-hidden flex flex-col group">
          <div className="p-6">
            <h3 className="text-xs font-black uppercase tracking-widest">{t('home.teaser1.title')}</h3>
            <p className="text-[10px] text-foreground/45 mt-1 italic">{t('home.teaser1.desc')}</p>
          </div>
          <div className="flex-grow bg-[url('/images/bed.png')] bg-cover bg-center min-h-[140px] group-hover:scale-105"></div>
        </BentoSpotlight>

        <BentoSpotlight className="col-span-1 md:col-span-4 row-span-2 overflow-hidden flex flex-col group">
          <div className="p-6">
            <h3 className="text-xs font-black uppercase tracking-widest">{t('home.teaser2.title')}</h3>
            <p className="text-[10px] text-foreground/45 mt-1 italic">{t('home.teaser2.desc')}</p>
          </div>
          <div className="flex-grow bg-[url('/images/dining_table.png')] bg-cover bg-center min-h-[140px] group-hover:scale-105"></div>
        </BentoSpotlight>

        <BentoSpotlight className="col-span-1 md:col-span-4 row-span-2 p-8 justify-center border-l-4 border-l-brand-gold flex flex-col">
          <p className="text-xs leading-relaxed italic text-foreground/75 font-light">
            {t('home.testimonial.text')}
          </p>
          <div className="flex items-center mt-6 space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-foreground/5 overflow-hidden shrink-0">
               <img src="https://i.pravatar.cc/150?u=9" alt="Elena" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider">{t('home.testimonial.name')}</div>
              <div className="text-[8px] text-foreground/45 uppercase tracking-widest font-black">{t('home.testimonial.role')}</div>
            </div>
          </div>
        </BentoSpotlight>

      </div>

      {/* Featured Products Section */}
      <section className="py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-brand-gold uppercase tracking-hero text-[10px] font-black block">{t('featured.teaser')}</span>
            <h2 className="text-3xl md:text-5xl font-editorial-title mt-2">{t('featured.title')}</h2>
            <p className="text-xs text-foreground/50 italic mt-1">{t('featured.desc')}</p>
          </div>
          <Link to="/shop" className="text-brand-gold font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:translate-x-2">
            {t('common.seeAll')} <ArrowRight className="w-4 h-4 text-brand-gold" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredProducts.map((product) => (
            <motion.div 
              key={product.id}
              whileHover={{ y: -8 }}
              className="bento-card glow-tracer p-6 group flex flex-col h-full"
            >
              <div className="relative aspect-square rounded-[1.8rem] overflow-hidden mb-6">
                <img src={product.image} alt={t(`product.${product.id}.name`)} className="w-full h-full object-cover group-hover:scale-105" />
                
                {/* Floating actions */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                  <button 
                    onClick={(e) => handleToggleWishlist(product, e)}
                    className={`p-2.5 rounded-full shadow-md ${
                      isInWishlist(product.id) ? "bg-red-500 text-white" : "glass text-foreground hover:scale-110"
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>

                <div className="absolute top-4 left-4 glass px-4 py-1.5 rounded-full text-[9px] font-black text-brand-gold uppercase tracking-widest">
                  {t(`shop.category.${product.category}`)}
                </div>
              </div>
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-foreground">{t(`product.${product.id}.name`)}</h3>
                  <div className="flex items-center gap-1 mt-1 text-brand-gold text-[10px] font-bold">
                    <Star className="w-3 h-3 fill-current" /> {product.rating}
                  </div>
                </div>
                <span className="price-tag text-lg font-bold shrink-0 ml-2">{formatPrice(product.price)}</span>
              </div>
              
              <button 
                onClick={() => handleAddToCart(product)}
                className="w-full mt-auto py-3 bg-foreground/5 hover:bg-brand-gold hover:text-black rounded-xl text-[9px] font-black uppercase tracking-widest border border-foreground/5"
              >
                {t('common.addToCart')}
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Showroom & consultation Section */}
      <section className="py-12 border-t border-foreground/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[550px]">
           <div className="bento-card p-10 md:p-12 flex flex-col justify-between">
              <div>
                <span className="text-brand-gold uppercase tracking-hero text-[10px] font-black block">{t('showroom.teaser')}</span>
                <h2 className="text-3xl md:text-5xl font-editorial-title mt-2 mb-4">{t('showroom.title')}</h2>
                <div className="flex items-center gap-3 text-brand-gold mb-6">
                  <MapPin className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-widest">Tashkent, Uzbekistan</span>
                </div>
                <p className="text-xs text-foreground/55 leading-relaxed mb-8 font-light italic">
                  {t('showroom.desc')}
                </p>
                <div className="space-y-3.5">
                   <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-foreground/75">
                      <Clock className="w-4 h-4 text-brand-gold" /> 
                      <span>{t('showroom.hours')}</span>
                   </div>
                   <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-foreground/75">
                      <Phone className="w-4 h-4 text-brand-gold" /> 
                      <span>{t('showroom.phone')}</span>
                   </div>
                </div>
              </div>
              
              <Link to="/contact" className="w-full mt-10 py-4 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-black rounded-full font-bold text-xs uppercase tracking-widest text-center">
                {t('showroom.cta')}
              </Link>
           </div>
           
           <div className="bento-card overflow-hidden h-[350px] lg:h-auto">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1891.13!2d69.24!3d41.31!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDHCsDE4JzM2LjAiTiA2OcKwMTQnMjQuMCJF!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                className="grayscale dark:invert opacity-75 hover:opacity-100 transition-opacity duration-500"
                loading="lazy" 
                title="Faxr Mebel Showroom Map"
              ></iframe>
           </div>
        </div>
      </section>

      {/* Floating CTA for Mobile Telegram Group */}
      <div className="fixed bottom-6 right-6 z-40 md:hidden flex flex-col gap-4">
        <a href="https://t.me/faxrmebel" target="_blank" rel="noopener noreferrer" className="bg-[#229ED9] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95">
          <Send className="w-6 h-6" />
        </a>
      </div>

      {/* Luxury Modals */}
      <ARModal 
        isOpen={isAROpen}
        onClose={() => setIsAROpen(false)}
        productName={t(`product.${featuredProducts[0].id}.name`)}
        productId={featuredProducts[0].id}
      />

      <BespokeModal 
        isOpen={isBespokeOpen}
        onClose={() => setIsBespokeOpen(false)}
        product={{
          id: featuredProducts[0].id,
          name: featuredProducts[0].name,
          price: featuredProducts[0].price,
          image: featuredProducts[0].image
        }}
      />
    </div>
  );
};
