import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Star, ShoppingCart, Eye, Grid, List, Sparkles, X, Heart, Check, QrCode, Smartphone } from 'lucide-react';
import { cn, formatPrice } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Link } from 'react-router-dom';
import { ARModal } from '../components/ARModal';
import { BespokeModal } from '../components/BespokeModal';
import { BentoSpotlight } from '../components/BentoSpotlight';
import { CustomSelect } from '../components/CustomSelect';
import { createPortal } from 'react-dom';
import { SEO } from '../components/SEO';


// Locally hosted premium generated images and stock items
const allProducts = [
  { id: '1', name: 'Baby Blue Chesterfield Sofa', price: 12000000, rating: 4.9, category: 'Sofa', image: '/images/sofa_blue.png', wood: 'Oak (Eman)', fabric: 'Baby Blue Velvet', size: '280cm x 180cm x 85cm' },
  { id: '2', name: 'Marble Dining Table Set', price: 8500000, rating: 4.8, category: 'Dining', image: '/images/sofa_brown.png', wood: 'Oak (Eman)', fabric: 'N/A', size: '220cm x 100cm x 75cm' },
  { id: '3', name: 'Gold & Black Luxury Bedroom Set', price: 15000000, rating: 5.0, category: 'Bedroom', image: '/images/bedroom_gold_black.png', wood: 'Oak & Ebony', fabric: 'Black Tufted Velvet', size: '200cm x 220cm x 120cm' },
  { id: '4', name: 'Beige Chesterfield Sofa', price: 13500000, rating: 4.9, category: 'Sofa', image: '/images/sofa_beige.png', wood: 'Birch (Qayrag\'och)', fabric: 'Sand Beige Velvet', size: '320cm x 200cm x 85cm' },
  { id: '5', name: 'Modern LED TV Wall Unit', price: 9800000, rating: 4.8, category: 'Luxury Decor', image: '/images/tv_gorka_modern.png', wood: 'MDF Walnut finish', fabric: 'N/A', size: '300cm x 45cm x 210cm' },
  { id: '6', name: 'Royal Gold TV Showcase', price: 17000000, rating: 5.0, category: 'Luxury Decor', image: '/images/tv_gorka_classic.png', wood: 'Carved Beechwood', fabric: 'Glass & Gold leaf', size: '340cm x 50cm x 230cm' },
  { id: '7', name: 'Olive Green Glossy Kitchen', price: 24000000, rating: 4.9, category: 'Dining', image: '/images/kitchen_green.png', wood: 'MDF Gloss Lacquer', fabric: 'Black Marble Counter', size: '360cm x 60cm x 240cm' },
  { id: '8', name: 'Modern White & Oak Kitchen', price: 21500000, rating: 4.8, category: 'Dining', image: '/images/kitchen_white_oak.png', wood: 'Natural Oak & MDF', fabric: 'White Quartz Counter', size: '320cm x 60cm x 220cm' },
  { id: '9', name: 'Neoclassical Gold Kitchen', price: 26000000, rating: 5.0, category: 'Dining', image: '/images/kitchen_neoclassic.png', wood: 'MDF Matt lacquer & Gold', fabric: 'Black Marble Counter', size: '400cm x 60cm x 240cm' },
  { id: '10', name: 'Contemporary Glossy Kitchen', price: 19800000, rating: 4.7, category: 'Dining', image: '/images/kitchen_glossy_white_black.png', wood: 'High Gloss Acrylic', fabric: 'Reflective Glass Backsplash', size: '300cm x 60cm x 220cm' },
];

type ShopProduct = (typeof allProducts)[number];

const categories = ['All', 'Sofa', 'Bedroom', 'Dining', 'Office', 'Luxury Decor'];

