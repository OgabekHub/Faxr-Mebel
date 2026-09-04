import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, CreditCard, ChevronLeft, CheckCircle2, Gift, Award, HelpCircle, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { cn, formatPrice } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { postNotify } from '../services/notify';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import type { Order } from '../types/domain';

const generateOrderId = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${year}${month}${day}-${rand}`;
};

const SUCCESS_REDIRECT_MS = 4500;
const FAKE_VERIFY_MS = 1800;

export const Cart = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, totalAmount, totalItems, clearCart } = useCart();

  const [isCheckout, setIsCheckout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [notifyFailed, setNotifyFailed] = useState(false);
  const { user } = useAuth();

  // Guards against double submission (state updates lag behind rapid clicks) and stray timers after unmount.
  const submittingRef = useRef(false);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const verifyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'click_payme' | 'consultation'>('click_payme');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [paymentStep, setPaymentStep] = useState<'card' | 'sms' | 'verifying'>('card');

  // Premium Custom Add-ons
  const [premiumBox, setPremiumBox] = useState(false);
  const [artisanCert, setArtisanCert] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    wishes: ''
  });

  useEffect(() => () => {
    clearTimeout(redirectTimer.current);
    clearTimeout(verifyTimer.current);
  }, []);

  const finishAndGoToProfile = () => {
    clearTimeout(redirectTimer.current);
    clearCart();
    navigate('/profile');
  };

  const getAddonTotal = () => {
    let total = 0;
    if (premiumBox) total += 500000; // 500k UZS
    if (artisanCert) total += 150000; // 150k UZS
    return total;
  };

  const finalAmount = totalAmount + getAddonTotal();

  const saveOrderToDatabase = async () => {
    if (!user || submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    const orderId = generateOrderId();

    try {
      const orderData: Order = {
        id: orderId,
        userId: user.uid,
        client: formData.name,
        phone: formData.phone,
        address: formData.address,
        wishes: formData.wishes,
        items: cart.map(item => ({
          id: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category: item.category,
          image: item.image,
          bespokeDetails: item.bespokeDetails || null
        })),
        addons: {
          premiumBox,
          artisanCert
        },
        total: finalAmount,
        status: 'pending',
        paymentMethod,
        paymentStatus: paymentMethod === 'click_payme' ? 'paid' : 'pending',
        date: new Date().toISOString()
      };

      // Save order to Firestore
      await setDoc(doc(db, 'orders', orderId), orderData);

      // Notify the ops chat through the server-side function.
      // The order is already saved, so a failed notification must not fail the checkout.
      const notified = await postNotify({
        kind: 'order',
        payload: {
          orderNumber: orderId,
          client: formData.name,
          phone: formData.phone,
          address: formData.address,
          wishes: formData.wishes,
          items: orderData.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            bespokeDetails: item.bespokeDetails,
          })),
          addons: orderData.addons,
          total: finalAmount,
          paymentMethod,
          paymentStatus: orderData.paymentStatus,
        },
      });
      if (!notified.ok) {
        console.warn('Order saved, but the Telegram notification failed:', notified.error);
        setNotifyFailed(true);
      }

      setShowPaymentModal(false);
      setIsSuccess(true);

      redirectTimer.current = setTimeout(finishAndGoToProfile, SUCCESS_REDIRECT_MS);
    } catch (error) {
      console.error("Order creation failed:", error);
      setSubmitError(t('cart.submitError'));
      // Card demo: return to the SMS step (previously the modal stayed on the spinner forever).
      setPaymentStep('sms');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/auth', { state: { from: { pathname: '/cart' } } });
      return;
    }
    if (submittingRef.current) return;

    if (paymentMethod === 'click_payme') {
      // Always open the demo gateway on the card step with a clean SMS field.
      setSubmitError(null);
      setPaymentStep('card');
      setSmsCode('');
      setShowPaymentModal(true);
    } else {
      await saveOrderToDatabase();
    }
  };

  const closePaymentModal = () => {
    if (isSubmitting) return;
    clearTimeout(verifyTimer.current);
    setShowPaymentModal(false);
  };

  if (isSuccess) {
    return (
      <div className="pt-32 px-6 max-w-7xl mx-auto text-center h-[calc(100vh-8rem)] flex flex-col items-center justify-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-xl bg-white dark:bg-white/5 bento-card p-12 shadow-2xl border border-brand-gold/20"
        >
          <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-3xl md:text-4xl font-editorial-title font-bold mb-4">Buyurtmangiz Qabul Qilindi!</h1>
          <p className="text-xs text-foreground/60 mb-8 leading-relaxed max-w-md mx-auto italic">
            Xaridingiz uchun tashakkur! Faxr Mebel master-artisanlari buyurtma ustida ish boshlashdi. Tez orada aloqaga chiqamiz.
          </p>
          {notifyFailed && (
            <p role="alert" className="mb-8 p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-start gap-2 text-left">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{t('cart.notifyFailed')}</span>
            </p>
          )}
          <div className="w-full bg-foreground/5 h-1.5 rounded-full overflow-hidden mb-8">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 4 }}
              className="bg-brand-gold h-full"
            />
          </div>
          <button
            type="button"
            onClick={finishAndGoToProfile}
            className="bg-brand-gold text-black px-8 py-3.5 rounded-full font-bold text-xs uppercase tracking-hero hover:scale-105 inline-flex items-center gap-2 shadow-lg shadow-brand-gold/15"
          >
            Kabinetingizga o'tish <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="pt-32 px-6 max-w-7xl mx-auto text-center h-[calc(100vh-8rem)] flex flex-col items-center justify-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md"
        >
          <div className="w-24 h-24 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-foreground/20" />
          </div>
          <h1 className="text-3xl font-editorial-title font-bold mb-3">Sizning savatchangiz bo'sh</h1>
          <p className="text-xs text-foreground/50 mb-8 leading-relaxed italic">
            Eksklyuziv mebel katalogimizdan o'zingizga ma'qul kelgan asarni tanlang va uyingizga hashamat olib kiring.
          </p>
          <Link 
            to="/shop" 
            className="bg-brand-gold text-black px-8 py-3.5 rounded-full font-bold text-xs uppercase tracking-hero hover:scale-105 inline-flex items-center gap-2 shadow-lg shadow-brand-gold/15"
          >
            Kolleksiyani ko'rish <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto min-h-[calc(100vh-9rem)]">
      {/* Visual checkout step timeline */}
      <div className="flex items-center justify-center gap-4 md:gap-8 mb-12">
        <div className={cn("flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest", !isCheckout ? "text-brand-gold" : "text-foreground/35")}>
          <span className="w-6 h-6 bg-brand-gold/10 rounded-full flex items-center justify-center border border-brand-gold/20">1</span>
          Savatcha
        </div>
        <div className="w-16 h-[1px] bg-foreground/10" />
        <div className={cn("flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest", isCheckout ? "text-brand-gold" : "text-foreground/35")}>
          <span className="w-6 h-6 bg-foreground/5 rounded-full flex items-center justify-center border border-transparent">2</span>
          Tasdiqlash
        </div>
      </div>

      <h1 className="text-3xl md:text-5xl font-editorial-title mb-10">Savatchadagi asarlar ({totalItems})</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-16">
        {/* Left Side: Cart Items List */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence>
            {cart.map((item) => (
              <motion.div 
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bento-card p-6 flex flex-col sm:flex-row items-center gap-6 group"
              >
                <div className="w-32 h-32 rounded-2xl overflow-hidden shrink-0 relative bg-foreground/5">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105" />
                </div>
                
                <div className="flex-grow text-center sm:text-left space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-brand-gold">{item.category}</span>
                  <h3 className="text-lg font-bold tracking-tight text-foreground">{item.name}</h3>
                  
                  {item.bespokeDetails && (
                    <div className="text-[10px] text-brand-gold bg-brand-gold/5 border border-brand-gold/10 px-3 py-1 rounded-lg inline-block">
                      🪵 {item.bespokeDetails.wood} | 🧵 {item.bespokeDetails.fabric}
                    </div>
                  )}

                  <div className="flex items-center justify-center sm:justify-start gap-4 pt-1">
                    <div className="flex items-center gap-2 bg-foreground/5 px-2 py-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label="Kamaytirish"
                        className="p-1 hover:bg-white dark:hover:bg-white/10 rounded transition-colors text-foreground"
                      >
                        <Minus className="w-3 h-3" aria-hidden="true" />
                      </button>
                      <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= 99}
                        aria-label="Ko'paytirish"
                        className="p-1 hover:bg-white dark:hover:bg-white/10 rounded transition-colors text-foreground disabled:opacity-40"
                      >
                        <Plus className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </div>
                    <span className="text-xs text-foreground/45">x {formatPrice(item.price)}</span>
                  </div>
                </div>

                <div className="text-center sm:text-right flex flex-col items-center sm:items-end gap-3 min-w-[120px]">
                  <span className="price-tag text-xl font-bold">{formatPrice(item.price * item.quantity)}</span>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="p-2.5 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-500/10"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Right Side: Order Summary or Form checkout */}
        <aside className="lg:col-span-4">
          <div className="bento-card p-8 sticky top-32 border border-foreground/5 shadow-xl">
            {!isCheckout ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-2xl font-editorial-title font-bold mb-4 text-foreground">Buyurtma yakuni</h3>
                
                {/* Premium Luxury Options */}
                <div className="border-t border-b border-foreground/5 py-5 space-y-4">
                  <span className="text-[9px] font-black uppercase tracking-widest text-brand-gold block">Hashamatli Qo'shimchalar</span>
                  
                  {/* Option 1: Gift box */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={premiumBox}
                      onChange={(e) => setPremiumBox(e.target.checked)}
                      className="mt-1 accent-brand-gold rounded"
                    />
                    <div>
                      <span className="text-xs font-bold flex items-center gap-1.5 text-foreground group-hover:text-brand-gold transition-colors">
                        <Gift className="w-3.5 h-3.5" /> Yog'och Qadoqlash
                      </span>
                      <p className="text-[9px] text-foreground/45 mt-0.5 leading-relaxed font-light italic">
                        Premium mebellar uchun hashamatli qattiq yog'och quti (+500k UZS)
                      </p>
                    </div>
                  </label>

                  {/* Option 2: Certificate */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={artisanCert}
                      onChange={(e) => setArtisanCert(e.target.checked)}
                      className="mt-1 accent-brand-gold rounded"
                    />
                    <div>
                      <span className="text-xs font-bold flex items-center gap-1.5 text-foreground group-hover:text-brand-gold transition-colors">
                        <Award className="w-3.5 h-3.5" /> Asillik Sertifikati
                      </span>
                      <p className="text-[9px] text-foreground/45 mt-0.5 leading-relaxed font-light italic">
                        Mebelning tozaligi va qo'lda sayqallanganligini tasdiqlovchi sertifikat (+150k UZS)
                      </p>
                    </div>
                  </label>
                </div>

                {/* Subtotals and Totals */}
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between text-foreground/55">
                    <span>Mebellar qiymati</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>
                  {premiumBox && (
                    <div className="flex justify-between text-foreground/55 animate-fade-in">
                      <span>Yog'och Qadoqlash</span>
                      <span>{formatPrice(500000)}</span>
                    </div>
                  )}
                  {artisanCert && (
                    <div className="flex justify-between text-foreground/55 animate-fade-in">
                      <span>Asillik Sertifikati</span>
                      <span>{formatPrice(150000)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-foreground/55">
                    <span>O'rnatish & Yetkazish</span>
                    <span className="text-green-500 font-extrabold uppercase text-[9px] tracking-wider">Bepul (Luxe Service)</span>
                  </div>
                  <div className="pt-4 border-t border-foreground/5 flex justify-between items-center text-xl font-bold">
                    <span>Jami</span>
                    <span className="price-tag text-2xl font-bold">{formatPrice(finalAmount)}</span>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <button 
                    onClick={() => {
                      if (!user) {
                        navigate('/auth', { state: { from: { pathname: '/cart' } } });
                      } else {
                        setIsCheckout(true);
                      }
                    }}
                    className="w-full bg-brand-gold text-black py-4 rounded-xl font-extrabold text-xs uppercase tracking-hero hover:scale-102 shadow-xl shadow-brand-gold/15 flex items-center justify-center gap-2"
                  >
                    Buyurtmaga O'tish <ArrowRight className="w-4 h-4" />
                  </button>
                  <div className="flex items-center justify-center gap-3 text-foreground/20">
                    <CreditCard className="w-5 h-5" />
                    <span className="text-[9px] uppercase font-black tracking-widest">Kafolatlangan yetkazish</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Checkout Form Details */
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-foreground/5">
                  <button 
                    onClick={() => setIsCheckout(false)}
                    className="p-1.5 hover:bg-foreground/5 rounded-full transition-colors text-foreground"
                    aria-label="Back to cart summary"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-2xl font-editorial-title font-bold text-foreground">Tasdiqlash</h3>
                </div>

                <form onSubmit={handleCheckout} className="space-y-5">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-foreground/45 mb-2 block ml-2">Ism Sharifingiz</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Masalan: Alisher Navoiy" 
                      className="bg-foreground/5 border border-foreground/15 focus:border-brand-gold rounded-xl px-4 py-3 text-xs outline-none w-full transition-all text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-foreground/45 mb-2 block ml-2">Telefon Raqamingiz</label>
                    <input 
                      required
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+998 90 123 45 67" 
                      className="bg-foreground/5 border border-foreground/15 focus:border-brand-gold rounded-xl px-4 py-3 text-xs outline-none w-full transition-all text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-foreground/45 mb-2 block ml-2">Yetkazish Manzili</label>
                    <textarea 
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="Toshkent shahar, Yunusobod tumani..." 
                      rows={2}
                      className="bg-foreground/5 border border-foreground/15 focus:border-brand-gold rounded-xl px-4 py-3 text-xs outline-none w-full transition-all text-foreground resize-none"
                    ></textarea>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-foreground/45 mb-2 block ml-2">Maxsus Istaklar (Ixtiyoriy)</label>
                    <textarea 
                      value={formData.wishes}
                      onChange={(e) => setFormData({...formData, wishes: e.target.value})}
                      placeholder="Masalan: Mebel osti orqa fon yoritgichini ham o'rnatib bering..." 
                      rows={2}
                      className="bg-foreground/5 border border-foreground/15 focus:border-brand-gold rounded-xl px-4 py-3 text-xs outline-none w-full transition-all text-foreground resize-none"
                    ></textarea>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-widest text-foreground/45 mb-1 block ml-2">To'lov Usuli</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('click_payme')}
                        className={cn(
                          "p-4 rounded-xl border text-left flex flex-col justify-between h-24 transition-all outline-none",
                          paymentMethod === 'click_payme' 
                            ? "border-brand-gold bg-brand-gold/5" 
                            : "border-foreground/15 bg-foreground/5 hover:border-foreground/30"
                        )}
                      >
                        <div className="flex justify-between items-center w-full">
                          <CreditCard className={cn("w-5 h-5", paymentMethod === 'click_payme' ? "text-brand-gold" : "text-foreground/45")} />
                          <span className="text-[8px] bg-brand-gold/10 text-brand-gold border border-brand-gold/25 px-1.5 py-0.5 rounded uppercase font-black tracking-widest font-bold">Luxe</span>
                        </div>
                        <div>
                          <span className="text-xs font-bold block text-foreground">Click / Payme</span>
                          <span className="text-[9px] text-foreground/45">Karta orqali online</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('consultation')}
                        className={cn(
                          "p-4 rounded-xl border text-left flex flex-col justify-between h-24 transition-all outline-none",
                          paymentMethod === 'consultation' 
                            ? "border-brand-gold bg-brand-gold/5" 
                            : "border-foreground/15 bg-foreground/5 hover:border-foreground/30"
                        )}
                      >
                        <div className="flex justify-between items-center w-full">
                          <HelpCircle className={cn("w-5 h-5", paymentMethod === 'consultation' ? "text-brand-gold" : "text-foreground/45")} />
                          <span className="text-[8px] bg-foreground/10 text-foreground/45 border border-foreground/10 px-1.5 py-0.5 rounded uppercase font-black tracking-widest font-bold">Manual</span>
                        </div>
                        <div>
                          <span className="text-xs font-bold block text-foreground">Maslahatlashuv</span>
                          <span className="text-[9px] text-foreground/45">Menejer bilan bog'lanish</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-foreground/5">
                    <div className="flex justify-between items-center text-xl font-bold mb-4">
                      <span>Umumiy</span>
                      <span className="price-tag text-2xl font-bold">{formatPrice(finalAmount)}</span>
                    </div>
                    
                    {submitError && !showPaymentModal && (
                      <p role="alert" className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[11px] font-bold">
                        {submitError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      aria-busy={isSubmitting}
                      className="w-full bg-brand-gold text-black py-4 rounded-xl font-extrabold text-xs uppercase tracking-hero hover:scale-102 shadow-xl shadow-brand-gold/15 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Yuborilmoqda...' : 'Buyurtmani Yakunlash'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </div>
        </aside>
      </div>

      {/* Premium Simulated Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0f0e0c] border border-brand-gold/25 w-full max-w-md rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xl relative overflow-hidden text-left flex flex-col max-h-[90vh]"
            >
              {/* Glow background */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-brand-gold/10 blur-[50px] rounded-full pointer-events-none" />

              <div className="overflow-y-auto flex-1 pr-1 -mr-2 scrollbar-none">
                {paymentStep === 'card' && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="text-center">
                      <span className="text-[9px] uppercase font-black tracking-hero text-brand-gold block mb-0.5">Prestige Gateway</span>
                      <h3 className="text-lg sm:text-xl font-editorial-title font-bold text-white">Click / Payme To'lovi</h3>
                      <p className="text-[9px] sm:text-[10px] text-white/40 italic mt-0.5">Xavfsiz va premium to'lov interfeysi</p>
                    </div>

                    <div className="bg-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 flex justify-between items-center">
                      <span className="text-xs text-white/50">To'lov summasi:</span>
                      <span className="price-tag font-bold text-base sm:text-lg">{formatPrice(finalAmount)}</span>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="text-[9px] font-black tracking-widest uppercase text-white/40 block mb-1 ml-1.5">Karta Raqami</label>
                        <input
                          required
                          type="text"
                          maxLength={19}
                          placeholder="8600 0000 0000 0000"
                          value={cardNumber}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                            const matches = v.match(/\d{4,16}/g);
                            const match = (matches && matches[0]) || '';
                            const parts = [];
                            for (let i = 0, len = match.length; i < len; i += 4) {
                              parts.push(match.substring(i, i + 4));
                            }
                            setCardNumber(parts.length > 0 ? parts.join(' ') : v);
                          }}
                          className="bg-white/5 border border-white/10 focus:border-brand-gold rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3.5 text-xs outline-none w-full text-white placeholder-white/30 tracking-widest font-bold font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="text-[9px] font-black tracking-widest uppercase text-white/40 block mb-1 ml-1.5">Muddati</label>
                          <input
                            required
                            type="text"
                            maxLength={5}
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={(e) => {
                              const v = e.target.value.replace('/', '').replace(/[^0-9]/gi, '');
                              setCardExpiry(v.length >= 2 ? v.substring(0, 2) + '/' + v.substring(2, 4) : v);
                            }}
                            className="bg-white/5 border border-white/10 focus:border-brand-gold rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3.5 text-xs outline-none w-full text-white placeholder-white/30 tracking-widest font-bold text-center font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black tracking-widest uppercase text-white/40 block mb-1 ml-1.5">CVV/CVC</label>
                          <input
                            required
                            type="password"
                            maxLength={3}
                            placeholder="***"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/gi, ''))}
                            className="bg-white/5 border border-white/10 focus:border-brand-gold rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3.5 text-xs outline-none w-full text-white placeholder-white/30 tracking-widest font-bold text-center font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 sm:gap-3 pt-1 sm:pt-2">
                      <button
                        type="button"
                        onClick={closePaymentModal}
                        className="w-1/2 bg-white/5 hover:bg-white/10 text-white/80 py-2.5 sm:py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider"
                      >
                        Bekor qilish
                      </button>
                      <button
                        type="button"
                        disabled={cardNumber.length < 19 || cardExpiry.length < 5}
                        onClick={() => {
                          setPaymentStep('verifying');
                          clearTimeout(verifyTimer.current);
                          verifyTimer.current = setTimeout(() => setPaymentStep('sms'), FAKE_VERIFY_MS);
                        }}
                        className="w-1/2 bg-brand-gold disabled:opacity-50 text-black py-2.5 sm:py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-102"
                      >
                        SMS kod olish
                      </button>
                    </div>
                  </div>
                )}

                {paymentStep === 'verifying' && (
                  <div className="flex flex-col items-center justify-center py-8 sm:py-12 space-y-4 sm:space-y-6">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-brand-gold/25 border-t-brand-gold rounded-full animate-spin" />
                    <div className="text-center space-y-1">
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white animate-pulse">Tranzaksiya tekshirilmoqda</h4>
                      <p className="text-[9px] sm:text-[10px] text-white/45 italic">Iltimos, sahifani yopmang...</p>
                    </div>
                  </div>
                )}

                {paymentStep === 'sms' && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="text-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                        <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-brand-gold" />
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white">SMS Tasdiqlash</h3>
                      <p className="text-[9px] sm:text-[10px] text-white/45 mt-1 leading-relaxed max-w-xs mx-auto">
                        Telefoningizga yuborilgan 4 xonali tasdiqlash kodini kiriting.<br />
                        <span className="font-bold text-brand-gold">SMS Tasdiqlash Kodi: 1234</span>
                      </p>
                    </div>

                    <div>
                      <input
                        required
                        type="text"
                        maxLength={4}
                        placeholder="• • • •"
                        value={smsCode}
                        onChange={(e) => setSmsCode(e.target.value.replace(/[^0-9]/gi, ''))}
                        className="bg-white/5 border border-white/10 focus:border-brand-gold rounded-xl sm:rounded-2xl px-3 sm:px-4 py-3 sm:py-4 text-base sm:text-lg outline-none w-full text-white placeholder-white/30 tracking-[0.8rem] sm:tracking-[1.2rem] font-black text-center font-mono"
                      />
                    </div>

                    {submitError && (
                      <p role="alert" className="p-3.5 bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl text-[11px] font-bold">
                        {submitError}
                      </p>
                    )}

                    <div className="flex gap-2 sm:gap-3">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => { setSubmitError(null); setPaymentStep('card'); }}
                        className="w-1/2 bg-white/5 hover:bg-white/10 text-white/80 py-2.5 sm:py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                      >
                        Orqaga
                      </button>
                      <button
                        type="button"
                        disabled={smsCode !== '1234' || isSubmitting}
                        onClick={async () => {
                          if (submittingRef.current) return;
                          setPaymentStep('verifying');
                          await saveOrderToDatabase();
                        }}
                        className="w-1/2 bg-green-500 disabled:opacity-50 text-white py-2.5 sm:py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-102"
                      >
                        Tasdiqlash
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
