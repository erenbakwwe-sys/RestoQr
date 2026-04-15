import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, QrCode as QrIcon, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

export default function QRCodes() {
  const { restaurant } = useOutletContext<{ restaurant: any }>();
  const [tables, setTables] = useState<any[]>([]);
  const [tableCount, setTableCount] = useState(restaurant.tableCount || 10);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!restaurant) return;

    const q = query(collection(db, 'tables'), where('restaurantId', '==', restaurant.ownerId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const t = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => parseInt(a.tableNumber) - parseInt(b.tableNumber));
      setTables(t);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'tables'));

    return () => unsubscribe();
  }, [restaurant]);

  const generateQRCodes = async () => {
    setIsGenerating(true);
    try {
      for (const table of tables) {
        await deleteDoc(doc(db, 'tables', table.id));
      }

      const baseUrl = window.location.origin;

      for (let i = 1; i <= tableCount; i++) {
        const tableId = doc(collection(db, 'tables')).id;
        const menuUrl = `${baseUrl}/menu/${restaurant.ownerId}/${i}`;
        await setDoc(doc(db, 'tables', tableId), {
          restaurantId: restaurant.ownerId,
          tableNumber: String(i),
          qrCode: menuUrl
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tables');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 print:hidden">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">QR Kodlar</h2>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <label className="text-sm font-bold text-slate-700">Masa Sayısı:</label>
            <input type="number" value={tableCount} onChange={e => setTableCount(parseInt(e.target.value) || 0)} className="w-16 border-0 p-0 text-center font-bold text-indigo-600 focus:ring-0" />
          </div>
          <button onClick={generateQRCodes} disabled={isGenerating} className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all">
            {isGenerating ? 'Oluşturuluyor...' : 'Oluştur'}
          </button>
          <button onClick={handlePrint} className="flex-1 sm:flex-none flex items-center justify-center px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all">
            <Printer className="w-4 h-4 mr-2" /> Yazdır
          </button>
        </div>
      </div>

      {tables.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm print:hidden">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrIcon className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">QR Kod Bulunamadı</h3>
          <p className="text-slate-500">Masa sayısını girip "Oluştur" butonuna tıklayarak QR kodlarınızı hazırlayın.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 print:grid-cols-3 print:gap-8 print:m-0">
          {tables.map(table => (
            <motion.div 
              key={table.id} 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center print:shadow-none print:border-slate-400 print:rounded-none group hover:shadow-xl transition-all"
            >
              <h3 className="text-lg font-black text-slate-900 mb-4 truncate w-full">{restaurant.name}</h3>
              <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm mb-4 group-hover:scale-105 transition-transform">
                <QRCodeSVG value={table.qrCode} size={140} />
              </div>
              <p className="text-2xl font-black text-indigo-600 mb-1">Masa {table.tableNumber}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider print:hidden mb-3">Sipariş için okutun</p>
              <a href={table.qrCode} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 print:hidden bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                Menüyü Aç <ExternalLink className="w-3 h-3" />
              </a>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
