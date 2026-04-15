import React, { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Menu, QrCode, BellRing, History, DollarSign, LogOut, Utensils, Palette } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Joyride, STATUS } from 'react-joyride';

const navigation = [
  { name: 'Gösterge Paneli', href: '/admin', icon: LayoutDashboard, className: 'nav-dashboard' },
  { name: 'Siparişler', href: '/admin/orders', icon: ShoppingBag, className: 'nav-orders' },
  { name: 'Menü Yönetimi', href: '/admin/menu', icon: Menu, className: 'nav-menu' },
  { name: 'QR Kodlar', href: '/admin/qr', icon: QrCode, className: 'nav-qr' },
  { name: 'Garson Çağrıları', href: '/admin/calls', icon: BellRing, className: 'nav-calls' },
  { name: 'Finans', href: '/admin/finance', icon: DollarSign, className: 'nav-finance' },
  { name: 'Tema ve Görünüm', href: '/admin/theme', icon: Palette, className: 'nav-theme' },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [pendingCallsCount, setPendingCallsCount] = useState(0);
  
  const prevOrdersCount = useRef(0);
  const prevCallsCount = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [runTutorial, setRunTutorial] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tutorialSteps] = useState([
    {
      target: '.nav-dashboard',
      content: 'Burası gösterge paneliniz. Günlük ciro, sipariş sayısı gibi genel istatistikleri buradan takip edebilirsiniz.',
      disableBeacon: true,
    },
    {
      target: '.nav-orders',
      content: 'Müşterilerinizden gelen tüm siparişler buraya düşer. Siparişleri hazırlayabilir ve teslim edildi olarak işaretleyebilirsiniz.',
    },
    {
      target: '.nav-menu',
      content: 'Menünüzü buradan yönetin. Kategori ekleyin, ürünlerinizi fotoğrafları ve fiyatlarıyla birlikte listeleyin. İsterseniz yapay zeka ile otomatik menü de oluşturabilirsiniz.',
    },
    {
      target: '.nav-qr',
      content: 'Masalarınız için özel QR kodlar oluşturun. Müşteriler bu kodları okutarak menüye ulaşır ve sipariş verir.',
    },
    {
      target: '.nav-calls',
      content: 'Müşteriler garson çağırdığında bildirimler buraya gelir.',
    },
    {
      target: '.nav-theme',
      content: 'Restoranınızın renklerini, fontlarını ve genel görünümünü buradan özelleştirin. Yapay zeka ile harika temalar tasarlayabilirsiniz.',
    }
  ]);

  useEffect(() => {
    // Create audio element for notifications
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setRunTutorial(true);
    }
  }, []);

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      setRunTutorial(false);
      localStorage.setItem('hasSeenTutorial', 'true');
    }
  };

  useEffect(() => {
    if (!user) return;
    const fetchRestaurant = async () => {
      const docRef = doc(db, 'restaurants', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRestaurant(data);
        
        const trialEnd = new Date(data.trialEndsAt);
        const now = new Date();
        const diffTime = Math.abs(trialEnd.getTime() - now.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setTrialDaysLeft(trialEnd > now ? diffDays : 0);
      }
    };
    fetchRestaurant();

    // Listeners for notifications
    const ordersQ = query(collection(db, 'orders'), where('restaurantId', '==', user.uid), where('status', '==', 'pending'));
    const unsubOrders = onSnapshot(ordersQ, (snapshot) => {
      const count = snapshot.docs.length;
      setPendingOrdersCount(count);
      if (count > prevOrdersCount.current && audioRef.current) {
        audioRef.current.play().catch(e => console.log('Audio play failed:', e));
      }
      prevOrdersCount.current = count;
    });

    const callsQ = query(collection(db, 'waiterCalls'), where('restaurantId', '==', user.uid), where('status', '==', 'pending'));
    const unsubCalls = onSnapshot(callsQ, (snapshot) => {
      const count = snapshot.docs.length;
      setPendingCallsCount(count);
      if (count > prevCallsCount.current && audioRef.current) {
        audioRef.current.play().catch(e => console.log('Audio play failed:', e));
      }
      prevCallsCount.current = count;
    });

    return () => {
      unsubOrders();
      unsubCalls();
    };
  }, [user]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  if (!restaurant) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
        <Utensils className="w-8 h-8 text-indigo-600" />
      </motion.div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Joyride
        steps={tutorialSteps}
        run={runTutorial}
        continuous={true}
        options={{
          showProgress: true,
          buttons: ['back', 'skip', 'primary']
        }}
        onEvent={handleJoyrideCallback}
        locale={{
          back: 'Geri',
          close: 'Kapat',
          last: 'Bitir',
          next: 'İleri',
          skip: 'Atla',
        }}
        styles={{
          tooltipContainer: {
            textAlign: 'left'
          },
          buttonPrimary: {
            backgroundColor: '#4f46e5',
            borderRadius: '8px',
            fontWeight: 'bold',
          },
          buttonBack: {
            marginRight: 10,
            color: '#64748b'
          },
          buttonSkip: {
            color: '#64748b'
          },
          overlay: {
            zIndex: 10000
          },
          tooltip: {
            zIndex: 10000
          }
        }}
      />

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-1.5 rounded-lg">
            <Utensils className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-slate-900 truncate max-w-[150px]">{restaurant.name}</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 w-72 bg-white shadow-xl shadow-slate-200/50 flex flex-col z-40 transition-transform duration-300 transform
        lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-xl shadow-md">
              <Utensils className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 truncate max-w-[140px]">{restaurant.name}</h1>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Yönetim Paneli</p>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-600"
          >
            <LogOut className="h-5 w-5 rotate-180" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto mt-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== '/admin' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`${item.className} flex items-center justify-between px-4 py-3 text-sm font-bold rounded-2xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center">
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {item.name}
                </div>
                {item.name === 'Siparişler' && pendingOrdersCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">{pendingOrdersCount}</span>
                )}
                {item.name === 'Garson Çağrıları' && pendingCallsCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">{pendingCallsCount}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-100">
          {trialDaysLeft !== null && (
            <div className={`mb-4 p-4 rounded-2xl text-sm font-medium ${trialDaysLeft > 0 ? 'bg-amber-50 text-amber-800 border border-amber-100' : 'bg-red-50 text-red-800 border border-red-100'}`}>
              {trialDaysLeft > 0 ? (
                <p>Deneme süresinin bitimine <strong>{trialDaysLeft} gün</strong> kaldı.</p>
              ) : (
                <p><strong>Deneme süresi doldu.</strong> Lütfen ödeme yöntemi ekleyin.</p>
              )}
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-bold text-slate-600 rounded-2xl hover:bg-slate-50 hover:text-red-600 transition-colors group"
          >
            <LogOut className="mr-3 h-5 w-5 text-slate-400 group-hover:text-red-500 transition-colors" />
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto pt-16 lg:pt-0">
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
          <Outlet context={{ restaurant }} />
        </div>
      </div>
    </div>
  );
}
