import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';
import { ShoppingBag, DollarSign, BellRing } from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard() {
  const { restaurant } = useOutletContext<{ restaurant: any }>();
  const [stats, setStats] = useState({
    activeOrders: 0,
    todayRevenue: 0,
    pendingCalls: 0,
  });

  useEffect(() => {
    if (!restaurant) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ordersQ = query(
      collection(db, 'orders'),
      where('restaurantId', '==', restaurant.ownerId),
      where('status', 'in', ['pending', 'preparing', 'ready'])
    );
    
    const unsubOrders = onSnapshot(ordersQ, (snapshot) => {
      setStats(prev => ({ ...prev, activeOrders: snapshot.size }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

    const callsQ = query(
      collection(db, 'waiterCalls'),
      where('restaurantId', '==', restaurant.ownerId),
      where('status', '==', 'pending')
    );
    
    const unsubCalls = onSnapshot(callsQ, (snapshot) => {
      setStats(prev => ({ ...prev, pendingCalls: snapshot.size }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'waiterCalls'));

    const revenueQ = query(
      collection(db, 'orders'),
      where('restaurantId', '==', restaurant.ownerId),
      where('status', '==', 'delivered'),
      where('createdAt', '>=', today.toISOString())
    );

    const unsubRevenue = onSnapshot(revenueQ, (snapshot) => {
      let total = 0;
      snapshot.forEach(doc => {
        total += doc.data().totalAmount || 0;
      });
      setStats(prev => ({ ...prev, todayRevenue: total }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

    return () => {
      unsubOrders();
      unsubCalls();
      unsubRevenue();
    };
  }, [restaurant]);

  const statCards = [
    { title: 'Aktif Siparişler', value: stats.activeOrders, icon: ShoppingBag, color: 'from-blue-500 to-cyan-500' },
    { title: 'Bugünkü Gelir', value: `₺${stats.todayRevenue.toFixed(2)}`, icon: DollarSign, color: 'from-emerald-500 to-teal-500' },
    { title: 'Bekleyen Çağrılar', value: stats.pendingCalls, icon: BellRing, color: 'from-orange-500 to-red-500' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gösterge Paneli</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, idx) => (
          <motion.div 
            key={stat.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-slate-100 relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`}></div>
            <div className="flex items-center relative z-10">
              <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.title}</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
