import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, ArrowLeft, Ruler, Sparkles, Send, ShieldCheck, CheckCircle2, MessageSquareCode } from 'lucide-react';
import { formatPrice } from '../lib/utils';
import { createPortal } from 'react-dom';
import { postNotify } from '../services/notify';

interface BespokeModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
}

export const BespokeModal: React.FC<BespokeModalProps> = ({ isOpen, onClose, product }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  
  // Custom states
  const [length, setLength] = useState(250);
  const [width, setWidth] = useState(100);
  const [wood, setWood] = useState('walnut');
  const [fabric, setFabric] = useState('velvet');
  const [delivery, setDelivery] = useState('luxe');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedOrderId, setSubmittedOrderId] = useState('');

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setLength(250);
      setWidth(100);
      setWood('walnut');
      setFabric('velvet');
      setDelivery('luxe');
      setUserName('');
      setUserPhone('');
      setIsSubmitting(false);
      setSubmitted(false);
      setSubmittedOrderId('');
    }
  }, [isOpen]);

  // Calculate customized premium markup price based on volume
  const volumeMultiplier = (length * width) / 25000;
  const rawPrice = product.price * (volumeMultiplier < 1 ? 1 : volumeMultiplier);
  const woodPremium = wood === 'walnut' ? 1.15 : wood === 'oak' ? 1.1 : 1.0;
  const fabricPremium = fabric === 'leather' ? 1.25 : 1.0;
  const finalPrice = Math.round(rawPrice * woodPremium * fabricPremium);

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userPhone) return;

    // One id per submission: shown on the receipt and sent to the ops chat.
    const orderId = `BESPOKE-${Math.floor(1000 + Math.random() * 9000)}`;
    setSubmittedOrderId(orderId);
    setIsSubmitting(true);

    // The message text is built server-side (api/_lib/notify.ts) with HTML escaping.
    const result = await postNotify({
      kind: 'bespoke',
      payload: {
        orderId,
        productName: t('product.' + product.id + '.name'),
        length,
        width,
        wood,
        fabric,
        delivery: delivery === 'luxe' ? 'luxe' : 'standard',
        name: userName,
        phone: userPhone,
        estimatedPrice: finalPrice,
      },
    });
    setIsSubmitting(false);

    if (result.ok) {
      setSubmitted(true);
    } else {
      alert("Xatolik yuz berdi. Iltimos, ma'lumotlarni tekshiring va qayta urinib ko'ring.");
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/85 backdrop-blur-md"
        >
          {/* Main Modal Container */}
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
            className="w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] overflow-y-auto overflow-x-hidden bg-background border-0 md:border border-foreground/10 rounded-none md:rounded-[3rem] shadow-2xl relative"
          >

            <div className="grid grid-cols-1 md:grid-cols-12 min-h-screen md:min-h-[500px]">
              
              {/* Left Column: Live Bespoke Product Overview */}
              <div className="md:col-span-5 bg-foreground/5 border-b md:border-b-0 md:border-r border-foreground/10 p-8 flex flex-col justify-between">
                <div>
                  <span className="text-brand-gold uppercase tracking-hero text-[10px] font-black block">Concierge Desk</span>
                  <h3 className="text-2xl font-editorial-title font-bold mt-2">{t('product.' + product.id + '.name')}</h3>
                  <p className="text-[9px] text-foreground/45 uppercase tracking-hero font-extrabold mt-1">Bespoke Manufacturing</p>
                  
                  <div className="relative mt-8 group">
                    <div className="absolute inset-0 bg-brand-gold/5 rounded-3xl blur-2xl group-hover:scale-105" />
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-48 object-contain rounded-2xl drop-shadow-[0_20px_20px_rgba(0,0,0,0.15)] filter brightness-95" 
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-foreground/5">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-foreground/45 tracking-wider">
                    <span>O'lcham:</span>
                    <span className="text-foreground">{length}cm x {width}cm</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-foreground/45 tracking-wider">
                    <span>Daraxt / Matosi:</span>
                    <span className="text-brand-gold">{wood.toUpperCase()} / {fabric.toUpperCase()}</span>
                  </div>
                  <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1 border-t border-foreground/10 pt-4">
                    <span className="text-[10px] uppercase font-black tracking-widest text-foreground whitespace-nowrap">{t('shop.modal.totalPrice')}:</span>
                    <span className="price-tag text-xl font-bold whitespace-nowrap">{formatPrice(finalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Multi-Step Interactive Form */}
              <div className="md:col-span-7 p-8 flex flex-col justify-between">
                
                {/* Steps Header indicator & Close Button */}
                {!submitted && (
                  <div className="flex items-start justify-between gap-3 mb-6">
                    <div className="flex items-center gap-2 flex-1 mt-2">
                      {[1, 2, 3].map((s) => (
                        <div 
                          key={s} 
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            s === step ? 'w-8 bg-brand-gold' : s < step ? 'w-3 bg-foreground/30' : 'w-3 bg-foreground/10'
                          }`} 
                        />
                      ))}
                      <span className="text-[9px] uppercase font-black text-foreground/45 tracking-widest ml-auto">
                        Step {step} of 3
                      </span>
                    </div>
                    {/* Close Button */}
                    <button
                      onClick={onClose}
                      className="shrink-0 w-9 h-9 rounded-full bg-foreground/8 hover:bg-foreground/15 flex items-center justify-center border border-foreground/10 text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Submitting Screen */}
                {isSubmitting && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      className="w-12 h-12 border-2 border-brand-gold/30 border-t-brand-gold rounded-full mb-6"
                    />
                    <MessageSquareCode className="w-8 h-8 text-brand-gold animate-bounce absolute" />
                    <h3 className="text-xl font-editorial-title font-bold">Xavfsiz hisob-faktura shakllanmoqda...</h3>
                    <p className="text-[10px] text-foreground/45 uppercase tracking-hero mt-2">Menejerlar bilan bog'lanish va Telegram xabarnomasi yuborilmoqda</p>
                  </div>
                )}

                {/* Completed Screen */}
                {submitted && !isSubmitting && (
                  <div className="flex-1 flex flex-col justify-between py-4">
                    <div className="text-center space-y-4 py-8">
                      <div className="w-16 h-16 bg-brand-gold text-black rounded-full flex items-center justify-center mx-auto shadow-xl shadow-brand-gold/15">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-editorial-title font-bold text-foreground">VIP Buyurtma Qabul Qilindi!</h3>
                      <p className="text-xs text-foreground/50 max-w-sm mx-auto leading-relaxed">
                        Tashakkur! Sizning maxsus buyurtmangiz va mebelingiz o'lchamlari menejerlarimiz hamda ustaxona guruhiga **Telegram bot** orqali muvaffaqiyatli yuborildi. Biz 2 soat ichida siz bilan bog'lanamiz.
                      </p>
                    </div>

                    {/* Premium VIP Receipt */}
                    <div className="bg-foreground/[0.03] border border-foreground/5 rounded-[2rem] p-6 relative">
                      <div className="flex justify-between items-center mb-4 pb-3 border-b border-foreground/5">
                        <span className="text-[10px] uppercase font-black tracking-widest text-brand-gold">VIP Buyurtma Tafsilotlari</span>
                        <span className="text-[8px] uppercase tracking-widest font-black bg-brand-gold/10 text-brand-gold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1 h-1 bg-brand-gold rounded-full animate-pulse"></span>
                          Yuborildi
                        </span>
                      </div>

                      <div className="space-y-3 text-[11px] leading-relaxed">
                        <div className="flex justify-between">
                          <span className="text-foreground/45 uppercase tracking-wider font-semibold">Buyurtma ID</span>
                          <span className="text-foreground font-mono font-bold">{submittedOrderId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/45 uppercase tracking-wider font-semibold">O'lchamlar</span>
                          <span className="text-foreground font-bold">{length}cm x {width}cm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/45 uppercase tracking-wider font-semibold">Yog'och / Mato</span>
                          <span className="text-foreground font-bold uppercase">{wood.toUpperCase()} / {fabric.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/45 uppercase tracking-wider font-semibold">Mijoz</span>
                          <span className="text-foreground font-bold">{userName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/45 uppercase tracking-wider font-semibold">Telefon</span>
                          <span className="text-foreground font-bold">{userPhone}</span>
                        </div>
                        <div className="pt-3 border-t border-dashed border-foreground/10 flex justify-between items-end">
                          <span className="text-[10px] uppercase font-black tracking-widest text-foreground">Jami qiymati:</span>
                          <span className="text-base font-editorial-title gold-foil-text font-bold">{formatPrice(finalPrice)}</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={onClose}
                      className="w-full py-4 bg-brand-gold text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-gold-muted mt-6 shadow-xl shadow-brand-gold/15"
                    >
                      Bosh sahifaga qaytish
                    </button>
                  </div>
                )}

                {/* Multi-step Form Views */}
                {!submitted && !isSubmitting && (
                  <div className="flex-1 flex flex-col justify-between">
                    
                    {/* Step 1: Dimensions */}
                    {step === 1 && (
                      <div className="space-y-8 py-4">
                        <div>
                          <h4 className="text-lg font-bold flex items-center gap-2">
                            <Ruler className="w-5 h-5 text-brand-gold" />
                            Mebel O'lchamlarini Kiriting
                          </h4>
                          <p className="text-[10px] text-foreground/50 mt-1.5 font-light">Xonangizga mos keladigan uzunlik va kengliklarni belgilang. Biz mebelni uyingiz sharoitidan kelib chiqib aniq tayyorlaymiz.</p>
                        </div>

                        {/* Length Slider */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-[10px] uppercase font-bold text-foreground/50 tracking-wider">
                            <span>Mebel Uzunligi (cm)</span>
                            <span className="text-brand-gold text-xs">{length} cm</span>
                          </div>
                          <input 
                            type="range" 
                            min="150" 
                            max="450" 
                            value={length}
                            onChange={(e) => setLength(parseInt(e.target.value))}
                            className="w-full accent-brand-gold bg-foreground/5 h-1 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Width Slider */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-[10px] uppercase font-bold text-foreground/50 tracking-wider">
                            <span>Mebel Kengligi / Chuqurligi (cm)</span>
                            <span className="text-brand-gold text-xs">{width} cm</span>
                          </div>
                          <input 
                            type="range" 
                            min="60" 
                            max="200" 
                            value={width}
                            onChange={(e) => setWidth(parseInt(e.target.value))}
                            className="w-full accent-brand-gold bg-foreground/5 h-1 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                    )}

                    {/* Step 2: Materials Selection */}
                    {step === 2 && (
                      <div className="space-y-8 py-4">
                        <div>
                          <h4 className="text-lg font-bold flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-brand-gold" />
                            Premium Materiallar Tanlovi
                          </h4>
                          <p className="text-[10px] text-foreground/50 mt-1.5 font-light">Mebelingizning yog'och ramkasi va qoplama matosi turini tanlang. Oliy navli materiallarimiz narxda kichik farq qilishi mumkin.</p>
                        </div>

                        {/* Wood selection */}
                        <div className="space-y-3">
                          <label className="text-[9px] uppercase font-black tracking-widest text-foreground/55 block">Premium Daraxt Turi</label>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { id: 'walnut', name: "Walnut (Yong'oq)", markup: "+15%" },
                              { id: 'oak', name: "Oak (Eman)", markup: "+10%" },
                              { id: 'birch', name: "Birch (Qayrag'och)", markup: "Standard" }
                            ].map((w) => (
                              <button
                                key={w.id}
                                type="button"
                                onClick={() => setWood(w.id)}
                                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[90px] ${
                                  wood === w.id 
                                    ? 'border-brand-gold bg-brand-gold/5 shadow-md' 
                                    : 'border-foreground/10 hover:border-foreground/20 bg-foreground/5'
                                }`}
                              >
                                <span className="text-[10px] font-bold text-foreground leading-tight">{w.name}</span>
                                <span className="text-[8px] uppercase tracking-widest font-black text-brand-gold mt-2">{w.markup}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Fabric selection */}
                        <div className="space-y-3">
                          <label className="text-[9px] uppercase font-black tracking-widest text-foreground/55 block">Hashamatli Qoplama Matosi</label>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { id: 'velvet', name: "Italiya Baxmali (Velvet)", desc: "Suvga chidamli yumshoq mato" },
                              { id: 'leather', name: "Toza Charm (Leather) (+25%)", desc: "Premium darajadagi tabiiy charm" }
                            ].map((f) => (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => setFabric(f.id)}
                                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[90px] ${
                                  fabric === f.id 
                                    ? 'border-brand-gold bg-brand-gold/5 shadow-md' 
                                    : 'border-foreground/10 hover:border-foreground/20 bg-foreground/5'
                                }`}
                              >
                                <span className="text-[10px] font-bold text-foreground leading-tight">{f.name}</span>
                                <span className="text-[8px] text-foreground/45 font-medium italic mt-2 leading-snug">{f.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Contact & Delivery */}
                    {step === 3 && (
                      <form onSubmit={handleSubmit} className="space-y-6 py-4">
                        <div>
                          <h4 className="text-lg font-bold flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-brand-gold" />
                            Bog'lanish va Yetkazish Shartlari
                          </h4>
                          <p className="text-[10px] text-foreground/50 mt-1.5 font-light">Biz Toshkent shahrida bepul va o'ta ehtiyotkorona Luxe transport xizmati (o'rnatish bilan birga) hamda standart formatlarni taklif etamiz.</p>
                        </div>

                        {/* Service tier selector */}
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: 'luxe', title: "Luxe Concierge Delivery", desc: "Bepul yuklash, yetkazish va xonangizga o'rnatib berish." },
                            { id: 'standard', title: "Standard Delivery", desc: "Klassik tashuv va eshikkacha yetkazib berish xizmati." }
                          ].map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => setDelivery(d.id)}
                              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[90px] ${
                                delivery === d.id 
                                  ? 'border-brand-gold bg-brand-gold/5 shadow-md' 
                                  : 'border-foreground/10 hover:border-foreground/20 bg-foreground/5'
                                }`}
                            >
                              <span className="text-[10px] font-bold text-foreground leading-tight">{d.title}</span>
                              <span className="text-[8px] text-foreground/45 mt-2 font-medium leading-relaxed">{d.desc}</span>
                            </button>
                          ))}
                        </div>

                        {/* Name and Phone Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[9px] uppercase font-black tracking-widest text-foreground/55">{t('contact.form.label.name')}</label>
                            <input 
                              type="text" 
                              required
                              placeholder={t('contact.form.placeholder.name')} 
                              className="w-full bg-foreground/5 border border-foreground/10 focus:border-brand-gold rounded-xl px-4 py-3 text-xs focus:outline-none transition-colors text-foreground"
                              value={userName}
                              onChange={(e) => setUserName(e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[9px] uppercase font-black tracking-widest text-foreground/55">{t('contact.form.label.phone')}</label>
                            <input 
                              type="tel" 
                              required
                              placeholder={t('contact.form.placeholder.phone')} 
                              className="w-full bg-foreground/5 border border-foreground/10 focus:border-brand-gold rounded-xl px-4 py-3 text-xs focus:outline-none transition-colors text-foreground"
                              value={userPhone}
                              onChange={(e) => setUserPhone(e.target.value)}
                            />
                          </div>
                        </div>
                      </form>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-4 border-t border-foreground/10 pt-6 mt-6">
                      {step > 1 && (
                        <button 
                          onClick={handlePrev}
                          className="px-6 py-4 bg-foreground/5 border border-foreground/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-foreground/10 flex items-center gap-2 text-foreground"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Orqaga
                        </button>
                      )}
                      
                      {step < 3 ? (
                        <button 
                          onClick={handleNext}
                          className="flex-1 py-4 bg-brand-gold text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-gold-muted flex items-center justify-center gap-2 shadow-xl shadow-brand-gold/15"
                        >
                          Davom etish
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={handleSubmit}
                          disabled={!userName || !userPhone}
                          className="flex-1 py-4 bg-brand-gold text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-gold-muted flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-brand-gold/15"
                        >
                          Tugatish va Buyurtmani Yuborish
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                  </div>
                )}

              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
