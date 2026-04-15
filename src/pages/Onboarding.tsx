import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { motion, AnimatePresence } from 'motion/react';
import { Utensils } from 'lucide-react';

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    phone: '',
    businessType: 'restaurant',
    tableCount: 10,
    menuUploaded: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      await setDoc(doc(db, 'restaurants', user.uid), {
        ownerId: user.uid,
        name: formData.name,
        city: formData.city,
        phone: formData.phone,
        businessType: formData.businessType,
        tableCount: formData.tableCount,
        menuUploaded: formData.menuUploaded,
        trialEndsAt: trialEndsAt.toISOString(),
        subscriptionStatus: 'trial',
        createdAt: new Date().toISOString()
      });
      navigate('/admin');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `restaurants/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0
    })
  };

  const [direction, setDirection] = useState(1);

  const nextStep = () => {
    setDirection(1);
    setStep(s => s + 1);
  };

  const prevStep = () => {
    setDirection(-1);
    setStep(s => s - 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-3 rounded-2xl shadow-lg mb-6">
          <Utensils className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900">
          Restoranınızı Kurun
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-slate-500">
          Adım {step} / 6
        </p>
        
        {/* Progress bar */}
        <div className="w-full max-w-xs mt-4 bg-slate-200 rounded-full h-2 overflow-hidden">
          <motion.div 
            className="bg-indigo-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(step / 6) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100 overflow-hidden relative min-h-[300px]">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="space-y-6 absolute inset-0 p-8 sm:px-10"
            >
              {step === 1 && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Restoran Adı</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="block w-full rounded-xl border-0 py-3 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all" placeholder="Örn: Lezzet Durağı" />
                </div>
              )}
              {step === 2 && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Şehir</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} className="block w-full rounded-xl border-0 py-3 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all" placeholder="Örn: İstanbul" />
                </div>
              )}
              {step === 3 && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Telefon</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="block w-full rounded-xl border-0 py-3 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all" placeholder="Örn: 0555 555 55 55" />
                </div>
              )}
              {step === 4 && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">İşletme Türü</label>
                  <select name="businessType" value={formData.businessType} onChange={handleChange} className="block w-full rounded-xl border-0 py-3 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all">
                    <option value="restaurant">Restoran</option>
                    <option value="cafe">Kafe</option>
                    <option value="bar">Bar</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>
              )}
              {step === 5 && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Masa Sayısı</label>
                  <input type="number" name="tableCount" value={formData.tableCount} onChange={handleChange} min="1" className="block w-full rounded-xl border-0 py-3 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all" />
                </div>
              )}
              {step === 6 && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Menünüz hazır mı?</label>
                  <select name="menuUploaded" value={formData.menuUploaded ? 'yes' : 'no'} onChange={(e) => setFormData(prev => ({ ...prev, menuUploaded: e.target.value === 'yes' }))} className="block w-full rounded-xl border-0 py-3 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all">
                    <option value="yes">Evet, daha sonra yükleyeceğim</option>
                    <option value="no">Hayır, manuel olarak oluşturacağım</option>
                  </select>
                </div>
              )}

              <div className="flex justify-between mt-8 absolute bottom-8 left-8 right-8">
                {step > 1 ? (
                  <button onClick={prevStep} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-all">
                    Geri
                  </button>
                ) : <div></div>}
                {step < 6 ? (
                  <button onClick={nextStep} className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all">
                    İleri
                  </button>
                ) : (
                  <button onClick={handleComplete} disabled={loading} className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0">
                    {loading ? 'Kaydediliyor...' : 'Kurulumu Tamamla'}
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