export const Shop = () => {
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const { wishlist, toggleWishlist: toggleGlobalWishlist, isInWishlist } = useWishlist();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState(20000000); // 20M UZS max
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [quickViewProduct, setQuickViewProduct] = useState<ShopProduct | null>(null);
  const [activeARProduct, setActiveARProduct] = useState<ShopProduct | null>(null);
  const [activeBespokeProduct, setActiveBespokeProduct] = useState<ShopProduct | null>(null);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Custom bespoke wood and fabric selection inside the modal
  const [bespokeWood, setBespokeWood] = useState('Walnut (Yong\'oq)');
  const [bespokeFabric, setBespokeFabric] = useState('Italian Velvet');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleToggleWishlist = (product: ShopProduct) => {
    toggleGlobalWishlist({
      id: product.id,
      name: t('product.' + product.id + '.name'),
      price: product.price,
      image: product.image,
      category: t('shop.category.' + product.category)
    });
    if (isInWishlist(product.id)) {
      triggerToast(t('shop.toast.wishlistRemoved'));
    } else {
      triggerToast(t('shop.toast.wishlistAdded'));
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddToCart = (product: ShopProduct, customized = false) => {
    const baseName = t('product.' + product.id + '.name');
    const name = customized ? `${baseName} (Custom)` : baseName;
    addToCart({
      id: product.id,
      name,
      price: product.price,
      image: product.image,
      category: t('shop.category.' + product.category),
      bespokeDetails: customized ? { wood: bespokeWood, fabric: bespokeFabric } : undefined,
    });
    triggerToast(name + t('shop.toast.added'));
    setQuickViewProduct(null);
  };

  const filteredProducts = allProducts.filter(p => 
    (selectedCategory === 'All' || p.category === selectedCategory) &&
    t('product.' + p.id + '.name').toLowerCase().includes(searchQuery.toLowerCase()) &&
    p.price <= priceRange &&
    (!showOnlyFavorites || isInWishlist(p.id))
  );

  return (
    <div className="pt-36 pb-20 px-6 max-w-7xl mx-auto min-h-screen">
      <SEO title={t('nav.shop')} />
      
      {/* Mini notification toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.9 }}
            className="fixed top-28 left-1/2 -translate-x-1/2 z-50 glass px-6 py-3.5 rounded-full border border-brand-gold/30 shadow-2xl flex items-center gap-3"
          >
            <div className="w-5 h-5 bg-brand-gold text-black rounded-full flex items-center justify-center">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              {toastMessage}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pb-8 border-b border-foreground/5">
        <div>
          <span className="text-brand-gold uppercase tracking-hero text-[10px] font-black block">{t('shop.hero.teaser')}</span>
          <h1 className="text-4xl md:text-6xl font-editorial-title mt-2 mb-3">
            {t('shop.hero.title')} <span className="font-bold italic gold-foil-text">{t('shop.hero.titleGold')}</span>
          </h1>
          <p className="text-foreground/45 text-[9px] uppercase tracking-hero font-extrabold">{t('shop.hero.desc')}</p>
        </div>
        
        {/* Toggle Grid/List and Category Chips */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
          {/* Category Scroller */}
          <div className="flex bg-foreground/5 border border-foreground/5 p-1 rounded-2xl overflow-x-auto w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  selectedCategory === cat 
                    ? "bg-brand-gold text-black shadow-md font-bold" 
                    : "text-foreground/45 hover:text-foreground"
                )}
              >
                {t('shop.category.' + cat)}
              </button>
            ))}
          </div>

          {/* Toggle View button */}
          <div className="hidden md:flex bg-foreground/5 p-1 rounded-xl gap-1">
            <button 
              onClick={() => setViewType('grid')} 
              className={cn("p-2 rounded-lg transition-colors", viewType === 'grid' ? "bg-brand-gold text-black shadow" : "text-foreground/40")}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewType('list')} 
              className={cn("p-2 rounded-lg transition-colors", viewType === 'list' ? "bg-brand-gold text-black shadow" : "text-foreground/40")}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Left Sidebar Filters */}
        <aside className="space-y-8 lg:col-span-1">
          {/* Search Box */}
          <div className="bento-card glow-tracer p-8">
            <h3 className="text-[10px] font-black uppercase tracking-hero mb-5 text-brand-gold">{t('shop.filter.search')}</h3>
            <div className="relative group mb-4">
              <input 
                type="text" 
                placeholder={t('shop.filter.searchPlaceholder')} 
                className="w-full bg-foreground/5 border border-foreground/10 focus:border-brand-gold rounded-xl px-4 py-3 text-xs focus:outline-none transition-colors placeholder:text-foreground/20 italic text-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute right-4 top-3.5 w-4 h-4 text-foreground/20 group-hover:text-brand-gold transition-colors" />
            </div>

            {/* Premium Favorites Toggle Button */}
            <button
              onClick={() => setShowOnlyFavorites(prev => !prev)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl border",
                showOnlyFavorites 
                  ? "bg-red-500/10 border-red-500/30 text-red-500 font-bold" 
                  : "bg-foreground/5 border-foreground/10 text-foreground/50 hover:border-brand-gold hover:text-brand-gold"
              )}
            >
              <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                <Heart className={cn("w-3.5 h-3.5", showOnlyFavorites ? "fill-current" : "")} />
                {t('shop.filter.favorites')} ({wishlist.length})
              </span>
              <span className="text-[8px] uppercase tracking-widest bg-foreground/10 px-2 py-0.5 rounded font-black">
                {showOnlyFavorites ? "ON" : "OFF"}
              </span>
            </button>
          </div>

          {/* Price Range Filter */}
          <div className="bento-card glow-tracer p-8">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-[10px] font-black uppercase tracking-hero text-brand-gold">{t('shop.filter.price')}</h3>
              <span className="text-xs font-bold text-foreground/70">{t('shop.filter.priceRange')} {formatPrice(priceRange)}</span>
            </div>
            <input 
              type="range" 
              min={2000000}
              max={20000000}
              step={500000}
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-foreground/30 mt-3">
              <span>{formatPrice(2000000)}</span>
              <span>{formatPrice(20000000)}</span>
            </div>
          </div>

          {/* Bespoke Inquiry Card */}
          <div className="bento-card p-8 bg-brand-gold text-black relative overflow-hidden group shadow-lg shadow-brand-gold/15">
             <div className="absolute -right-16 -bottom-16 w-36 h-36 bg-black/10 rounded-full blur-2xl group-hover:scale-110" />
             <Sparkles className="w-6 h-6 mb-4 text-black animate-pulse-slow" />
             <h4 className="text-sm font-extrabold uppercase tracking-wider mb-2">{t('shop.bespoke.title')}</h4>
             <p className="text-[10px] leading-relaxed mb-6 font-semibold opacity-75">
               {t('shop.bespoke.desc')}
             </p>
             <Link 
               to="/contact" 
               className="w-full py-3.5 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-hero text-center block hover:scale-[1.02] active:scale-95"
             >
               {t('shop.bespoke.cta')}
             </Link>
          </div>
        </aside>

        {/* Right Product Grid */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
          <motion.div 
            key={viewType}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              viewType === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" 
                : "flex flex-col gap-6"
            )}
          >
            {filteredProducts.map((product, index) => (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                key={product.id}
                className="flex flex-col"
              >
                {viewType === 'grid' ? (
                  <BentoSpotlight className="group flex-grow flex flex-col justify-between">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-t-[1.8rem]">
                      <img 
                        src={product.image} 
                        alt={t('product.' + product.id + '.name')} 
                        className="w-full h-full object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-105" 
                      />
                      
                      {/* Subtle dark overlay on hover — only on the image */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-500 pointer-events-none z-10" />
                      
                      {/* Floating actions — above all overlays */}
                      <div className="absolute top-4 right-4 flex flex-col gap-2 z-30">
                        <button 
                          onClick={() => handleToggleWishlist(product)}
                          className={cn(
                            "p-2.5 rounded-full shadow-lg glass",
                            isInWishlist(product.id) ? "bg-red-500 text-white" : "text-foreground hover:scale-110"
                          )}
                        >
                          <Heart className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button 
                          onClick={() => setQuickViewProduct(product)}
                          className="p-2.5 glass text-foreground rounded-full shadow-lg hover:scale-110"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      <div className="absolute top-4 left-4 glass px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest text-foreground z-30">
                        {t('shop.category.' + product.category)}
                      </div>
                    </div>
                    
                    <div className="p-6 flex flex-col flex-grow justify-between">
                      <div className="mb-4">
                        <div className="flex items-center justify-between gap-2">
                           <h3 className="text-base font-bold tracking-tight text-foreground">{t('product.' + product.id + '.name')}</h3>
                           <div className="flex items-center gap-1 text-brand-gold text-[10px] font-bold shrink-0">
                             <Star className="w-3 h-3 fill-current" /> {product.rating}
                           </div>
                        </div>
                        <p className="text-[10px] text-foreground/45 leading-relaxed italic line-clamp-2 mt-2">
                          {t('shop.product.materialLabel')} {product.wood} | {product.fabric}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-foreground/5">
                        <span className="price-tag text-xl font-bold">{formatPrice(product.price)}</span>
                        <button 
                          onClick={() => handleAddToCart(product)}
                          className="bg-brand-gold text-black p-3.5 rounded-xl flex items-center justify-center hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-gold/30 active:scale-95 transition-all duration-300 will-change-transform shadow-md shadow-brand-gold/15"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </BentoSpotlight>
                ) : (
                  <div className="bento-card glow-tracer p-6 flex flex-col md:flex-row items-center gap-8 group w-full">
                    <div className="w-1/3 min-w-[140px] md:min-w-[200px] h-full relative overflow-hidden shrink-0">
                      <img src={product.image} alt={t('product.' + product.id + '.name')} className="w-full h-full object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-105" />
                      <div className="absolute top-2 left-2 glass px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-foreground">
                        {t('shop.category.' + product.category)}
                      </div>
                    </div>

                    <div className="flex-grow space-y-3 text-center md:text-left">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <h3 className="text-xl font-bold text-foreground">{t('product.' + product.id + '.name')}</h3>
                        <div className="flex items-center justify-center md:justify-start gap-1 text-brand-gold text-[10px] font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" /> {product.rating} ({t('shop.product.viewRating')})
                        </div>
                      </div>
                      <p className="text-xs text-foreground/50 leading-relaxed font-light italic">
                        {t('product.' + product.id + '.desc')}
                      </p>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-[10px] font-bold uppercase tracking-wider text-foreground/45">
                        <span>{t('shop.product.sizeLabel')} <strong className="text-foreground">{product.size}</strong></span>
                        <span>{t('shop.product.woodLabel')} <strong className="text-brand-gold">{product.wood}</strong></span>
                      </div>
                    </div>

                    <div className="shrink-0 text-center md:text-right flex flex-col justify-center gap-3 min-w-[150px]">
                      <span className="price-tag text-2xl font-bold">{formatPrice(product.price)}</span>
                      <button 
                        onClick={() => handleAddToCart(product)}
                        className="w-full py-3 bg-brand-gold text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-102 shadow shadow-brand-gold/15"
                      >
                        {t('nav.cart')}
                      </button>
                      <button 
                        onClick={() => setQuickViewProduct(product)}
                        className="w-full py-2 bg-foreground/5 hover:bg-foreground/10 text-foreground rounded-xl text-[9px] font-black uppercase tracking-widest"
                      >
                        {t('shop.product.quickView')}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
          </AnimatePresence>
          
          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-40 bento-card border-dashed">
              <Search className="w-12 h-12 text-foreground/10 mb-4 animate-bounce" />
              <p className="text-foreground/45 text-[10px] italic tracking-widest uppercase font-black">{t('shop.product.noResults')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modern Quick View Modal Dialog */}
      {createPortal(
        <AnimatePresence>
          {quickViewProduct && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center md:px-4 overflow-y-auto">
              {/* Backdrop layer */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setQuickViewProduct(null)}
                className="fixed inset-0 bg-black/60 backdrop-blur-md"
              />
              
              {/* Modal Dialog Card */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-background border-0 md:border border-foreground/5 rounded-none md:rounded-[2.5rem] w-full max-w-4xl p-5 md:p-8 relative z-10 shadow-2xl flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-8 min-h-[100dvh] md:min-h-0 max-h-[100dvh] md:max-h-[90vh] overflow-y-auto overflow-x-hidden"
              >
                {/* Close trigger button */}
                <button 
                  onClick={() => setQuickViewProduct(null)}
                  className="absolute right-4 top-4 md:right-6 md:top-6 p-2 rounded-full bg-background/50 backdrop-blur-md md:bg-transparent hover:bg-foreground/5 transition-colors z-20 text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Left Side Visual Preview */}
                <div className="w-full h-[260px] sm:h-[320px] md:h-[420px] rounded-2xl md:rounded-3xl overflow-hidden relative bg-foreground/5 shrink-0">
                  <img src={quickViewProduct.image} alt={t('product.' + quickViewProduct.id + '.name')} className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4 glass px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-foreground">
                    {t('shop.category.' + quickViewProduct.category)}
                  </div>
                </div>

                {/* Right Side Options & Customization */}
                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-gold block mb-1">{t('shop.modal.artisanBlock')}</span>
                    <h3 className="text-xl md:text-2xl font-editorial-title font-bold text-foreground mb-3">{t('product.' + quickViewProduct.id + '.name')}</h3>
                    
                    <div className="flex flex-wrap items-center gap-4 text-[10px] uppercase font-bold text-foreground/45 tracking-wider mb-4 pb-3 border-b border-foreground/5">
                      <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-current text-brand-gold" /> {quickViewProduct.rating} {t('shop.modal.ratingLabel')}</span>
                      <span>{t('shop.product.sizeLabel')} <strong className="text-foreground">{quickViewProduct.size}</strong></span>
                    </div>

                    <p className="text-[11px] text-foreground/50 leading-relaxed font-light italic mb-5">
                      {t('shop.modal.customDesc')}
                    </p>

                    {/* Wood and Upholstery Selection Controls inside Modal - Side by Side Grid */}
                    <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
                      <div className="flex flex-col justify-between h-full">
                        <label className="text-[9px] font-black uppercase tracking-widest text-foreground/40 block mb-2">{t('shop.modal.woodLabel')}</label>
                        <CustomSelect 
                          value={bespokeWood}
                          onChange={setBespokeWood}
                          options={[
                            { value: "Walnut (Yong'oq)", label: "Walnut (Oliy Yong'oq)" },
                            { value: "Oak (Eman)", label: "Oak (Klassik Eman)" },
                            { value: "Birch (Qayrag'och)", label: "Birch (Eco Qayrag'och)" }
                          ]}
                          className="mt-auto"
                        />
                      </div>

                      <div className="flex flex-col justify-between h-full">
                        <label className="text-[9px] font-black uppercase tracking-widest text-foreground/40 block mb-2">{t('shop.modal.fabricLabel')}</label>
                        <CustomSelect 
                          value={bespokeFabric}
                          onChange={setBespokeFabric}
                          options={[
                            { value: "Italian Velvet", label: "Italian Velvet (Baxmal)" },
                            { value: "Full-grain Leather", label: "Full-grain Leather (Charm)" },
                            { value: "Premium Textile", label: "Premium Textile (Mato)" }
                          ]}
                          className="mt-auto"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-foreground/5 space-y-4 mt-auto">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-black tracking-widest text-foreground/40">{t('shop.modal.totalPrice')}</span>
                        <span className="price-tag text-2xl font-bold">{formatPrice(quickViewProduct.price)}</span>
                      </div>
                      
                      <button 
                        onClick={() => handleAddToCart(quickViewProduct, true)}
                        className="w-full sm:w-auto px-6 bg-brand-gold text-black py-3.5 rounded-2xl font-extrabold text-[10px] uppercase tracking-hero hover:bg-brand-gold-muted transition-colors shadow-lg shadow-brand-gold/15 flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" /> {t('common.addToCart')}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button 
                        onClick={() => {
                          setActiveBespokeProduct(quickViewProduct);
                          setQuickViewProduct(null);
                        }}
                        className="py-3 px-4 bg-foreground/5 border border-foreground/10 hover:border-brand-gold hover:text-brand-gold rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wider text-foreground"
                      >
                        <Smartphone className="w-4 h-4 text-brand-gold" />
                        VIP Buyurtma
                      </button>
                      <button 
                        onClick={() => {
                          setActiveARProduct(quickViewProduct);
                          setQuickViewProduct(null);
                        }}
                        className="py-3 px-4 bg-foreground/5 border border-foreground/10 hover:border-brand-gold hover:text-brand-gold rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wider text-foreground"
                      >
                        <QrCode className="w-4 h-4 text-brand-gold" />
                        AR Kamera
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Luxury Modals */}
      {activeARProduct && (
        <ARModal 
          isOpen={!!activeARProduct}
          onClose={() => setActiveARProduct(null)}
          productName={t('product.' + activeARProduct.id + '.name')}
          productId={String(activeARProduct.id)}
        />
      )}

      {activeBespokeProduct && (
        <BespokeModal 
          isOpen={!!activeBespokeProduct}
          onClose={() => setActiveBespokeProduct(null)}
          product={{
            id: activeBespokeProduct.id,
            name: activeBespokeProduct.name,
            price: activeBespokeProduct.price,
            image: activeBespokeProduct.image
          }}
        />
      )}
    </div>
  );
};
