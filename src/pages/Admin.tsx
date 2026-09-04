import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Edit3, DollarSign, ShoppingBag, Users, CheckCircle, ArrowUpRight, BarChart2, X, PlusCircle, Save, AlertTriangle } from 'lucide-react';
import { cn, formatPrice, getErrorMessage } from '../lib/utils';
import { CustomSelect } from '../components/CustomSelect';
import { db } from '../lib/firebase';
import { collection, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import type { Order, OrderStatus } from '../types/domain';

/** Orders as stored in Firestore; older documents may lack some fields. */
type AdminOrder = Partial<Order> & {
  id: string;
  client: string;
  total: number;
  date: string;
  status: OrderStatus;
};

const ORDER_STATUS_FLOW: OrderStatus[] = ['pending', 'wood', 'artisan', 'quality', 'completed'];

/** Next production stage, or null once the order is completed (no wrap-around back to pending). */
function nextOrderStatus(status: OrderStatus): OrderStatus | null {
  const index = ORDER_STATUS_FLOW.indexOf(status);
  if (index === -1) return ORDER_STATUS_FLOW[0];
  return ORDER_STATUS_FLOW[index + 1] ?? null;
}

// Local-only catalogue mock. Faza 3 replaces this with the Firestore `products` collection.
const initialProducts = [
  { id: '1', name: 'Royal Velvet Sofa', price: 12000000, rating: 4.9, category: 'Sofa', image: '/images/sofa.png', wood: 'Walnut (Yong\'oq)', fabric: 'Italian Velvet' },
  { id: '2', name: 'Modern Oak Dining Table', price: 8500000, rating: 4.8, category: 'Dining', image: '/images/dining_table.png', wood: 'Oak (Eman)', fabric: 'N/A' },
  { id: '3', name: 'Minimalist Bed Frame', price: 15000000, rating: 5.0, category: 'Bedroom', image: '/images/bed.png', wood: 'Walnut (Yong\'oq)', fabric: 'Premium Textile' }
];

type AdminProduct = (typeof initialProducts)[number];

export const Admin = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders'>('overview');
  const [products, setProducts] = useState(initialProducts);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    // Real-time Firestore sync. A permission error is shown as an error, not silently replaced by demo data.
    const unsubscribe = onSnapshot(
      collection(db, 'orders'),
      (snapshot) => {
        const fetchedOrders: AdminOrder[] = snapshot.docs.map(doc => ({
          ...(doc.data() as Omit<AdminOrder, 'id'>),
          id: doc.id,
        }));
        // Sort by date (newest first)
        fetchedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setOrders(fetchedOrders);
        setOrdersError(null);
      },
      (error) => {
        console.error("Firestore 'orders' subscription failed:", error);
        setOrdersError(error.code === 'permission-denied'
          ? "Buyurtmalarni o'qishga ruxsat yo'q. Hisobingiz admin sifatida ro'yxatdan o'tmagan."
          : `Buyurtmalarni yuklab bo'lmadi: ${error.message}`);
      }
    );

    return () => unsubscribe();
  }, []);

  // Form states for creating/editing a product
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    price: 0,
    category: 'Sofa',
    wood: 'Walnut (Yong\'oq)',
    fabric: 'Italian Velvet',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=600'
  });

  const handleDeleteProduct = (id: string) => {
    if (confirm("Ushbu premium mahsulotni katalogdan butunlay o'chirmoqchimisiz?")) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleOpenEditProduct = (product: AdminProduct) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: product.price,
      category: product.category,
      wood: product.wood,
      fabric: product.fabric,
      image: product.image
    });
    setIsProductModalOpen(true);
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      price: 0,
      category: 'Sofa',
      wood: 'Walnut (Yong\'oq)',
      fabric: 'Italian Velvet',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=600'
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      // Edit
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...productForm } : p));
    } else {
      // Create new (deleting a product used to make the next id collide with an existing one)
      const newProduct = {
        id: crypto.randomUUID(),
        rating: 5.0,
        ...productForm
      };
      setProducts(prev => [...prev, newProduct]);
    }
    setIsProductModalOpen(false);
  };

  // Move an order to the next production stage in Firestore; the snapshot listener updates the list.
  const advanceOrderStatus = async (order: AdminOrder) => {
    const nextStatus = nextOrderStatus(order.status);
    if (!nextStatus || updatingOrderId) return;

    setUpdatingOrderId(order.id);
    setStatusError(null);
    try {
      await updateDoc(doc(db, 'orders', order.id), { status: nextStatus });
    } catch (error) {
      console.error('Firestore status update failed:', error);
      setStatusError(`Holatni o'zgartirib bo'lmadi (${order.id}): ${getErrorMessage(error) || 'ruxsat yo\'q'}`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'wood': return '🪵 Yog\'och saralanmoqda';
      case 'artisan': return '🪚 Ustaxonada';
      case 'quality': return '🔬 Sifat nazorati';
      case 'completed': return '✅ Yetkazildi';
      default: return 'Kutilmoqda';
    }
  };

  return (
    <div className="pt-36 pb-20 px-6 max-w-7xl mx-auto min-h-screen">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-foreground/5">
        <div>
          <span className="text-brand-gold uppercase tracking-hero text-[10px] font-black block">Prestige Console</span>
          <h1 className="text-4xl md:text-5xl font-editorial-title mt-2">Boshqaruv <span className="font-bold italic gold-foil-text">Paneli.</span></h1>
        </div>
        
        {/* Navigation Tabs bar */}
        <div className="flex bg-foreground/5 p-1 rounded-2xl border border-foreground/5">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'overview' ? 'bg-brand-gold text-black font-bold shadow-md' : 'text-foreground/45 hover:text-foreground'
            }`}
          >
            Umumiy Tahlil
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'products' ? 'bg-brand-gold text-black font-bold shadow-md' : 'text-foreground/45 hover:text-foreground'
            }`}
          >
            Katalog CRUD
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'orders' ? 'bg-brand-gold text-black font-bold shadow-md' : 'text-foreground/45 hover:text-foreground'
            }`}
          >
            Aktiv Buyurtmalar
          </button>
        </div>
      </header>

      {/* Firestore error banner */}
      {(ordersError || statusError) && (
        <div role="alert" className="mb-8 p-4 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-start gap-3 animate-fade-in">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-left">
            <span className="text-xs font-bold text-foreground block">Firestore xatosi</span>
            <p className="text-[10px] text-foreground/60 leading-relaxed">{ordersError ?? statusError}</p>
          </div>
        </div>
      )}

      {/* Overview Analytics Section */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-10"
          >
            {/* Stat counts row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bento-card glow-tracer p-8 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-foreground/45">Jami Savdo</span>
                  <div className="text-2xl font-editorial-title font-bold mt-2 text-foreground">{formatPrice(36150000)}</div>
                  <span className="text-[9px] text-green-500 font-extrabold flex items-center mt-1"><ArrowUpRight className="w-3 h-3 mr-1" /> +12.4% bu oy</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold border border-brand-gold/15">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              <div className="bento-card glow-tracer p-8 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-foreground/45">Aktiv Buyurtmalar</span>
                  <div className="text-2xl font-editorial-title font-bold mt-2 text-foreground">{orders.length} ta</div>
                  <span className="text-[9px] text-brand-gold font-extrabold flex items-center mt-1">Hozir ustaxonada</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold border border-brand-gold/15">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>

              <div className="bento-card glow-tracer p-8 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-foreground/45">Premium Mijozlar</span>
                  <div className="text-2xl font-editorial-title font-bold mt-2 text-foreground">148 ta</div>
                  <span className="text-[9px] text-green-500 font-extrabold flex items-center mt-1"><ArrowUpRight className="w-3 h-3 mr-1" /> +5 yangi</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold border border-brand-gold/15">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="bento-card glow-tracer p-8 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-foreground/45">Sifat Reytingi</span>
                  <div className="text-2xl font-editorial-title font-bold mt-2 text-foreground">4.9 / 5.0</div>
                  <span className="text-[9px] text-brand-gold font-extrabold flex items-center mt-1">Mukammal standart</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold border border-brand-gold/15">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Sales Chart block using pure vector SVG */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Sales Graph vector */}
              <div className="lg:col-span-2 bento-card p-8 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-base font-bold text-foreground">Savdo O'sish Dinamikasi</h3>
                    <p className="text-[10px] text-foreground/45 italic mt-0.5">Oylik buyurtma aylanmasi ko'rsatkichi</p>
                  </div>
                  <BarChart2 className="w-5 h-5 text-brand-gold" />
                </div>

                <div className="w-full h-64 relative mt-4">
                  <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                    {/* Glowing golden linear gradient for chart filling */}
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-brand-gold)" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="var(--color-brand-gold)" stopOpacity="0.0"/>
                      </linearGradient>
                    </defs>
                    
                    {/* Grid lines */}
                    <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(197, 160, 89, 0.05)" strokeWidth="1" />
                    <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(197, 160, 89, 0.05)" strokeWidth="1" />
                    <line x1="0" y1="150" x2="500" y2="150" stroke="rgba(197, 160, 89, 0.05)" strokeWidth="1" />

                    {/* Gradient area */}
                    <path d="M 0 200 L 0 170 Q 100 130 150 150 T 300 80 T 450 60 L 500 50 L 500 200 Z" fill="url(#chartGradient)" />
                    
                    {/* Main stroke line */}
                    <path d="M 0 170 Q 100 130 150 150 T 300 80 T 450 60 L 500 50" fill="none" stroke="var(--color-brand-gold)" strokeWidth="3.5" />
                    
                    {/* Node points */}
                    <circle cx="150" cy="150" r="4.5" fill="black" stroke="var(--color-brand-gold)" strokeWidth="2" />
                    <circle cx="300" cy="80" r="4.5" fill="black" stroke="var(--color-brand-gold)" strokeWidth="2" />
                    <circle cx="450" cy="60" r="4.5" fill="black" stroke="var(--color-brand-gold)" strokeWidth="2" />
                  </svg>
                  
                  {/* Chart X axis text */}
                  <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-foreground/45 mt-3 px-2">
                    <span>Fevral</span>
                    <span>Mart</span>
                    <span>Aprel</span>
                    <span>May (Active)</span>
                  </div>
                </div>
              </div>

              {/* Product Popularity category break */}
              <div className="bento-card p-8 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground mb-1">Kategoriyalar Ulushi</h3>
                  <p className="text-[10px] text-foreground/45 italic mb-6">Mijozlar eng ko'p sotib olgan yo'nalishlar</p>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span>Sofalar & Kreslolar</span>
                        <span className="text-brand-gold">55%</span>
                      </div>
                      <div className="w-full bg-foreground/5 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-brand-gold h-full rounded-full" style={{ width: '55%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span>Yotoqxona mebeli</span>
                        <span className="text-brand-gold">30%</span>
                      </div>
                      <div className="w-full bg-foreground/5 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-brand-gold h-full rounded-full" style={{ width: '30%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span>Oshxona & Stol-Stul</span>
                        <span className="text-brand-gold">15%</span>
                      </div>
                      <div className="w-full bg-foreground/5 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-brand-gold h-full rounded-full" style={{ width: '15%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-foreground/5 text-[9px] uppercase font-black tracking-hero text-foreground/45 italic leading-relaxed mt-4">
                  Ustaxonamizdagi yong'oq yog'ochi zaxirasi: <strong className="text-foreground">8.5 tonna (Yetarli)</strong>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* Product CRUD Dashboard Panel */}
        {activeTab === 'products' && (
          <motion.div 
            key="products"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center pb-4 border-b border-foreground/5">
              <h2 className="text-xl font-editorial-title font-bold text-foreground">Katalogdagi Mebellar Ro'yxati ({products.length})</h2>
              <button 
                onClick={handleOpenAddProduct}
                className="bg-brand-gold text-black px-5 py-3 rounded-xl font-extrabold text-[9px] uppercase tracking-hero flex items-center gap-1.5 hover:scale-103"
              >
                <PlusCircle className="w-4 h-4" /> Yangi Mebel Qo'shish
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(p => (
                <div key={p.id} className="bento-card p-6 flex flex-col justify-between">
                  <div>
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-foreground/5 relative">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      <div className="absolute top-3 left-3 glass px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-foreground">
                        {p.category}
                      </div>
                    </div>
                    
                    <h3 className="text-base font-bold text-foreground">{p.name}</h3>
                    <span className="price-tag text-lg font-bold block mt-1.5">{formatPrice(p.price)}</span>
                    <p className="text-[10px] text-foreground/45 mt-2 italic">🪵 {p.wood} | 🧵 {p.fabric}</p>
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-foreground/5 mt-5">
                    <button 
                      onClick={() => handleOpenEditProduct(p)}
                      className="flex-1 py-2.5 bg-foreground/5 hover:bg-brand-gold hover:text-black rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Tahrirlash
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                      aria-label="Delete product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Live Active Orders controller panel */}
        {activeTab === 'orders' && (
          <motion.div 
            key="orders"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-editorial-title font-bold text-foreground pb-4 border-b border-foreground/5">Hozirgi Buyurtmalar va Nazorat ({orders.length})</h2>
            
            <div className="space-y-4">
              {orders.length === 0 && !ordersError && (
                <p className="text-xs text-foreground/45 italic py-10 text-center">Hozircha buyurtmalar yo'q.</p>
              )}
              {orders.map(o => {
                const itemNames = o.items?.map((it) => `${it.name} (x${it.quantity})`).join(', ') || 'Faxr Mebel Mahsuloti';
                const firstBespoke = o.items?.find((it) => it.bespokeDetails);
                const wood = firstBespoke?.bespokeDetails?.wood || 'N/A';
                const fabric = firstBespoke?.bespokeDetails?.fabric || 'N/A';
                const isCompleted = o.status === 'completed';

                return (
                  <div key={o.id} className="bento-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-l-brand-gold">
                    <div className="space-y-2 text-center md:text-left">
                      <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                        <span className="text-[9px] font-black uppercase tracking-widest text-brand-gold">ID: {o.id}</span>
                        <span className="px-3 py-1 bg-brand-gold/10 border border-brand-gold/25 rounded-full text-[9px] font-bold text-brand-gold uppercase tracking-wider">
                          {getStatusLabel(o.status)}
                        </span>
                        {o.paymentStatus && (
                          <span className={cn(
                            "px-3 py-1 border rounded-full text-[9px] font-bold uppercase tracking-wider",
                            o.paymentStatus === 'paid' ? "bg-green-500/10 border-green-500/25 text-green-500" : "bg-orange-500/10 border-orange-500/25 text-orange-500"
                          )}>
                            {o.paymentStatus === 'paid' ? 'To\'langan' : 'To\'lov kutilmoqda'}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-foreground">{itemNames}</h3>
                      <p className="text-[10px] text-foreground/45 font-light">
                        Mijoz: <strong className="text-foreground">{o.client}</strong> | 📞 {o.phone || 'N/A'} | Manzil: <span className="italic text-foreground/60">{o.address || 'N/A'}</span>
                      </p>
                      <p className="text-[10px] text-foreground/45 font-light">
                        Parametr: <strong className="text-foreground">{wood}</strong> & <strong className="text-foreground">{fabric}</strong>
                      </p>
                    </div>

                    <div className="shrink-0 text-center md:text-right flex flex-col sm:flex-row items-center gap-4">
                      <div className="mb-2 sm:mb-0">
                        <span className="text-[9px] uppercase font-black tracking-widest text-foreground/40 block">Qiymati</span>
                        <span className="price-tag text-xl font-bold">{formatPrice(o.total)}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => advanceOrderStatus(o)}
                        disabled={isCompleted || updatingOrderId === o.id}
                        className="px-5 py-3.5 bg-foreground/5 hover:bg-brand-gold hover:text-black rounded-xl text-[9px] font-black uppercase tracking-hero transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-foreground/5 disabled:hover:text-foreground"
                      >
                        {isCompleted ? '✅ Yakunlangan' : updatingOrderId === o.id ? 'Saqlanmoqda...' : '🔄 Keyingi Bosqich'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit/Create Product Modal Dialog */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProductModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-background border border-foreground/5 rounded-[2.2rem] w-full max-w-xl p-8 relative z-10 shadow-2xl"
            >
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="absolute right-6 top-6 p-2 rounded-full hover:bg-foreground/5 transition-colors text-foreground"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-2xl font-editorial-title font-bold mb-6 text-foreground">
                {editingProduct ? 'Premium Mebel Tahriri' : 'Yangi Mebel Yaratish'}
              </h3>

              <form onSubmit={handleSaveProduct} className="space-y-5">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-foreground/45 mb-2 block ml-2">Mebel nomi</label>
                  <input 
                    required
                    type="text" 
                    value={productForm.name}
                    onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                    placeholder="Masalan: Luxury Velvet Ottoman" 
                    className="bg-foreground/5 border border-foreground/15 focus:border-brand-gold rounded-xl px-4 py-3 text-xs outline-none w-full transition-all text-foreground font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-foreground/45 mb-2 block ml-2">Narxi (UZS)</label>
                    <input 
                      required
                      type="number" 
                      value={productForm.price}
                      onChange={(e) => setProductForm({...productForm, price: Number(e.target.value)})}
                      className="bg-foreground/5 border border-foreground/15 focus:border-brand-gold rounded-xl px-4 py-3 text-xs outline-none w-full transition-all text-foreground font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-foreground/45 mb-2 block ml-2">Kategoriya</label>
                    <CustomSelect 
                      value={productForm.category}
                      onChange={(value) => setProductForm({...productForm, category: value})}
                      options={[
                        { value: "Sofa", label: "Sofa" },
                        { value: "Dining", label: "Dining" },
                        { value: "Bedroom", label: "Bedroom" },
                        { value: "Office", label: "Office" },
                        { value: "Luxury Decor", label: "Luxury Decor" }
                      ]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-foreground/45 mb-2 block ml-2">Standart Yog'och</label>
                    <input 
                      required
                      type="text" 
                      value={productForm.wood}
                      onChange={(e) => setProductForm({...productForm, wood: e.target.value})}
                      placeholder="Masalan: Yong'oq (Walnut)" 
                      className="bg-foreground/5 border border-foreground/15 focus:border-brand-gold rounded-xl px-4 py-3 text-xs outline-none w-full transition-all text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-foreground/45 mb-2 block ml-2">Qoplama matosi</label>
                    <input 
                      required
                      type="text" 
                      value={productForm.fabric}
                      onChange={(e) => setProductForm({...productForm, fabric: e.target.value})}
                      placeholder="Masalan: Italiya baxmali (Velvet)" 
                      className="bg-foreground/5 border border-foreground/15 focus:border-brand-gold rounded-xl px-4 py-3 text-xs outline-none w-full transition-all text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-foreground/45 mb-2 block ml-2">Rasm havolasi (URL)</label>
                  <input 
                    required
                    type="text" 
                    value={productForm.image}
                    onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                    className="bg-foreground/5 border border-foreground/15 focus:border-brand-gold rounded-xl px-4 py-3 text-xs outline-none w-full transition-all text-foreground resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-brand-gold text-black py-4 rounded-xl font-extrabold text-xs uppercase tracking-hero hover:scale-102 shadow-xl shadow-brand-gold/15 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Mebelni Saqlash
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
