import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';
import { motion } from 'motion/react';
import { Palette, Sparkles, Type, Square, Circle, CheckCircle, LayoutTemplate, Moon, Sun, Code } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export default function ThemeSettings() {
  const { restaurant } = useOutletContext<{ restaurant: any }>();
  const [loading, setLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

  const [theme, setTheme] = useState({
    primaryColor: restaurant?.theme?.primaryColor || '#4f46e5',
    backgroundColor: restaurant?.theme?.backgroundColor || '#f8fafc',
    textColor: restaurant?.theme?.textColor || '#0f172a',
    cardBackgroundColor: restaurant?.theme?.cardBackgroundColor || '#ffffff',
    cardTextColor: restaurant?.theme?.cardTextColor || '#334155',
    mode: restaurant?.theme?.mode || 'light',
    cardStyle: restaurant?.theme?.cardStyle || 'horizontal',
    fontFamily: restaurant?.theme?.fontFamily || 'sans',
    fontImport: restaurant?.theme?.fontImport || '',
    customCSS: restaurant?.theme?.customCSS || '',
    buttonStyle: restaurant?.theme?.buttonStyle || 'rounded-xl',
  });

  const handleSave = async (newTheme = theme) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'restaurants', restaurant.ownerId), {
        theme: newTheme
      });
      setSuccessMsg('Tema başarıyla kaydedildi!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `restaurants/${restaurant.ownerId}`);
    } finally {
      setLoading(false);
    }
  };

  const generateAITheme = async () => {
    if (!aiPrompt) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Sen dünya çapında ödüllü bir UI/UX Baş Tasarımcısı ve CSS Uzmanısın. Kullanıcının girdiği restoran/uygulama konseptine göre, menü sayfasının görünümünü KOMPLE değiştirecek, kusursuz, premium ve %100 MOBİL UYUMLU bir tasarım üreteceksin.

        Kullanıcının konsepti: "${aiPrompt}"

        TASARIM KURALLARI (ÇOK ÖNEMLİ):
        1. Konsept Analizi: Kullanıcı "Apple teması" derse; minimalist, bol beyaz boşluklu, glassmorphism (cam efekti), ince fontlar ve zarif gölgeler kullan. "Meksika" derse; canlı renkler, otantik desenler kullan. Konseptin ruhunu CSS ile yansıt.
        2. Mobil Uyumluluk (Responsive): Kesinlikle sabit genişlik (width: 800px vb.) KULLANMA. Her şey telefon ekranına sığmalı. 'width: 100%', 'max-width', 'padding', 'margin' kullan. Taşan (overflow) elemanlara izin verme.
        3. Arka Planlar: Düz renk yerine modern CSS Mesh Gradient'ler, Radial Gradient'ler veya görseller kullan. Görsel kullanacaksan: "background: url('https://picsum.photos/seed/konsept_kelimesi/1080/1920') center/cover fixed !important;" formatını kullan.
        4. Modern CSS Efektleri: 'backdrop-filter: blur(16px)', 'box-shadow', 'border-radius', 'transform', 'transition' gibi özellikleri bolca ve ustaca kullan. ASLA sayfayı bozacak abartılı rotasyonlar (rotate) veya kaydırmalar yapma.
        5. Tipografi: Konsepte en uygun Google Font'u seç. (Örn: Apple için 'Inter' veya 'SF Pro Display' tarzı, Eğlenceli mekanlar için 'Bangers' vb.)
        6. Profesyonellik: Tasarım kesinlikle ucuz veya karmaşık durmamalı. Renk uyumları (contrast) okunabilirliği bozmamalı.

        Uygulamamızdaki HTML yapısı şu CSS sınıflarını kullanıyor:
        - #customer-menu (Tüm sayfanın ana kapsayıcısı - Arka planı buraya ver)
        - .menu-header (Üst kısımdaki restoran adı ve kapak alanı)
        - .menu-title (Restoran adının yazdığı başlık)
        - .waiter-btn (Garson çağır butonu)
        - .category-nav (Kategori sekmelerinin olduğu alan - yapışkan menü)
        - .category-btn (Kategori butonları)
        - .category-btn-active (Seçili kategori butonu)
        - .items-grid (Ürünlerin listelendiği grid)
        - .item-card (Her bir ürün kartı - Glassmorphism buraya çok yakışır)
        - .item-image (Ürün resmi)
        - .item-info (Ürün adı, açıklaması ve fiyatının olduğu kısım)
        - .item-title (Ürün adı)
        - .item-desc (Ürün açıklaması)
        - .item-price (Ürün fiyatı)
        - .add-btn (Sepete ekle butonu)
        - .cart-bar (En alttaki sepet özeti çubuğu)

        Sadece şu formatta geçerli bir JSON döndür, markdown veya başka açıklama kullanma:
        {
          "primaryColor": "#HEX",
          "backgroundColor": "#HEX",
          "textColor": "#HEX",
          "cardBackgroundColor": "rgba(..., 0.8)",
          "cardTextColor": "#HEX",
          "mode": "light" veya "dark",
          "cardStyle": "horizontal" veya "vertical",
          "fontImport": "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');",
          "fontFamily": "'Inter', sans-serif",
          "customCSS": "#customer-menu { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%) !important; min-height: 100vh; } .item-card { background: rgba(255, 255, 255, 0.7) !important; backdrop-filter: blur(16px) !important; -webkit-backdrop-filter: blur(16px) !important; border: 1px solid rgba(255,255,255,0.4) !important; border-radius: 24px !important; box-shadow: 0 8px 32px rgba(0,0,0,0.08) !important; transition: transform 0.3s ease !important; } .item-card:hover { transform: translateY(-5px) !important; } .add-btn { background: #000 !important; color: #fff !important; border-radius: 999px !important; font-weight: 600 !important; }",
          "buttonStyle": "rounded-none", "rounded-xl" veya "rounded-full"
        }`
      });

      let text = response.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }
      
      if (text) {
        const generatedTheme = JSON.parse(text);
        setTheme({ ...theme, ...generatedTheme });
        setActiveTab('advanced');
        await handleSave({ ...theme, ...generatedTheme });
      }
    } catch (error) {
      console.error("AI Theme generation failed", error);
      alert("Yapay zeka temayı oluştururken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Tema ve Görünüm</h2>
        <button 
          onClick={() => handleSave(theme)} 
          disabled={loading}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all"
        >
          {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
        </button>
      </div>

      {successMsg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 text-emerald-800 p-4 rounded-xl flex items-center gap-2 font-bold border border-emerald-200">
          <CheckCircle className="w-5 h-5" /> {successMsg}
        </motion.div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* AI Generator */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-purple-500 to-indigo-500 opacity-5 rounded-bl-full -mr-10 -mt-10"></div>
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Yapay Zeka ile Tasarla</h3>
              <p className="text-sm text-slate-500">Konseptinizi anlatın, AI size uygun temayı oluştursun.</p>
            </div>
          </div>
          
          <div className="space-y-4 relative z-10">
            <textarea 
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Örn: Karanlık temalı, lüks bir steakhouse. Altın sarısı vurgular, büyük resimli dikey kartlar ve siyah arka plan..."
              className="w-full border-0 ring-1 ring-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-purple-600 resize-none h-32 transition-all text-sm sm:text-base"
            />
            <button 
              onClick={generateAITheme}
              disabled={loading || !aiPrompt}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" /> Temayı Oluştur
            </button>
          </div>
        </div>

        {/* Manual Settings */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Manuel Ayarlar</h3>
            </div>
            <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
              <button onClick={() => setActiveTab('basic')} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'basic' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Temel</button>
              <button onClick={() => setActiveTab('advanced')} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 ${activeTab === 'advanced' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}><Code className="w-3 h-3"/> CSS</button>
            </div>
          </div>

          <div className="space-y-8 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {activeTab === 'basic' ? (
              <>
                {/* Colors */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 border-b pb-2">Renkler</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Ana Vurgu Rengi</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={theme.primaryColor} onChange={(e) => setTheme({...theme, primaryColor: e.target.value})} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                        <input type="text" value={theme.primaryColor} onChange={(e) => setTheme({...theme, primaryColor: e.target.value})} className="border-0 ring-1 ring-slate-200 rounded p-1 text-xs font-mono uppercase w-full" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Arka Plan Rengi</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={theme.backgroundColor} onChange={(e) => setTheme({...theme, backgroundColor: e.target.value})} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                        <input type="text" value={theme.backgroundColor} onChange={(e) => setTheme({...theme, backgroundColor: e.target.value})} className="border-0 ring-1 ring-slate-200 rounded p-1 text-xs font-mono uppercase w-full" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Metin Rengi</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={theme.textColor} onChange={(e) => setTheme({...theme, textColor: e.target.value})} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                        <input type="text" value={theme.textColor} onChange={(e) => setTheme({...theme, textColor: e.target.value})} className="border-0 ring-1 ring-slate-200 rounded p-1 text-xs font-mono uppercase w-full" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Kart Arka Planı</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={theme.cardBackgroundColor} onChange={(e) => setTheme({...theme, cardBackgroundColor: e.target.value})} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                        <input type="text" value={theme.cardBackgroundColor} onChange={(e) => setTheme({...theme, cardBackgroundColor: e.target.value})} className="border-0 ring-1 ring-slate-200 rounded p-1 text-xs font-mono uppercase w-full" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Kart Metin Rengi</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={theme.cardTextColor} onChange={(e) => setTheme({...theme, cardTextColor: e.target.value})} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                        <input type="text" value={theme.cardTextColor} onChange={(e) => setTheme({...theme, cardTextColor: e.target.value})} className="border-0 ring-1 ring-slate-200 rounded p-1 text-xs font-mono uppercase w-full" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Layout & Style */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 border-b pb-2">Düzen ve Stil</h4>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">Tema Modu</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setTheme({...theme, mode: 'light'})} className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${theme.mode === 'light' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-600 hover:border-slate-200'}`}>
                        <Sun className="w-5 h-5" /> Açık
                      </button>
                      <button onClick={() => setTheme({...theme, mode: 'dark'})} className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${theme.mode === 'dark' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-600 hover:border-slate-200'}`}>
                        <Moon className="w-5 h-5" /> Koyu
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">Kart Düzeni</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setTheme({...theme, cardStyle: 'horizontal'})} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme.cardStyle === 'horizontal' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-600 hover:border-slate-200'}`}>
                        <LayoutTemplate className="w-5 h-5 rotate-90" /> Yatay (Resim Solda)
                      </button>
                      <button onClick={() => setTheme({...theme, cardStyle: 'vertical'})} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme.cardStyle === 'vertical' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-600 hover:border-slate-200'}`}>
                        <LayoutTemplate className="w-5 h-5" /> Dikey (Resim Üstte)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">Yazı Tipi</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'sans', label: 'Modern', class: 'font-sans' },
                        { id: 'serif', label: 'Klasik', class: 'font-serif' },
                        { id: 'mono', label: 'Teknik', class: 'font-mono' }
                      ].map(font => (
                        <button
                          key={font.id}
                          onClick={() => setTheme({...theme, fontFamily: font.id})}
                          className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme.fontFamily === font.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}
                        >
                          <Type className={`w-5 h-5 ${theme.fontFamily === font.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <span className={`text-xs ${font.class} ${theme.fontFamily === font.id ? 'font-bold text-indigo-900' : 'text-slate-600'}`}>{font.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">Buton Stili</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'rounded-none', label: 'Keskin', icon: Square },
                        { id: 'rounded-xl', label: 'Yuvarlak', icon: Square },
                        { id: 'rounded-full', label: 'Oval', icon: Circle }
                      ].map(btn => (
                        <button
                          key={btn.id}
                          onClick={() => setTheme({...theme, buttonStyle: btn.id})}
                          className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme.buttonStyle === btn.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}
                        >
                          <btn.icon className={`w-5 h-5 ${theme.buttonStyle === btn.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <span className={`text-xs ${theme.buttonStyle === btn.id ? 'font-bold text-indigo-900' : 'text-slate-600'}`}>{btn.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs">
                  <strong>Gelişmiş CSS:</strong> Yapay zeka bu alanı kullanarak tasarımı tamamen değiştirir.
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Google Font Import</label>
                  <input 
                    type="text" 
                    value={theme.fontImport} 
                    onChange={e => setTheme({...theme, fontImport: e.target.value})} 
                    placeholder="@import url('...');"
                    className="w-full font-mono text-xs border-0 ring-1 ring-slate-200 p-2 rounded focus:ring-2 focus:ring-indigo-600" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Özel CSS (Custom CSS)</label>
                  <textarea 
                    value={theme.customCSS} 
                    onChange={e => setTheme({...theme, customCSS: e.target.value})} 
                    placeholder="#customer-menu { ... } .item-card { ... }"
                    className="w-full font-mono text-xs border-0 ring-1 ring-slate-200 p-2 rounded focus:ring-2 focus:ring-indigo-600 h-64 resize-y" 
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-slate-50 p-4 sm:p-8 rounded-3xl border border-slate-200 mt-8 overflow-hidden">
        <h3 className="text-lg font-bold text-slate-500 uppercase tracking-wider mb-6 text-center">Müşteri Menüsü Önizleme</h3>
        <div className="flex justify-center">
          <div 
            id="customer-menu"
            className="menu-wrapper w-full max-w-[360px] rounded-[2.5rem] shadow-2xl overflow-hidden border-[8px] border-slate-800 relative h-[600px] flex flex-col" 
            style={{ 
              backgroundColor: theme.backgroundColor, 
              color: theme.textColor,
              fontFamily: theme.fontFamily.includes(',') ? theme.fontFamily : `var(--font-${theme.fontFamily})`
            }}
          >
          <style>{theme.fontImport}</style>
          <style>{theme.customCSS}</style>

          <div className="menu-header p-6 border-b border-white/10" style={{ borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
            <h4 className="menu-title text-xl font-extrabold">{restaurant?.name || 'Restoran Adı'}</h4>
            <p className="text-sm opacity-70">Masa 1</p>
          </div>
          <div className="p-6 space-y-4 pb-24 overflow-y-auto flex-1">
            
            {theme.cardStyle === 'horizontal' ? (
              <div className="item-card p-4 shadow-sm flex gap-4" style={{ backgroundColor: theme.cardBackgroundColor, color: theme.cardTextColor, borderRadius: theme.buttonStyle === 'rounded-none' ? '0' : '1rem' }}>
                <div className="item-image w-20 h-20 rounded-xl opacity-20" style={{ backgroundColor: theme.textColor }}></div>
                <div className="item-info flex-1">
                  <div className="item-title h-4 rounded w-3/4 mb-2 opacity-20" style={{ backgroundColor: theme.textColor }}></div>
                  <div className="item-desc h-3 rounded w-full mb-4 opacity-10" style={{ backgroundColor: theme.textColor }}></div>
                  <div className="flex justify-between items-center">
                    <span className="item-price font-bold" style={{ color: theme.primaryColor }}>₺120.00</span>
                    <div className={`add-btn w-8 h-8 flex items-center justify-center text-white ${theme.buttonStyle}`} style={{ backgroundColor: theme.primaryColor }}>+</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="item-card shadow-sm overflow-hidden" style={{ backgroundColor: theme.cardBackgroundColor, color: theme.cardTextColor, borderRadius: theme.buttonStyle === 'rounded-none' ? '0' : '1rem' }}>
                <div className="item-image w-full h-32 opacity-20" style={{ backgroundColor: theme.textColor }}></div>
                <div className="item-info p-4">
                  <div className="item-title h-4 rounded w-3/4 mb-2 opacity-20" style={{ backgroundColor: theme.textColor }}></div>
                  <div className="item-desc h-3 rounded w-full mb-4 opacity-10" style={{ backgroundColor: theme.textColor }}></div>
                  <div className="flex justify-between items-center mt-4">
                    <span className="item-price font-bold text-lg" style={{ color: theme.primaryColor }}>₺120.00</span>
                    <div className={`add-btn px-4 py-2 flex items-center justify-center text-white text-sm font-bold ${theme.buttonStyle}`} style={{ backgroundColor: theme.primaryColor }}>+ Ekle</div>
                  </div>
                </div>
              </div>
            )}

          </div>
          <div className="cart-bar absolute bottom-4 left-4 right-4 p-3 shadow-lg flex justify-between items-center text-white" style={{ backgroundColor: theme.primaryColor, borderRadius: theme.buttonStyle === 'rounded-none' ? '0' : '1rem' }}>
            <div className="font-bold text-sm">Sepeti Görüntüle (2)</div>
            <div className="font-bold">₺270.00</div>
          </div>
        </div>
      </div>
    </div>
    </motion.div>
  );
}
