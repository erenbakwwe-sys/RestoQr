import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';
import { Plus, Trash2, Edit2, Image as ImageIcon, Menu, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';

export default function MenuManagement() {
  const { restaurant } = useOutletContext<{ restaurant: any }>();
  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemForm, setItemForm] = useState({
    id: '',
    categoryId: '',
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    isAvailable: true
  });

  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Lütfen sadece resim dosyası yükleyin.');
      return;
    }

    const storageRef = ref(storage, `menu-items/${restaurant.ownerId}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setIsUploading(true);
    setUploadProgress(0);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error('Upload error:', error);
        alert('Resim yüklenirken bir hata oluştu.');
        setIsUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setItemForm(prev => ({ ...prev, imageUrl: downloadURL }));
        setIsUploading(false);
      }
    );
  };

  useEffect(() => {
    if (!restaurant) return;

    const catQ = query(collection(db, 'categories'), where('restaurantId', '==', restaurant.ownerId));
    const unsubCat = onSnapshot(catQ, (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => a.order - b.order);
      setCategories(cats);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'categories'));

    const itemQ = query(collection(db, 'menuItems'), where('restaurantId', '==', restaurant.ownerId));
    const unsubItem = onSnapshot(itemQ, (snapshot) => {
      setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'menuItems'));

    return () => {
      unsubCat();
      unsubItem();
    };
  }, [restaurant]);

  const handleAddCategory = async () => {
    if (!categoryName) return;
    try {
      const newId = doc(collection(db, 'categories')).id;
      await setDoc(doc(db, 'categories', newId), {
        restaurantId: restaurant.ownerId,
        name: categoryName,
        order: categories.length
      });
      setCategoryName('');
      setShowCategoryModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'categories');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Bu kategoriyi silmek istediğinize emin misiniz? İçindeki tüm ürünler kategorisiz kalacaktır.')) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
    }
  };

  const handleSaveItem = async () => {
    if (!itemForm.name || !itemForm.categoryId || itemForm.price < 0) return;
    try {
      const id = itemForm.id || doc(collection(db, 'menuItems')).id;
      await setDoc(doc(db, 'menuItems', id), {
        restaurantId: restaurant.ownerId,
        categoryId: itemForm.categoryId,
        name: itemForm.name,
        description: itemForm.description,
        price: Number(itemForm.price),
        imageUrl: itemForm.imageUrl || '',
        isAvailable: itemForm.isAvailable
      });
      setShowItemModal(false);
      setItemForm({ id: '', categoryId: '', name: '', description: '', price: 0, imageUrl: '', isAvailable: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'menuItems');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    try {
      await deleteDoc(doc(db, 'menuItems', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `menuItems/${id}`);
    }
  };

  const generateAiMenu = async () => {
    if (!aiPrompt) return;
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Sen uzman bir şef ve restoran danışmanısın. Kullanıcının verdiği restoran konseptine göre detaylı ve gerçekçi bir yemek menüsü oluştur.
        Konsept: "${aiPrompt}"
        Sadece şu formatta geçerli bir JSON döndür, başka hiçbir açıklama yapma:
        {
          "categories": [
            {
              "name": "Kategori Adı (Örn: Başlangıçlar)",
              "items": [
                {
                  "name": "Yemek Adı",
                  "description": "İştah açıcı ve detaylı yemek açıklaması",
                  "price": 150, // Mantıklı bir TL fiyatı (sadece sayı)
                  "imageUrl": "https://picsum.photos/seed/yemekadi/400/400" // Yemeğe uygun seed kelimesi kullan
                }
              ]
            }
          ]
        }
        En az 3 kategori ve her kategoride en az 3-4 ürün olsun.`
      });

      let text = response.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }
      
      if (text) {
        const generatedData = JSON.parse(text);
        
        // Save to Firestore
        let orderOffset = categories.length;
        for (const cat of generatedData.categories) {
          const newCatId = doc(collection(db, 'categories')).id;
          await setDoc(doc(db, 'categories', newCatId), {
            restaurantId: restaurant.ownerId,
            name: cat.name,
            order: orderOffset++
          });

          for (const item of cat.items) {
            const newItemId = doc(collection(db, 'menuItems')).id;
            await setDoc(doc(db, 'menuItems', newItemId), {
              restaurantId: restaurant.ownerId,
              categoryId: newCatId,
              name: item.name,
              description: item.description,
              price: Number(item.price),
              imageUrl: item.imageUrl || '',
              isAvailable: true
            });
          }
        }
        
        setShowAiModal(false);
        setAiPrompt('');
      }
    } catch (error) {
      console.error("AI Menu generation failed", error);
      alert("Yapay zeka menüyü oluştururken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Menü Yönetimi</h2>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <button onClick={() => setShowAiModal(true)} className="flex-1 sm:flex-none flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <Sparkles className="w-4 h-4 mr-2" /> AI ile Menü Oluştur
          </button>
          <button onClick={() => setShowCategoryModal(true)} className="flex-1 sm:flex-none flex items-center justify-center px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all">
            <Plus className="w-4 h-4 mr-2" /> Kategori Ekle
          </button>
          <button onClick={() => { setItemForm({ id: '', categoryId: categories[0]?.id || '', name: '', description: '', price: 0, imageUrl: '', isAvailable: true }); setShowItemModal(true); }} className="flex-1 sm:flex-none flex items-center justify-center px-5 py-2.5 bg-indigo-600 rounded-xl text-sm font-bold text-white hover:bg-indigo-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <Plus className="w-4 h-4 mr-2" /> Ürün Ekle
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <AnimatePresence>
          {categories.map((category, idx) => (
            <motion.div 
              key={category.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
            >
              <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">{category.name}</h3>
                <button onClick={() => handleDeleteCategory(category.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {menuItems.filter(item => item.categoryId === category.id).map(item => (
                  <div key={item.id} className="p-6 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-5 w-full sm:w-auto">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-20 h-20 rounded-2xl object-cover shadow-sm" />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                          <ImageIcon className="w-8 h-8 opacity-50" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-slate-900">{item.name}</h4>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2 max-w-md">{item.description}</p>
                        <p className="text-lg font-black text-indigo-600 mt-2">₺{item.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto w-full sm:w-auto justify-end">
                      <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${item.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {item.isAvailable ? 'Mevcut' : 'Tükendi'}
                      </span>
                      <button onClick={() => { setItemForm(item); setShowItemModal(true); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                {menuItems.filter(item => item.categoryId === category.id).length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-sm font-medium">Bu kategoride henüz ürün yok.</div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {categories.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Menu className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Menünüz Boş</h3>
            <p className="text-slate-500">Menünüzü oluşturmaya başlamak için ilk kategorinizi ekleyin veya Yapay Zeka'dan yardım alın.</p>
            <button onClick={() => setShowAiModal(true)} className="mt-6 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
              <Sparkles className="w-4 h-4 mr-2" /> AI ile Menü Oluştur
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAiModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 sm:p-8 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-500 to-indigo-500 opacity-5 rounded-bl-full -mr-10 -mt-10"></div>
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900">AI ile Menü Oluştur</h3>
                  <p className="text-sm text-slate-500 mt-1">Konseptinizi yazın, AI sizin için kategorileri ve ürünleri oluştursun.</p>
                </div>
              </div>
              
              <div className="space-y-4 relative z-10">
                <textarea 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Örn: Lüks bir İtalyan restoranı. Başlangıçlar, pizzalar, makarnalar ve tatlılar olsun. Fiyatlar ortalamanın üstünde olsun..."
                  className="w-full border-0 ring-1 ring-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-purple-600 resize-none h-32 transition-all"
                />
                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={() => setShowAiModal(false)} disabled={isAiLoading} className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50">İptal</button>
                  <button 
                    onClick={generateAiMenu}
                    disabled={isAiLoading || !aiPrompt}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center"
                  >
                    {isAiLoading ? 'Oluşturuluyor...' : 'Menüyü Oluştur'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showCategoryModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl"
            >
              <h3 className="text-2xl font-extrabold text-slate-900 mb-6">Kategori Ekle</h3>
              <input type="text" value={categoryName} onChange={e => setCategoryName(e.target.value)} placeholder="Kategori Adı (Örn: Başlangıçlar)" className="w-full border-0 ring-1 ring-slate-200 p-4 rounded-xl mb-8 focus:ring-2 focus:ring-indigo-600 transition-all" />
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowCategoryModal(false)} className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">İptal</button>
                <button onClick={handleAddCategory} className="px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-colors">Kaydet</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showItemModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 sm:p-8 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <h3 className="text-2xl font-extrabold text-slate-900 mb-6">{itemForm.id ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Kategori</label>
                  <select value={itemForm.categoryId} onChange={e => setItemForm({...itemForm, categoryId: e.target.value})} className="w-full border-0 ring-1 ring-slate-200 p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-600 transition-all">
                    <option value="">Kategori Seçin</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Ürün Adı</label>
                  <input type="text" value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} className="w-full border-0 ring-1 ring-slate-200 p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-600 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Açıklama</label>
                  <textarea value={itemForm.description} onChange={e => setItemForm({...itemForm, description: e.target.value})} className="w-full border-0 ring-1 ring-slate-200 p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-600 transition-all resize-none" rows={3} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Fiyat (₺)</label>
                  <input type="number" value={itemForm.price} onChange={e => setItemForm({...itemForm, price: Number(e.target.value)})} className="w-full border-0 ring-1 ring-slate-200 p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-600 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Görsel (İsteğe bağlı)</label>
                  <div className="flex items-center gap-4">
                    {itemForm.imageUrl ? (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                        <img src={itemForm.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setItemForm({...itemForm, imageUrl: ''})}
                          className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-500 hover:bg-white"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                    <div className="flex-1">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all"
                      />
                      {isUploading && (
                        <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center pt-2">
                  <input type="checkbox" id="isAvailable" checked={itemForm.isAvailable} onChange={e => setItemForm({...itemForm, isAvailable: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                  <label htmlFor="isAvailable" className="ml-3 text-sm font-bold text-slate-700">Satışta (Mevcut)</label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                <button onClick={() => setShowItemModal(false)} className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">İptal</button>
                <button onClick={handleSaveItem} className="px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-colors">Kaydet</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
