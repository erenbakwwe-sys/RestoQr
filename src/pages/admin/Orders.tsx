import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, CheckCircle, ChefHat, XCircle } from 'lucide-react';

export default function Orders() {
  const { restaurant } = useOutletContext<{ restaurant: any }>();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!restaurant) return;

    const q = query(
      collection(db, 'orders'),
      where('restaurantId', '==', restaurant.ownerId),
      where('status', 'in', ['pending', 'preparing', 'ready'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      ordersData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(ordersData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

    return () => unsubscribe();
  }, [restaurant]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending': return { color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Bekliyor', icon: Clock };
      case 'preparing': return { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Hazırlanıyor', icon: ChefHat };
      case 'ready': return { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Hazır', icon: CheckCircle };
      default: return { color: 'bg-slate-100 text-slate-800 border-slate-200', label: status, icon: Clock };
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Aktif Siparişler</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {orders.map((order, idx) => {
            const statusConfig = getStatusConfig(order.status);
            const StatusIcon = statusConfig.icon;
            return (
              <motion.div 
                key={order.id} 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-shadow border border-slate-100 overflow-hidden flex flex-col"
              >
                <div className={`p-5 border-b flex justify-between items-center ${statusConfig.color} bg-opacity-50`}>
                  <div>
                    <h3 className="font-black text-xl">Masa {order.tableNumber}</h3>
                    <p className="text-xs font-bold opacity-70 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" /> {format(new Date(order.createdAt), 'HH:mm')}
                    </p>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 bg-white shadow-sm`}>
                    <StatusIcon className="w-4 h-4" /> {statusConfig.label}
                  </span>
                </div>
                
                <div className="p-6 flex-1">
                  <ul className="space-y-4 mb-6">
                    {order.items.map((item: any, idx: number) => (
                      <li key={idx} className="flex justify-between text-sm items-start">
                        <span className="flex gap-3">
                          <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{item.quantity}x</span> 
                          <span className="font-medium text-slate-700">{item.name}</span>
                        </span>
                        <span className="font-bold text-slate-900">₺{(item.price * item.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                    <span className="font-bold text-slate-500 uppercase text-xs tracking-wider">Toplam</span>
                    <span className="font-black text-xl text-slate-900">₺{order.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="mt-3 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50 p-2 rounded-lg inline-block">
                    Ödeme: {order.paymentMethod === 'pos' ? 'Kredi Kartı' : 'Nakit'} - {order.paymentStatus === 'pending' ? 'Bekliyor' : 'Ödendi'}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                  {order.status === 'pending' && (
                    <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 hover:-translate-y-0.5 transition-all">
                      Hazırlamaya Başla
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button onClick={() => updateOrderStatus(order.id, 'ready')} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold shadow-md hover:bg-emerald-700 hover:-translate-y-0.5 transition-all">
                      Hazır İşaretle
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button onClick={() => updateOrderStatus(order.id, 'delivered')} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 hover:-translate-y-0.5 transition-all">
                      Teslim Edildi
                    </button>
                  )}
                  <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="p-3 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 hover:text-red-700 transition-colors" title="İptal Et">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {orders.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Harika!</h3>
            <p className="text-slate-500">Şu an bekleyen aktif siparişiniz yok.</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
