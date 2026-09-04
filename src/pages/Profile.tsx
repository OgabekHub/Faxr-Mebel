import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Heart, ShoppingBag, Send, Award, Clock, CheckCircle } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn, formatPrice } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { CustomSelect } from '../components/CustomSelect';
import { useWishlist } from '../context/WishlistContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { Order } from '../types/domain';

export const Profile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { wishlist } = useWishlist();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist'>('orders');

  // Real Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const uid = user?.uid ?? null;

  // One orders listener per signed-in user; the cleanup runs on uid change and unmount (no leak).
  useEffect(() => {
    if (!uid) {
      // Signed out: ProtectedRoute redirects to /auth, so nothing to show here.
      setOrders([]);
      setSelectedOrderId(null);
      setOrdersLoading(false);
      return;
    }

    setOrdersLoading(true);
    const q = query(collection(db, 'orders'), where('userId', '==', uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders: Order[] = snapshot.docs.map(doc => ({
        ...(doc.data() as Omit<Order, 'id'>),
        id: doc.id,
      }));

      // Sort by date (newest first)
      fetchedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setOrders(fetchedOrders);
      if (fetchedOrders.length > 0) {
        setSelectedOrderId(prev => prev || fetchedOrders[0].id);
      }
      setOrdersLoading(false);
    }, (error) => {
      console.error("Firestore orders query failed:", error);
      setOrdersLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/auth');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const currentOrder = useMemo(() => {
    const order = orders.find(o => o.id === selectedOrderId);
    if (!order) return null;

    const itemNames = order.items?.map((it) => `${it.name} (x${it.quantity})`).join(', ') || 'Faxr Mebel Mahsuloti';
    const firstBespoke = order.items?.find((it) => it.bespokeDetails);
    const wood = firstBespoke?.bespokeDetails?.wood || 'Walnut (Yong\'oq)';
    const fabric = firstBespoke?.bespokeDetails?.fabric || 'Italiya Baxmali';
    const packaging = order.addons?.premiumBox ? t('profile.packagingWood', 'Yog\'och quti') : t('profile.packagingStandard', 'Standart qadoq');

    const steps = [
      { 
        label: t('profile.status.received', 'Buyurtma qabul qilindi'), 
        desc: order.paymentStatus === 'paid' 
          ? t('profile.status.receivedPaidDesc', 'Sizning to\'lovingiz tasdiqlandi va buyurtma ro\'yxatga olindi.') 
          : t('profile.status.receivedPendingDesc', 'Buyurtma qabul qilindi. Menejer to\'lov va parametrlarni tasdiqlash uchun bog\'lanadi.'), 
        status: order.status === 'pending' ? 'active' : 'completed' 
      },
      { 
        label: t('profile.status.wood', 'Yog\'och saralanmoqda'), 
        desc: t('profile.status.woodDesc', { wood, defaultValue: `Ustaxonamizdan oliy navli ${wood} yog'ochi ajratib olindi.` }),
        status: order.status === 'pending' ? 'pending' : order.status === 'wood' ? 'active' : 'completed' 
      },
      { 
        label: t('profile.status.artisan', 'Usta qo\'lida sayqallanmoqda'), 
        desc: t('profile.status.artisanDesc', 'Bosh duradgor Rustamali mebelni qo\'lda tayyorlamoqda.'), 
        status: (order.status === 'pending' || order.status === 'wood') ? 'pending' : order.status === 'artisan' ? 'active' : 'completed' 
      },
      { 
        label: t('profile.status.quality', 'Sifat nazorati'), 
        desc: t('profile.status.qualityDesc', 'Mebel choklari va yuklama chidamliligi tekshiriladi.'), 
        status: (order.status === 'pending' || order.status === 'wood' || order.status === 'artisan') ? 'pending' : order.status === 'quality' ? 'active' : 'completed' 
      },
      { 
        label: t('profile.status.delivery', 'Yetkazib berish va o\'rnatish'), 
        desc: t('profile.status.deliveryDesc', 'Bepul yetkazib berilib, xonadoningizga yig\'ib beriladi.'), 
        status: order.status === 'completed' ? 'completed' : 'pending' 
      }
    ];

    return {
      ...order,
      itemNames,
      wood,
      fabric,
      packaging,
      steps
    };
  }, [orders, selectedOrderId, t]);

  if (loading) {
    return (
      <div className="pt-44 pb-20 text-center h-screen flex flex-col items-center justify-center">
        <Clock className="w-12 h-12 text-brand-gold animate-spin mb-4" />
        <span className="text-xs uppercase tracking-hero text-foreground/40 font-bold">{t('profile.loading')}</span>
      </div>
    );
  }

  return (
    <div className="pt-36 pb-20 px-6 max-w-7xl mx-auto min-h-screen">
      
      {/* Upper User Profile Bar */}
      <div className="bento-card p-8 md:p-10 mb-12 flex flex-col md:flex-row items-center justify-between gap-8 border border-foreground/5 shadow-xl relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-gold/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-brand-gold bg-foreground/5 shadow-lg">
            <img src={user?.photoURL || 'https://i.pravatar.cc/150?u=9'} alt="User Profile" className="w-full h-full object-cover" />
          </div>
          <div className="text-center md:text-left space-y-1.5">
            <h1 className="text-2xl md:text-3xl font-editorial-title font-bold text-foreground">{user?.displayName || t('profile.guestName')}</h1>
            <p className="text-xs text-foreground/50 leading-relaxed font-light italic">{user?.email}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-1">
              <span className="px-3.5 py-1 bg-brand-gold/10 border border-brand-gold/10 rounded-full text-[9px] font-black uppercase tracking-wider text-brand-gold flex items-center gap-1.5">
                <Award className="w-3 h-3" /> {t('profile.goldMember')}
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="px-6 py-3.5 bg-foreground/5 hover:bg-red-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-hero transition-all flex items-center gap-2 border border-foreground/5 hover:border-red-500 relative z-10"
        >
          <LogOut className="w-4 h-4" /> {t('profile.logout')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Navigation Sidebar Panel */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bento-card p-6 border border-foreground/5">
            <nav className="flex flex-col gap-2">
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left ${
                  activeTab === 'orders' 
                    ? 'bg-brand-gold text-black shadow-lg shadow-brand-gold/15' 
                    : 'hover:bg-foreground/5 text-foreground/60'
                }`}
              >
                <ShoppingBag className="w-4 h-4" /> {t('profile.activeOrders')}
              </button>
              <button
                onClick={() => setActiveTab('wishlist')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left ${
                  activeTab === 'wishlist' 
                    ? 'bg-brand-gold text-black shadow-lg shadow-brand-gold/15' 
                    : 'hover:bg-foreground/5 text-foreground/60'
                }`}
              >
                <Heart className="w-4 h-4" /> {t('profile.wishlist')}
              </button>
            </nav>
          </div>

          <div className="bento-card p-6 bg-brand-gold text-black">
            <h3 className="text-xs font-black uppercase tracking-wider mb-2">{t('profile.prestigeService')}</h3>
            <p className="text-[10px] leading-relaxed mb-4 font-semibold opacity-75">
              {t('profile.prestigeDesc')}
            </p>
            <a 
              href="https://t.me/faxrmebel" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full py-3 bg-black text-white text-center rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" /> {t('profile.telegramSupport')}
            </a>
          </div>
        </aside>

        {/* Content Viewer Grid */}
        <main className="lg:col-span-9 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'orders' ? (
              <motion.div
                key="orders"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {ordersLoading ? (
                  <div className="bento-card p-12 text-center border border-foreground/5">
                    <Clock className="w-8 h-8 text-brand-gold animate-spin mx-auto mb-4" />
                    <span className="text-xs uppercase tracking-hero text-foreground/40 font-bold">{t('profile.ordersLoading', 'Buyurtmalar yuklanmoqda...')}</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bento-card p-12 text-center border border-foreground/5 flex flex-col items-center justify-center space-y-4">
                    <ShoppingBag className="w-12 h-12 text-foreground/20" />
                    <h3 className="text-lg font-bold text-foreground">{t('profile.noOrders', 'Sizda faol buyurtmalar yo\'q')}</h3>
                    <p className="text-xs text-foreground/45 italic max-w-sm">{t('profile.noOrdersDesc', 'Bizning katalogimizdan premium mebellarni tanlang va birinchi buyurtmangizni amalga oshiring.')}</p>
                    <button 
                      onClick={() => navigate('/shop')}
                      className="bg-brand-gold text-black px-6 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:scale-102"
                    >
                      {t('cta.shop', 'Do\'konni Ko\'rish')}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Order Selector (Dropdown if multiple) */}
                    {orders.length > 1 && (
                      <div className="flex items-center gap-3 bg-foreground/5 p-3 rounded-2xl border border-foreground/5 w-fit">
                        <span className="text-[9px] uppercase font-black tracking-widest text-foreground/45 ml-2">{t('profile.selectOrder', 'Buyurtmani tanlash')}:</span>
                        <CustomSelect
                          value={selectedOrderId || ''}
                          onChange={setSelectedOrderId}
                          options={orders.map(o => ({
                            value: o.id,
                            label: `${o.id} (${new Date(o.date).toLocaleDateString()})`
                          }))}
                          className="w-48"
                        />
                      </div>
                    )}

                    {currentOrder && (
                      <div className="bento-card p-8 border border-foreground/5 relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-6 border-b border-foreground/5 mb-8 gap-4">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-brand-gold">{t('profile.activeOrder')}</span>
                            <h3 className="text-lg font-bold text-foreground mt-1">{currentOrder.itemNames}</h3>
                            <p className="text-[10px] text-foreground/45 mt-1 font-bold">
                              {t('profile.code')}: {currentOrder.id} | {t('profile.date')}: {new Date(currentOrder.date).toLocaleDateString('uz-UZ')}
                            </p>
                          </div>
                          
                          <div className="text-left sm:text-right shrink-0">
                            <span className="text-[9px] uppercase font-black tracking-widest text-foreground/40 block">{t('profile.paidAmount')}</span>
                            <span className="price-tag text-2xl font-bold block">{formatPrice(currentOrder.total)}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                          {/* Visual details column */}
                          <div className="md:col-span-4 bg-foreground/5 p-6 rounded-2xl border border-foreground/5 space-y-3.5 h-fit">
                            <span className="text-[9px] font-black uppercase tracking-widest text-brand-gold block">{t('profile.selectedParams')}</span>
                            <div className="space-y-2.5 text-xs">
                              <div className="flex justify-between">
                                <span className="text-foreground/45">{t('profile.woodType')}:</span>
                                <span className="font-bold text-right pl-2">{currentOrder.wood}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-foreground/45">{t('profile.fabric')}:</span>
                                <span className="font-bold text-right pl-2">{currentOrder.fabric}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-foreground/45">{t('profile.packaging')}:</span>
                                <span className="font-bold text-right pl-2">{currentOrder.packaging}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-foreground/45">{t('profile.delivery')}:</span>
                                <span className="font-bold text-green-500 text-right pl-2">Kuryer (Luxe)</span>
                              </div>
                              <div className="flex justify-between border-t border-foreground/5 pt-2">
                                <span className="text-foreground/45">{t('profile.paymentMethod', 'To\'lov turi')}:</span>
                                <span className="font-bold text-brand-gold text-[10px] uppercase text-right pl-2">
                                  {currentOrder.paymentMethod === 'click_payme' ? 'Click / Payme' : t('profile.manualPay', 'Konsultatsiya')}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-foreground/45">{t('profile.paymentStatus', 'To\'lov holati')}:</span>
                                <span className={cn(
                                  "font-bold text-[10px] uppercase text-right pl-2", 
                                  currentOrder.paymentStatus === 'paid' ? 'text-green-500' : 'text-orange-500'
                                )}>
                                  {currentOrder.paymentStatus === 'paid' ? t('profile.paid', 'To\'langan') : t('profile.pendingPay', 'Kutilmoqda')}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Timeline tracking tracker */}
                          <div className="md:col-span-8 space-y-6">
                            <span className="text-[9px] font-black uppercase tracking-widest text-brand-gold block mb-2">{t('profile.timeline')}</span>
                            
                            <div className="relative pl-6 border-l border-foreground/10 space-y-8">
                              {currentOrder.steps.map((step, idx) => (
                                <div key={idx} className="relative">
                                  
                                  {/* Visual state markers */}
                                  <span className={`absolute -left-9.5 top-0.5 w-6 h-6 rounded-full flex items-center justify-center border text-[9px] font-extrabold ${
                                    step.status === 'completed' 
                                      ? 'bg-green-500 text-white border-green-500' 
                                      : step.status === 'active'
                                      ? 'bg-brand-gold text-black border-brand-gold animate-pulse'
                                      : 'bg-background text-foreground/30 border-foreground/10'
                                  }`}>
                                    {step.status === 'completed' ? <CheckCircle className="w-3.5 h-3.5" /> : idx + 1}
                                  </span>

                                  <div className="space-y-1">
                                    <h4 className={`text-xs font-bold uppercase tracking-wider ${
                                      step.status === 'completed' ? 'text-green-500' : step.status === 'active' ? 'text-brand-gold' : 'text-foreground/40'
                                    }`}>{step.label}</h4>
                                    <p className="text-[10px] text-foreground/50 leading-relaxed font-light italic">{step.desc}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ) : (
              /* Wishlist panel content */
              <motion.div
                key="wishlist"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              >
                {wishlist.length === 0 ? (
                  <div className="col-span-1 sm:col-span-2 flex flex-col items-center justify-center py-20 opacity-50">
                    <Heart className="w-12 h-12 mb-4 text-foreground/20" />
                    <p className="text-xs uppercase tracking-widest font-bold">{t('profile.emptyWishlist')}</p>
                  </div>
                ) : (
                  wishlist.map((item) => (
                    <div key={item.id} className="bento-card glow-tracer p-5 group flex flex-col justify-between">
                      <div className="relative aspect-square rounded-[1.5rem] overflow-hidden mb-5">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        <div className="absolute top-4 left-4 glass px-3.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                          {item.category}
                        </div>
                      </div>

                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-base font-bold text-foreground">{item.name}</h3>
                          <span className="price-tag text-lg font-bold block mt-1">{formatPrice(item.price)}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => navigate('/shop')}
                        className="w-full py-3 bg-foreground/5 hover:bg-brand-gold hover:text-black rounded-xl text-[9px] font-black uppercase tracking-widest border border-foreground/5"
                      >
                        {t('common.seeAll')}
                      </button>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

      </div>
    </div>
  );
};
