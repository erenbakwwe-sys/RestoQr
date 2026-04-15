import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { ShoppingCart, BellRing, Plus, Minus, X, CreditCard, Banknote, CheckCircle, Utensils, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CustomerMenu() {
  const { restaurantId, tableNumber } = useParams();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckout, setIsCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pos' | 'cash'>('pos');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [callingWaiter, setCallingWaiter] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('');

  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (!restaurantId) return;

    const fetchData = async () => {
      try {
        const restDoc = await getDoc(doc(db, 'restaurants', restaurantId));
        if (restDoc.exists()) {
          setRestaurant(restDoc.data());
        }

        const catQ = query(collection(db, 'categories'), where('restaurantId', '==', restaurantId));
        const catSnap = await getDocs(catQ);
        const cats = catSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => a.order - b.order);
        setCategories(cats);
        if (cats.length > 0) setActiveCategory(cats[0].id);

        const itemQ = query(collection(db, 'menuItems'), where('restaurantId', '==', restaurantId));
        const itemSnap = await getDocs(itemQ);
        setMenuItems(itemSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Menü yüklenirken hata oluştu", error);
      }
    };

    fetchData();
  }, [restaurantId]);

  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    const element = categoryRefs.current[categoryId];
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 180;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQ = i.quantity + delta;
        return newQ > 0 ? { ...i, quantity: newQ } : i;
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const placeOrder = async () => {
    if (!restaurantId || !tableNumber || cart.length === 0) return;
    try {
      await addDoc(collection(db, 'orders'), {
        restaurantId,
        tableNumber,
        items: cart.map(i => ({ menuItemId: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        totalAmount: cartTotal,
        status: 'pending',
        paymentMethod,
        paymentStatus: 'pending',
        createdAt: new Date().toISOString()
      });
      setCart([]);
      setIsCartOpen(false);
      setIsCheckout(false);
      setOrderPlaced(true);
      setTimeout(() => setOrderPlaced(false), 5000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    }
  };

  const callWaiter = async () => {
    if (!restaurantId || !tableNumber) return;
    setCallingWaiter(true);
    try {
      await addDoc(collection(db, 'waiterCalls'), {
        restaurantId,
        tableNumber,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setTimeout(() => setCallingWaiter(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'waiterCalls');
      setCallingWaiter(false);
    }
  };

  if (!restaurant) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
        <Utensils className="w-8 h-8 text-indigo-600" />
      </motion.div>
    </div>
  );

  const theme = restaurant.theme || {
    primaryColor: '#4f46e5',
    backgroundColor: '#f8fafc',
    textColor: '#0f172a',
    cardBackgroundColor: '#ffffff',
    cardTextColor: '#334155',
    mode: 'light',
    cardStyle: 'horizontal',
    fontFamily: 'sans',
    buttonStyle: 'rounded-xl',
    fontImport: '',
    customCSS: ''
  };

  const isDark = theme.mode === 'dark';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <>
      <div 
        id="customer-menu"
        className={`min-h-screen pb-32 selection:bg-indigo-200 overflow-x-hidden`} 
        style={{ 
          backgroundColor: theme.backgroundColor, 
          color: theme.textColor,
          fontFamily: theme.fontFamily.includes(',') ? theme.fontFamily : `var(--font-${theme.fontFamily})`
        }}
      >
        <style>{theme.fontImport}</style>
        <style>{theme.customCSS}</style>

      {/* Hero Header */}
      <div className="menu-header relative h-64 sm:h-72 bg-slate-900 overflow-hidden">
        {restaurant.coverImageUrl && (
          <div className="absolute inset-0 opacity-40">
            <img src={restaurant.coverImageUrl} alt="Restaurant Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-4xl mx-auto">
          <div className="flex justify-between items-end">
            <div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="menu-title text-3xl sm:text-4xl font-extrabold text-white mb-2 drop-shadow-md">
                {restaurant.name}
              </motion.h1>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-white text-sm font-bold border border-white/10">
                Masa {tableNumber}
              </motion.div>
            </div>
            <motion.button 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
              onClick={callWaiter}
              disabled={callingWaiter}
              className={`waiter-btn flex items-center px-4 py-3 ${theme.buttonStyle} text-sm font-bold shadow-xl transition-all backdrop-blur-md ${callingWaiter ? 'bg-emerald-500/90 text-white border border-emerald-400' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'}`}
            >
              {callingWaiter ? <CheckCircle className="w-5 h-5 mr-2" /> : <BellRing className="w-5 h-5 mr-2" />}
              <span className="inline">{callingWaiter ? 'Garson Çağrıldı' : 'Garson Çağır'}</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Sticky Category Nav */}
      <div className="category-nav sticky top-0 z-40 backdrop-blur-xl border-b shadow-sm" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)', borderColor }}>
        <div className="max-w-4xl mx-auto px-2">
          <div className="flex overflow-x-auto hide-scrollbar py-3 gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => scrollToCategory(category.id)}
                className={`category-btn whitespace-nowrap px-5 py-2.5 ${theme.buttonStyle} text-sm font-bold transition-all border ${activeCategory === category.id ? 'category-btn-active' : ''}`}
                style={{
                  backgroundColor: activeCategory === category.id ? theme.primaryColor : 'transparent',
                  color: activeCategory === category.id ? '#fff' : theme.textColor,
                  borderColor: activeCategory === category.id ? theme.primaryColor : borderColor,
                  opacity: activeCategory === category.id ? 1 : 0.7
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="items-grid max-w-4xl mx-auto px-4 py-8 space-y-12">
        <AnimatePresence>
          {orderPlaced && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-5 text-center shadow-sm flex flex-col items-center justify-center"
            >
              <CheckCircle className="w-8 h-8 mb-2 text-emerald-500" />
              <span className="font-bold text-lg">Siparişiniz başarıyla alındı!</span>
              <span className="text-sm mt-1 opacity-80">Mutfak siparişinizi hazırlıyor.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {categories.map((category, catIdx) => {
          const items = menuItems.filter(i => i.categoryId === category.id && i.isAvailable);
          if (items.length === 0) return null;

          return (
            <motion.div 
              key={category.id}
              ref={el => { categoryRefs.current[category.id] = el; }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIdx * 0.1 }}
              className="scroll-mt-32"
            >
              <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-3" style={{ color: theme.textColor }}>
                {category.name}
                <div className="h-px flex-1" style={{ backgroundColor: borderColor }}></div>
              </h2>
              
              <div className={`grid gap-5 ${theme.cardStyle === 'vertical' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                {items.map(item => (
                  <div 
                    key={item.id} 
                    className={`item-card shadow-sm border flex hover:shadow-lg transition-all group overflow-hidden ${theme.cardStyle === 'vertical' ? 'flex-col' : 'flex-row gap-4 p-3'}`}
                    style={{ 
                      backgroundColor: theme.cardBackgroundColor, 
                      color: theme.cardTextColor, 
                      borderColor,
                      borderRadius: theme.buttonStyle === 'rounded-none' ? '0' : '1rem'
                    }}
                  >
                    {theme.cardStyle === 'vertical' ? (
                      // Vertical Card Layout
                      <>
                        {item.imageUrl ? (
                          <div className="w-full h-48 overflow-hidden relative">
                            <img src={item.imageUrl} alt={item.name} className="item-image w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          </div>
                        ) : (
                          <div className="item-image w-full h-48 flex items-center justify-center opacity-20" style={{ backgroundColor: theme.textColor }}>
                            <Utensils className="w-12 h-12" />
                          </div>
                        )}
                        <div className="item-info p-4 flex flex-col flex-1 min-w-0">
                          <h3 className="item-title font-bold leading-tight text-lg mb-1 truncate">{item.name}</h3>
                          <p className="item-desc text-sm opacity-70 line-clamp-2 leading-relaxed flex-1">{item.description}</p>
                          <div className="flex justify-between items-center mt-4 pt-4 border-t" style={{ borderColor }}>
                            <span className="item-price font-black text-xl" style={{ color: theme.primaryColor }}>₺{item.price.toFixed(2)}</span>
                            <button 
                              onClick={() => addToCart(item)}
                              className={`add-btn px-4 py-2 flex-shrink-0 ${theme.buttonStyle} text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-md hover:scale-105 active:scale-95 font-bold text-sm`}
                              style={{ backgroundColor: theme.primaryColor }}
                            >
                              <Plus className="w-4 h-4 mr-1" /> Ekle
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      // Horizontal Card Layout
                      <>
                        {item.imageUrl ? (
                          <div className="w-24 h-24 sm:w-32 sm:h-32 overflow-hidden flex-shrink-0 relative" style={{ borderRadius: theme.buttonStyle === 'rounded-none' ? '0' : '0.75rem' }}>
                            <img src={item.imageUrl} alt={item.name} className="item-image w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          </div>
                        ) : (
                          <div className="item-image w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center opacity-20 flex-shrink-0" style={{ backgroundColor: theme.textColor, borderRadius: theme.buttonStyle === 'rounded-none' ? '0' : '0.75rem' }}>
                            <Utensils className="w-8 h-8" />
                          </div>
                        )}
                        <div className="item-info flex-1 flex flex-col justify-between py-1 pr-2 min-w-0">
                          <div>
                            <h3 className="item-title font-bold leading-tight text-lg truncate">{item.name}</h3>
                            <p className="item-desc text-xs opacity-70 mt-1.5 line-clamp-2 leading-relaxed">{item.description}</p>
                          </div>
                          <div className="flex justify-between items-center mt-3">
                            <span className="item-price font-black text-xl" style={{ color: theme.primaryColor }}>₺{item.price.toFixed(2)}</span>
                            <button 
                              onClick={() => addToCart(item)}
                              className={`add-btn w-10 h-10 flex-shrink-0 ${theme.buttonStyle} text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-md hover:scale-105 active:scale-95`}
                              style={{ backgroundColor: theme.primaryColor }}
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
      </div> {/* End of customer-menu div */}

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cart.length > 0 && !isCartOpen && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="cart-bar fixed bottom-6 left-0 right-0 px-4 z-[100] max-w-3xl mx-auto"
            style={{ fontFamily: theme.fontFamily.includes(',') ? theme.fontFamily : `var(--font-${theme.fontFamily})` }}
          >
            <button 
              onClick={() => setIsCartOpen(true)}
              className={`w-full text-white ${theme.buttonStyle} p-4 shadow-2xl flex justify-between items-center font-bold hover:opacity-95 transition-all hover:-translate-y-1 group`}
              style={{ backgroundColor: theme.primaryColor }}
            >
              <div className="flex items-center">
                <div className="bg-white/20 rounded-xl w-10 h-10 flex items-center justify-center mr-4 shadow-inner">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)}
                </div>
                <span className="text-lg">Sepeti Görüntüle</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">₺{cartTotal.toFixed(2)}</span>
                <ChevronRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart/Checkout Modal */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center"
            style={{ fontFamily: theme.fontFamily.includes(',') ? theme.fontFamily : `var(--font-${theme.fontFamily})` }}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-md h-[85vh] sm:h-auto sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl"
              style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}
            >
              <div className="p-6 border-b flex justify-between items-center" style={{ borderColor }}>
                <h2 className="text-2xl font-extrabold flex items-center">
                  <ShoppingCart className="w-6 h-6 mr-3" style={{ color: theme.primaryColor }} />
                  {isCheckout ? 'Ödeme' : 'Sepetiniz'}
                </h2>
                <button onClick={() => { setIsCartOpen(false); setIsCheckout(false); }} className="p-2 opacity-50 hover:opacity-100 transition-opacity">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)' }}>
                {!isCheckout ? (
                  <div className="space-y-3 sm:space-y-4">
                    {cart.map(item => (
                      <div key={item.id} className="p-3 sm:p-4 shadow-sm border flex justify-between items-center" style={{ backgroundColor: theme.cardBackgroundColor, color: theme.cardTextColor, borderColor, borderRadius: theme.buttonStyle === 'rounded-none' ? '0' : '1rem' }}>
                        <div className="flex-1 pr-2 sm:pr-4 min-w-0">
                          <h4 className="font-bold text-sm sm:text-base truncate">{item.name}</h4>
                          <p className="text-sm font-black mt-1" style={{ color: theme.primaryColor }}>₺{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 p-1 sm:p-1.5 border flex-shrink-0" style={{ borderColor, borderRadius: theme.buttonStyle === 'rounded-none' ? '0' : '0.75rem' }}>
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center opacity-70 hover:opacity-100 transition-all">
                            <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <span className="font-bold w-4 text-center text-sm sm:text-base">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center opacity-70 hover:opacity-100 transition-all">
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-6 shadow-sm border" style={{ backgroundColor: theme.cardBackgroundColor, color: theme.cardTextColor, borderColor, borderRadius: theme.buttonStyle === 'rounded-none' ? '0' : '1.5rem' }}>
                      <h3 className="font-extrabold mb-4">Ödeme Yöntemi</h3>
                      <div className="space-y-3">
                        <label className={`flex items-center p-4 border-2 ${theme.buttonStyle} cursor-pointer transition-all`} style={{ borderColor: paymentMethod === 'pos' ? theme.primaryColor : borderColor, backgroundColor: paymentMethod === 'pos' ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)') : 'transparent' }}>
                          <input type="radio" name="payment" value="pos" checked={paymentMethod === 'pos'} onChange={() => setPaymentMethod('pos')} className="sr-only" />
                          <div className={`w-10 h-10 ${theme.buttonStyle} flex items-center justify-center mr-4 shadow-sm`} style={{ backgroundColor: paymentMethod === 'pos' ? theme.primaryColor : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'), color: paymentMethod === 'pos' ? '#fff' : theme.cardTextColor }}>
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <span className="font-bold">Kart ile Öde (POS)</span>
                        </label>
                        <label className={`flex items-center p-4 border-2 ${theme.buttonStyle} cursor-pointer transition-all`} style={{ borderColor: paymentMethod === 'cash' ? theme.primaryColor : borderColor, backgroundColor: paymentMethod === 'cash' ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)') : 'transparent' }}>
                          <input type="radio" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="sr-only" />
                          <div className={`w-10 h-10 ${theme.buttonStyle} flex items-center justify-center mr-4 shadow-sm`} style={{ backgroundColor: paymentMethod === 'cash' ? theme.primaryColor : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'), color: paymentMethod === 'cash' ? '#fff' : theme.cardTextColor }}>
                            <Banknote className="w-5 h-5" />
                          </div>
                          <span className="font-bold">Nakit Öde</span>
                        </label>
                      </div>
                    </div>
                    <div className="p-6 shadow-sm border" style={{ backgroundColor: theme.cardBackgroundColor, color: theme.cardTextColor, borderColor, borderRadius: theme.buttonStyle === 'rounded-none' ? '0' : '1.5rem' }}>
                      <div className="flex justify-between opacity-70 font-medium mb-3">
                        <span>Ara Toplam</span>
                        <span>₺{cartTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-black text-2xl pt-4 border-t" style={{ borderColor }}>
                        <span>Toplam</span>
                        <span style={{ color: theme.primaryColor }}>₺{cartTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t" style={{ borderColor }}>
                {!isCheckout ? (
                  <button 
                    onClick={() => setIsCheckout(true)}
                    className={`w-full text-white py-4 ${theme.buttonStyle} font-bold text-lg shadow-xl hover:opacity-90 hover:-translate-y-0.5 transition-all`}
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    Ödemeye Geç
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsCheckout(false)}
                      className={`w-1/3 py-4 ${theme.buttonStyle} font-bold transition-colors border`}
                      style={{ borderColor, color: theme.textColor }}
                    >
                      Geri
                    </button>
                    <button 
                      onClick={placeOrder}
                      className={`w-2/3 text-white py-4 ${theme.buttonStyle} font-bold text-lg shadow-xl hover:opacity-90 hover:-translate-y-0.5 transition-all`}
                      style={{ backgroundColor: theme.primaryColor }}
                    >
                      Siparişi Onayla
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
