import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';
import { format } from 'date-fns';
import { BellRing, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function WaiterCalls() {
  const { restaurant } = useOutletContext<{ restaurant: any }>();
  const [calls, setCalls] = useState<any[]>([]);

  useEffect(() => {
    if (!restaurant) return;

    const q = query(
      collection(db, 'waiterCalls'),
      where('restaurantId', '==', restaurant.ownerId),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const callsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callsData.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setCalls(callsData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'waiterCalls'));

    return () => unsubscribe();
  }, [restaurant]);

  const resolveCall = async (callId: string) => {
    try {
      await updateDoc(doc(db, 'waiterCalls', callId), { status: 'resolved' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `waiterCalls/${callId}`);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Garson Çağrıları</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {calls.map(call => (
            <motion.div 
              key={call.id} 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl shadow-sm border border-red-100 overflow-hidden relative group hover:shadow-xl transition-all"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-red-500 to-orange-500"></div>
              <div className="p-8 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6 animate-pulse shadow-inner">
                  <BellRing className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-2">Masa {call.tableNumber}</h3>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-8 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> {format(new Date(call.createdAt), 'HH:mm')}
                </p>
                
                <button 
                  onClick={() => resolveCall(call.id)} 
                  className="w-full flex items-center justify-center px-6 py-3.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-emerald-700 hover:-translate-y-0.5 transition-all"
                >
                  <CheckCircle className="w-5 h-5 mr-2" /> Çözüldü İşaretle
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {calls.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Harika!</h3>
            <p className="text-slate-500">Şu an bekleyen garson çağrısı yok.</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Quick fix for missing Clock icon import
import { Clock } from 'lucide-react';
