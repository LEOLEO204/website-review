import React, { useState, useContext, useEffect } from 'react';
import { ArticleContext } from '../../context/ArticleContext';
import { ProductContext } from '../../context/ProductContext';
import { db } from '../../db';
import { secureStorage } from '../../utils/security';
import { Save, Layout, FileText, ShoppingBag, CheckCircle, Image as ImageIcon, Upload, Trash2 } from 'lucide-react';
import { uploadImageToSupabase } from '../../utils/supabase';

const compressImage = (base64Str) => {
  // Trả về trực tiếp base64 gốc 100% không qua nén để bảo toàn chất lượng ảnh gốc
  return Promise.resolve(base64Str);
};

export default function HomepageLayoutConfig({ onClose }) {
  const { articles } = useContext(ArticleContext);
  const { products } = useContext(ProductContext);

  const [latestArticleIds, setLatestArticleIds] = useState(['', '', '', '', '']);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dailyDeals, setDailyDeals] = useState([
    { name: '', merchant: 'Amazon', price: '', dealPrice: '', discount: '', buyUrl: '', imageUrl: '' },
    { name: '', merchant: 'Amazon', price: '', dealPrice: '', discount: '', buyUrl: '', imageUrl: '' },
    { name: '', merchant: 'Amazon', price: '', dealPrice: '', discount: '', buyUrl: '', imageUrl: '' }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load existing config
  useEffect(() => {
    let stored = secureStorage.getItem('wc_homepage_layout_config');
    if (!stored) {
      const plain = localStorage.getItem('wc_homepage_layout_config');
      if (plain) {
        try {
          stored = JSON.parse(plain);
          secureStorage.setItem('wc_homepage_layout_config', stored);
          localStorage.removeItem('wc_homepage_layout_config');
        } catch (e) {}
      }
    }
    if (stored) {
      try {
        const parsed = stored;
        if (parsed.latestArticleIds && Array.isArray(parsed.latestArticleIds)) {
          const filledArticles = [...parsed.latestArticleIds, '', '', '', '', ''].slice(0, 5);
          setLatestArticleIds(filledArticles);
        }
        
        if (parsed.dailyDeals && Array.isArray(parsed.dailyDeals)) {
          const filledDeals = parsed.dailyDeals.map(d => ({
            name: d.name || '',
            merchant: d.merchant || '',
            price: d.price || '',
            dealPrice: d.dealPrice || '',
            discount: d.discount || '',
            buyUrl: d.buyUrl || '',
            imageUrl: d.imageUrl || ''
          }));
          setDailyDeals(filledDeals);
        } else if (parsed.dailyDealsProductIds && Array.isArray(parsed.dailyDealsProductIds)) {
          // Migrate old format using product IDs
          const migratedDeals = parsed.dailyDealsProductIds.map(id => {
            const p = products.find(prod => prod.id === id);
            return {
              name: p ? p.name : '',
              merchant: p ? p.merchant : 'Amazon',
              price: p ? p.price || p.basePrice || '' : '',
              dealPrice: p ? p.dealPrice || p.price || p.basePrice || '' : '',
              discount: p ? p.discount || '' : '',
              buyUrl: p ? p.buyUrl || (p.affiliateLinks && p.affiliateLinks[0]?.link) || '' : '',
              imageUrl: p ? p.imageUrl || p.image || '' : ''
            };
          });
          
          while (migratedDeals.length < 3) {
            migratedDeals.push({ name: '', merchant: 'Amazon', price: '', dealPrice: '', discount: '', buyUrl: '', imageUrl: '' });
          }
          setDailyDeals(migratedDeals.slice(0, 3));
        }
      } catch (e) {
        console.error("Failed to parse homepage layout config", e);
      }
    } else {
      // Setup defaults
      const defaultArticles = articles.slice(0, 5).map(a => a.id);
      const filledArticles = [...defaultArticles, '', '', '', '', ''].slice(0, 5);
      setLatestArticleIds(filledArticles);

      // Default 3 deals from products
      const defaultDeals = products.slice(0, 3).map(p => ({
        name: p.name || '',
        merchant: p.merchant || 'Amazon',
        price: p.price || p.basePrice || '',
        dealPrice: p.dealPrice || p.price || p.basePrice || '',
        discount: p.discount || '',
        buyUrl: p.buyUrl || (p.affiliateLinks && p.affiliateLinks[0]?.link) || '',
        imageUrl: p.imageUrl || p.image || ''
      }));
      while (defaultDeals.length < 3) {
        defaultDeals.push({ name: '', merchant: 'Amazon', price: '', dealPrice: '', discount: '', buyUrl: '', imageUrl: '' });
      }
      setDailyDeals(defaultDeals.slice(0, 3));
    }
  }, [articles, products]);

  const handleSave = (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);

    const config = {
      latestArticleIds,
      dailyDeals
    };
    secureStorage.setItem('wc_homepage_layout_config', config);
    db.invalidateCache();
    
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsSaving(false);
      if (onClose) onClose();
      window.location.reload();
    }, 350);
  };

  const handleArticleChange = (index, value) => {
    const newIds = [...latestArticleIds];
    newIds[index] = value;
    setLatestArticleIds(newIds);
  };

  const handleDealFieldChange = (index, field, value) => {
    const newDeals = [...dailyDeals];
    newDeals[index] = {
      ...newDeals[index],
      [field]: value
    };
    setDailyDeals(newDeals);
  };

  const handleSelectTemplate = (index, prodId) => {
    if (!prodId) return;
    const p = products.find(prod => prod.id === prodId);
    if (!p) return;
    
    const newDeals = [...dailyDeals];
    newDeals[index] = {
      name: p.name || '',
      merchant: p.merchant || 'Amazon',
      price: p.price || p.basePrice || '',
      dealPrice: p.dealPrice || p.price || p.basePrice || '',
      discount: p.discount || '',
      buyUrl: p.buyUrl || (p.affiliateLinks && p.affiliateLinks[0]?.link) || '',
      imageUrl: p.imageUrl || p.image || ''
    };
    setDailyDeals(newDeals);
  };

  const handleImageFileChange = (index, file) => {
    if (!file) return;
    setUploadingImage(true);
    uploadImageToSupabase(file)
      .then((publicUrl) => {
        handleDealFieldChange(index, 'imageUrl', publicUrl);
        setUploadingImage(false);
      })
      .catch((err) => {
        console.error("Storage upload failed, trying fallback compression...", err);
        const reader = new FileReader();
        reader.onload = (event) => {
          compressImage(event.target.result).then((compressedBase64) => {
            handleDealFieldChange(index, 'imageUrl', compressedBase64);
            setUploadingImage(false);
          });
        };
        reader.readAsDataURL(file);
      });
  };

  return (
    <div className="space-y-6 text-left font-sans px-1 py-1">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Layout className="text-indigo-600" size={20} />
          <span>Configure Homepage Hero layout</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Specify the 5 latest articles for the left column and upload/configure the 3 products for the right column deals.
        </p>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle size={16} className="text-emerald-600" />
          <span>Homepage layout configuration saved successfully! Reloading...</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {uploadingImage && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping"></span>
            <span>Đang tải ảnh chất lượng gốc lên Supabase Storage... Vui lòng không lưu cho đến khi hoàn tất.</span>
          </div>
        )}
        
        {/* Left Column Config: 5 Latest Articles */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2 flex items-center gap-2">
            <FileText size={16} className="text-slate-500" />
            <h3 className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">
              Left Column: 5 Latest Articles ("The Latest")
            </h3>
          </div>

          <div className="space-y-3.5">
            {latestArticleIds.map((selectedId, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="sm:w-28 text-xs font-bold text-slate-500">
                  Article #{idx + 1}:
                </label>
                <select
                  value={selectedId}
                  onChange={(e) => handleArticleChange(idx, e.target.value)}
                  className="flex-grow px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 bg-white transition cursor-pointer font-medium text-slate-800"
                >
                  <option value="">-- Choose Review Article --</option>
                  {articles.map((art) => (
                    <option key={art.id} value={art.id}>
                      [{art.category}] {art.title}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column Config: 3 Daily Deals Products */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-2 flex items-center gap-2">
            <ShoppingBag size={16} className="text-slate-500" />
            <h3 className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">
              Right Column: 3 Daily Deals Products ("Daily Deals")
            </h3>
          </div>

          <div className="space-y-6">
            {dailyDeals.map((deal, idx) => (
              <div key={idx} className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Deal Product #{idx + 1}
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Product Name</label>
                    <input
                      type="text"
                      value={deal.name}
                      onChange={(e) => handleDealFieldChange(idx, 'name', e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                      placeholder="e.g. Apple AirPods Pro 3"
                    />
                  </div>

                  {/* Affiliate link */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Affiliate link / Redirect link (Buy URL)</label>
                    <input
                      type="text"
                      value={deal.buyUrl}
                      onChange={(e) => handleDealFieldChange(idx, 'buyUrl', e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400 font-mono text-slate-600"
                      placeholder="e.g. https://www.walmart.com/ip/..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Merchant */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Merchant / Retailer</label>
                    <input
                      type="text"
                      value={deal.merchant}
                      onChange={(e) => handleDealFieldChange(idx, 'merchant', e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                      placeholder="e.g. Walmart"
                    />
                  </div>

                  {/* Original price */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Original Price</label>
                    <input
                      type="text"
                      value={deal.price}
                      onChange={(e) => handleDealFieldChange(idx, 'price', e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                      placeholder="e.g. $230"
                    />
                  </div>

                  {/* Deal price */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Deal Price</label>
                    <input
                      type="text"
                      value={deal.dealPrice}
                      onChange={(e) => handleDealFieldChange(idx, 'dealPrice', e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                      placeholder="e.g. $170"
                    />
                  </div>
                </div>

                {/* Image upload and Preview */}
                <div className="bg-white p-3 rounded-lg border border-slate-200/80 flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-full sm:w-auto">
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Product image (File upload)</label>
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition shadow-sm">
                        <Upload size={12} />
                        <span>Upload Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageFileChange(idx, e.target.files[0])}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex-1 w-full">
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Or paste Image URL</label>
                    <input
                      type="text"
                      value={deal.imageUrl}
                      onChange={(e) => handleDealFieldChange(idx, 'imageUrl', e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-slate-400 text-slate-600 font-mono"
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>

                  {deal.imageUrl ? (
                    <div className="h-16 w-16 bg-slate-50 border border-slate-200 rounded flex items-center justify-center overflow-hidden shrink-0 relative group">
                      <img src={deal.imageUrl} alt="preview" className="max-h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => handleDealFieldChange(idx, 'imageUrl', '')}
                        className="absolute inset-0 bg-rose-600/80 text-white items-center justify-center opacity-0 group-hover:opacity-100 flex transition cursor-pointer"
                        title="Remove Image"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="h-16 w-16 bg-slate-100 border border-slate-200 border-dashed rounded flex flex-col items-center justify-center text-slate-400 shrink-0">
                      <ImageIcon size={16} />
                      <span className="text-[8px] mt-0.5">No image</span>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploadingImage || isSaving}
            className={`px-4 py-2 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
              uploadingImage || isSaving ? 'bg-slate-400 cursor-not-allowed opacity-80' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
            }`}
          >
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>{uploadingImage ? 'Uploading image...' : 'Save Configuration'}</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
