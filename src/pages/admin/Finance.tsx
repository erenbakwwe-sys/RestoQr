import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { DollarSign, CreditCard, Banknote, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

export default function Finance() {
  const { restaurant } = useOutletContext<{ restaurant: any }>();
  const [orders, setOrders] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState('today');

  useEffect(() => {
    if (!restaurant) return;

    let startDate = startOfDay(new Date());
    let endDate = endOfDay(new Date());

    if (dateRange === 'yesterday') {
      startDate = startOfDay(subDays(new Date(), 1));
      endDate = endOfDay(subDays(new Date(), 1));
    } else if (dateRange === '7days') {
      startDate = startOfDay(subDays(new Date(), 7));
    }

    const q = query(
      collection(db, 'orders'),
      where('restaurantId', '==', restaurant.ownerId),
      where('status', '==', 'delivered'),
      where('createdAt', '>=', startDate.toISOString()),
      where('createdAt', '<=', endDate.toISOString())
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

    return () => unsubscribe();
  }, [restaurant, dateRange]);

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const posRevenue = orders.filter(o => o.paymentMethod === 'pos').reduce((sum, order) => sum + order.totalAmount, 0);
  const cashRevenue = orders.filter(o => o.paymentMethod === 'cash').reduce((sum, order) => sum + order.totalAmount, 0);

  const statCards = [
    { title: 'Toplam Gelir', value: `₺${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'from-emerald-500 to-teal-500' },
    { title: 'POS Ödemeleri', value: `₺${posRevenue.toFixed(2)}`, icon: CreditCard, color: 'from-blue-500 to-indigo-500' },
    { title: 'Nakit Ödemeler', value: `₺${cashRevenue.toFixed(2)}`, icon: Banknote, color: 'from-amber-500 to-orange-500' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Finans ve Raporlar</h2>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <Calendar className="w-5 h-5 text-slate-400" />
          <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="border-0 bg-transparent font-bold text-slate-700 focus:ring-0 p-0 cursor-pointer">
            <option value="today">Bugün</option>
            <option value="yesterday">Dün</option>
            <option value="7days">Son 7 Gün</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, idx) => (
          <motion.div 
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
      >
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-extrabold text-slate-900">Sipariş Geçmişi <span className="text-slate-400 font-medium text-sm ml-2">({orders.length} sipariş)</span></h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-white">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Zaman</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Masa</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Ürünler</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Yöntem</th>
                <th className="px-8 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Tutar</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(order => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 whitespace-nowrap text-sm font-medium text-slate-600">
                    {format(new Date(order.createdAt), 'd MMM, HH:mm')}
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-sm font-black text-slate-900">
                    {order.tableNumber}
                  </td>
                  <td className="px-8 py-5 text-sm text-slate-500 max-w-xs truncate">
                    {order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-slate-500 uppercase">
                    {order.paymentMethod === 'pos' ? 'Kredi Kartı' : 'Nakit'}
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-sm font-black text-indigo-600 text-right">
                    ₺{order.totalAmount.toFixed(2)}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center text-slate-500 font-medium">Bu dönem için sipariş bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
