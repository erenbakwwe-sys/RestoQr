import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { Utensils, QrCode, TrendingUp, Clock, ChevronRight, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const restaurantDoc = await getDoc(doc(db, 'restaurants', user.uid));
      if (restaurantDoc.exists()) {
        navigate('/admin');
      } else {
        navigate('/onboarding');
      }
    } catch (error) {
      console.error("Giriş başarısız", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans selection:bg-indigo-200">
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex lg:flex-1"
          >
            <a href="#" className="-m-1.5 p-1.5 flex items-center gap-3 group">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-xl shadow-lg group-hover:shadow-indigo-500/30 transition-all duration-300">
                <Utensils className="h-6 w-6 text-white" />
              </div>
              <span className="font-extrabold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-purple-900">RestoQR</span>
            </a>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-1 justify-end"
          >
            <button
              onClick={handleLogin}
              className="text-sm font-bold leading-6 text-slate-700 hover:text-indigo-600 transition-colors flex items-center gap-1"
            >
              Giriş Yap <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        </nav>
      </header>

      <div className="relative isolate px-6 pt-14 lg:px-8 overflow-hidden">
        {/* Background decorative blobs */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
        </div>

        <div className="mx-auto max-w-3xl py-32 sm:py-48 lg:py-56">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center"
          >
            <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-7xl">
              Restoranınızı <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">QR Menülerle</span> Modernleştirin
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600 max-w-2xl mx-auto">
              Siparişleri hızlandırın, masa devir hızını artırın ve hepsi bir arada QR menü ve sipariş yönetim sistemimizle müşterilerinizi memnun edin. 14 günlük ücretsiz denemenize bugün başlayın.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <button
                onClick={handleLogin}
                className="group relative rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-sm font-bold text-white shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all duration-300"
              >
                14 Günlük Ücretsiz Denemeye Başla
                <div className="absolute inset-0 rounded-full ring-2 ring-white/20 group-hover:ring-white/40 transition-all"></div>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <div id="features" className="bg-white py-24 sm:py-32 relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-bold leading-7 text-indigo-600 uppercase tracking-wider">Daha Hızlı Hizmet</h2>
            <p className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Kafenizi yönetmek için ihtiyacınız olan her şey
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-5xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-12 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {[
                {
                  title: 'QR Menü ve Sipariş',
                  desc: 'Müşteriler kodu okutur, menünüzü görüntüler ve doğrudan telefonlarından sipariş verir.',
                  icon: QrCode,
                  color: 'from-blue-500 to-cyan-500'
                },
                {
                  title: 'Gerçek Zamanlı Mutfak Ekranı',
                  desc: 'Siparişler anında mutfakta veya yönetici panelinde belirir. Kayıp adisyonlara son.',
                  icon: Clock,
                  color: 'from-purple-500 to-pink-500'
                },
                {
                  title: 'Garson Çağrısı ve Finans',
                  desc: 'Müşteriler tek dokunuşla garson çağırabilir. Günlük gelirinizi ve sipariş geçmişinizi kolayca takip edin.',
                  icon: TrendingUp,
                  color: 'from-orange-500 to-red-500'
                }
              ].map((feature, idx) => (
                <motion.div 
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2 }}
                  className="flex flex-col bg-slate-50 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-shadow duration-300 border border-slate-100"
                >
                  <dt className="flex items-center gap-x-3 text-xl font-bold leading-7 text-slate-900 mb-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} shadow-lg`}>
                      <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    {feature.title}
                  </dt>
                  <dd className="flex flex-auto flex-col text-base leading-7 text-slate-600">
                    <p className="flex-auto">{feature.desc}</p>
                  </dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </div>
      </div>
      <div id="pricing" className="bg-slate-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl sm:text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Basit ve Şeffaf Fiyatlandırma</h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              İşletmenizin büyüklüğü ne olursa olsun, size uygun bir planımız var. Kredi kartı gerekmeden hemen deneyin.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl rounded-3xl ring-1 ring-slate-200 sm:mt-20 lg:mx-0 lg:flex lg:max-w-none shadow-xl bg-white">
            <div className="p-8 sm:p-10 lg:flex-auto">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">14 Günlük Deneme Sürümü</h3>
              <p className="mt-6 text-base leading-7 text-slate-600">
                Sistemi tamamen ücretsiz olarak 14 gün boyunca deneyin. Memnun kalırsanız işletmenize özel teklifimizle devam edin.
              </p>
              <div className="mt-10 flex items-center gap-x-4">
                <h4 className="flex-none text-sm font-semibold leading-6 text-indigo-600">Neler Dahil?</h4>
                <div className="h-px flex-auto bg-slate-100"></div>
              </div>
              <ul role="list" className="mt-8 grid grid-cols-1 gap-4 text-sm leading-6 text-slate-600 sm:grid-cols-2 sm:gap-6">
                <li className="flex gap-x-3"><CheckCircle className="h-6 w-5 flex-none text-indigo-600" /> Sınırsız Masa QR Kodu</li>
                <li className="flex gap-x-3"><CheckCircle className="h-6 w-5 flex-none text-indigo-600" /> Gerçek Zamanlı Sipariş Yönetimi</li>
                <li className="flex gap-x-3"><CheckCircle className="h-6 w-5 flex-none text-indigo-600" /> Yapay Zeka ile Tema Özelleştirme</li>
                <li className="flex gap-x-3"><CheckCircle className="h-6 w-5 flex-none text-indigo-600" /> Garson Çağrı Sistemi</li>
                <li className="flex gap-x-3"><CheckCircle className="h-6 w-5 flex-none text-indigo-600" /> Detaylı Finans Raporları</li>
                <li className="flex gap-x-3"><CheckCircle className="h-6 w-5 flex-none text-indigo-600" /> 7/24 Teknik Destek</li>
              </ul>
            </div>
            <div className="-mt-2 p-2 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0">
              <div className="rounded-2xl bg-slate-50 py-10 text-center ring-1 ring-inset ring-slate-900/5 lg:flex lg:flex-col lg:justify-center lg:py-16 h-full">
                <div className="mx-auto max-w-xs px-8">
                  <p className="text-base font-semibold text-slate-600">Deneme Sonrası</p>
                  <p className="mt-6 flex items-baseline justify-center gap-x-2">
                    <span className="text-5xl font-bold tracking-tight text-slate-900">Özel Teklif</span>
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-500">İşletmenizin kapasitesine göre fiyatlandırma</p>
                  <button
                    onClick={handleLogin}
                    className="mt-10 block w-full rounded-xl bg-indigo-600 px-3 py-4 text-center text-sm font-bold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all"
                  >
                    Hemen Ücretsiz Başla
                  </button>
                  <p className="mt-4 text-xs leading-5 text-slate-500">Kredi kartı gerektirmez</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
