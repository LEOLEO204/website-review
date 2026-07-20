import React, { useState, useContext, useEffect, useMemo } from 'react';
import { sanitizeInput, uncloakUrl } from '../../utils/security';
import { uploadImageToSupabase } from '../../utils/supabase';

const getSessionUser = () => {
  try {
    const session = sessionStorage.getItem('wc_admin_session');
    return session ? JSON.parse(session) : null;
  } catch(e) {
    return null;
  }
};
import { ArticleContext } from '../../context/ArticleContext';
import { ProductContext } from '../../context/ProductContext';
import { menuData as staticMenuData } from '../../components/common/menuData';

const mapCategoryToId = (categoryName) => {
  const mapping = {
    "Home & Garden": "home-garden",
    "Kitchen": "kitchen",
    "Kitchen & Dining": "kitchen",
    "Tech": "electronics",
    "Electronics": "electronics",
    "Health & Lifestyle": "health-fitness",
    "Health & Fitness": "health-fitness",
    "Baby & Kid": "baby-kid",
    "Style": "style",
    "Apparel": "style",
    "Gifts": "gifts",
    "Pets": "pets",
    "Office": "office",
    "Sleep": "sleep",
    "Web Hosting & Software": "web-hosting-software",
    "Sports & Outdoors": "sports-outdoors"
  };
  return mapping[categoryName] || categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
};
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Save, 
  PlusCircle, 
  Trash, 
  CheckCircle, 
  FileText, 
  AlertCircle, 
  ArrowUp, 
  ArrowDown, 
  FileEdit, 
  Layers,
  Eye
} from 'lucide-react';

// Local uncontrolled components with internal state to prevent IME/Vietnamese Telex composition issues on re-render.
const IMEInput = ({ value, onChange, ...props }) => {
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value || '');
    }
  }, [value]);

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);
    onChange(val);
  };

  return (
    <input
      {...props}
      value={localValue}
      onChange={handleChange}
    />
  );
};

const IMETextarea = ({ value, onChange, ...props }) => {
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value || '');
    }
  }, [value]);

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);
    onChange(val);
  };

  return (
    <textarea
      {...props}
      value={localValue}
      onChange={handleChange}
    />
  );
};

// Helper function to compile blocks into static HTML compatible with the public ReviewPage
const compileBlocksToHtml = (blocks, products) => {
  return blocks.map(block => {
    if (block.type === 'text') {
      const paragraphs = (block.value || '').split('\n\n').filter(p => p.trim());
      let textHtml = paragraphs.map(p => {
        if (p.startsWith('### ')) {
          return `<h3 class="text-xl font-bold font-serif text-gray-900 mt-6 mb-3">${p.slice(4)}</h3>`;
        }
        if (p.startsWith('## ')) {
          return `<h2 class="text-2xl font-bold font-serif text-gray-900 mt-8 mb-4 border-b border-gray-200 pb-2">${p.slice(3)}</h2>`;
        }
        return `<p class="font-serif leading-relaxed mb-6 text-gray-700 text-base">${p}</p>`;
      }).join('\n');

      if (block.image) {
        textHtml += `
          <div class="my-6 rounded-xl overflow-hidden border border-gray-100 shadow-sm max-w-2xl mx-auto">
            <img src="${block.image}" class="w-full object-cover max-h-[400px]" alt="Editorial image" />
          </div>
        `;
      }

      if (block.refLink) {
        textHtml += `
          <div class="my-4 text-center">
            <a 
              href="${uncloakUrl(block.refLink)}" 
              target="_blank" 
              rel="noopener noreferrer sponsored"
              class="inline-flex items-center justify-center bg-[#da3723] hover:bg-[#b82d1c] text-white font-extrabold py-2.5 px-6 rounded text-xs tracking-widest uppercase text-center transition"
            >
              Buy Now →
            </a>
          </div>
        `;
      }

      return textHtml;
    } else if (block.type === 'pick') {
      const prod = products.find(p => p.id === block.productId);
      if (!prod) return '';

      // Generate partner buttons
      const linksHtml = (prod.affiliateLinks && prod.affiliateLinks.length > 0)
        ? prod.affiliateLinks.map(linkObj => `
            <a 
              href="${uncloakUrl(linkObj.link)}" 
              target="_blank" 
              rel="noopener noreferrer sponsored"
              class="inline-flex items-center justify-center bg-[#da3723] hover:bg-[#b82d1c] text-white font-extrabold py-2.5 px-4 rounded text-xs tracking-widest uppercase text-center transition"
            >
              Buy from ${linkObj.retailer} →
            </a>
          `).join('\n')
        : `
            <a 
              href="#" 
              class="inline-flex items-center justify-center bg-[#da3723] hover:bg-[#b82d1c] text-white font-extrabold py-2.5 px-4 rounded text-xs tracking-widest uppercase text-center transition"
            >
              Check Price →
            </a>
          `;

      return `
        <div class="border-2 border-indigo-100 rounded-xl overflow-hidden bg-white shadow-sm mb-8 p-6 scroll-mt-32">
          <div class="flex flex-wrap items-baseline gap-2 mb-3">
            <span class="bg-[#da3723] text-white font-extrabold text-xs uppercase tracking-widest px-3 py-1 rounded">
              ${block.badge || 'Top Pick'}
            </span>
            <span class="font-sans font-bold text-sm text-gray-500 uppercase tracking-wider">
              ${block.title || prod.name}
            </span>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-5 gap-6 mt-4">
            <div class="md:col-span-2 bg-[#f9f9f9] rounded-lg flex items-center justify-center p-4 border border-gray-100">
              <img 
                src="${prod.image || 'https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&q=80&w=400'}" 
                alt="${block.title || prod.name}" 
                class="max-h-56 object-contain"
              />
            </div>
            
            <div class="md:col-span-3 flex flex-col justify-between">
              <div>
                <div class="flex items-baseline justify-between mb-4 border-b border-gray-100 pb-2">
                  <span class="text-xl font-bold text-gray-900">${prod.basePrice || '$0.00'}</span>
                  <span class="text-xs text-gray-500 font-medium">SKU: ${prod.sku || 'N/A'}</span>
                </div>
                <h4 class="text-lg font-serif font-bold text-gray-900 mb-2">
                  ${prod.name}
                </h4>
                <p class="text-sm text-gray-700 leading-relaxed font-sans mb-4">
                  ${block.reason || ''}
                </p>
              </div>
              
              <div class="mt-4 space-y-2">
                <span class="block text-xs font-bold text-gray-500 uppercase tracking-wider">Purchase Options:</span>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  ${linksHtml}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }
    return '';
  }).join('\n');
};

const compressImage = (base64Str) => {
  // Trả về trực tiếp base64 gốc 100% không qua nén để bảo toàn chất lượng ảnh gốc
  return Promise.resolve(base64Str);
};

const isValidImageUrl = (url) => {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  return trimmed.startsWith('http://') || 
         trimmed.startsWith('https://') || 
         trimmed.startsWith('/') || 
         trimmed.startsWith('data:image/');
};

export default function ArticleEditor({ editingArticleId, setEditingArticleId, onCancel }) {
  const { articles, addArticle, updateArticle, deleteArticle } = useContext(ArticleContext);
  const { products } = useContext(ProductContext);
  const sessionUser = getSessionUser();
  const isReadOnly = sessionUser && sessionUser.role === 'staff_writer';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isEditing, setIsEditing] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedArticleIds, setSelectedArticleIds] = useState([]);

  // Core Form State
  const [articleForm, setArticleForm] = useState({
    id: '',
    title: '',
    category: 'Home & Garden',
    subCategory: '',
    status: 'Published',
    author: '',
    image: '',
    intro: '',
    date: '',
    isSpotlight: false,
    blocks: []
  });

  // Dynamic categories and subcategories mapping based on Mega Menu config
  const savedMenu = localStorage.getItem('wc_mega_menu_config');
  const menuData = savedMenu ? JSON.parse(savedMenu) : staticMenuData;

  const uniqueCategories = [
    "Home & Garden",
    "Kitchen",
    "Health & Lifestyle",
    "Tech",
    "Baby & Kid",
    "Style",
    "Gifts"
  ];

  const currentSubCats = menuData[articleForm.category] || [];
  const subCategoryOptions = currentSubCats.map(s => s.subCategory);

  // Sync subcategory selection when category changes
  useEffect(() => {
    if (isEditing) {
      const currentSub = menuData[articleForm.category] || [];
      const opts = currentSub.map(s => s.subCategory);
      if (opts.length > 0 && !opts.includes(articleForm.subCategory)) {
        setArticleForm(prev => ({ ...prev, subCategory: opts[0] }));
      }
    }
  }, [articleForm.category, isEditing]);

  // Handle load article for editing
  useEffect(() => {
    if (editingArticleId) {
      const art = articles.find(a => a.id === editingArticleId);
      if (art) {
        setShowValidation(false);
        setArticleForm({
          id: art.id,
          title: art.title,
          slug: art.slug || '',
          category: art.category || 'Home & Garden',
          subCategory: art.subCategory || '',
          status: art.status || 'Published',
          author: art.author || '',
          image: art.image || '',
          intro: art.intro || '',
          date: art.date || new Date().toISOString().split('T')[0],
          isSpotlight: !!art.isSpotlight,
          // Support migration of old html string articles into blocks format
          blocks: art.blocks ? [...art.blocks] : [
            { id: 'b-init', type: 'text', value: art.contentHtml || 'Start writing your editorial paragraphs here...' }
          ]
        });
        setIsEditing(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingArticleId]);

  const handleCreateClick = () => {
    setEditingArticleId(null);
    setShowValidation(false);
    setArticleForm({
      id: `POST-${Date.now().toString().slice(-4)}`,
      title: '',
      category: 'Home & Garden',
      subCategory: '',
      status: 'Published',
      author: 'Staff Writer',
      image: '',
      intro: '',
      date: new Date().toISOString().split('T')[0],
      isSpotlight: false,
      blocks: [
        { 
          id: `block-${Date.now()}-1`, 
          type: 'text', 
          value: '## Why you should trust us\n\nAt ReviewSmart, our reviews are fully independent...' 
        }
      ]
    });
    setIsEditing(true);
  };

  // Add block helpers
  const handleAddTextBlock = () => {
    const newBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: 'text',
      value: ''
    };
    setArticleForm(prev => ({
      ...prev,
      blocks: [...(prev.blocks || []), newBlock]
    }));
  };

  const handleAddPickBlock = () => {
    const firstProd = products[0]?.id || '';
    const newBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: 'pick',
      productId: firstProd,
      badge: 'Best for general use',
      title: products[0]?.name || '',
      reason: ''
    };
    setArticleForm(prev => ({
      ...prev,
      blocks: [...(prev.blocks || []), newBlock]
    }));
  };

  // Block updates
  const handleUpdateBlockValue = (idx, value) => {
    setArticleForm(prev => {
      const copy = [...(prev.blocks || [])];
      copy[idx] = { ...copy[idx], value };
      return { ...prev, blocks: copy };
    });
  };

  const handleUpdateBlockField = (idx, field, value) => {
    setArticleForm(prev => {
      const copy = [...(prev.blocks || [])];
      copy[idx] = { ...copy[idx], [field]: value };
      return { ...prev, blocks: copy };
    });
  };

  const handleUpdatePickBlockField = (idx, field, value) => {
    setArticleForm(prev => {
      const copy = [...(prev.blocks || [])];
      copy[idx] = { ...copy[idx], [field]: value };
      return { ...prev, blocks: copy };
    });
  };

  const handleRemoveBlock = (idx) => {
    setArticleForm(prev => {
      const copy = [...(prev.blocks || [])];
      copy.splice(idx, 1);
      return { ...prev, blocks: copy };
    });
  };

  const handleMoveBlock = (idx, direction) => {
    setArticleForm(prev => {
      const copy = [...(prev.blocks || [])];
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= copy.length) return prev;

      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return { ...prev, blocks: copy };
    });
  };

  const handleSaveSubmit = (e) => {
    e.preventDefault();
    if (isReadOnly) {
      alert("Bank-grade Security Alert: Access Denied. Your role 'staff_writer' is restricted to read-only access. Write/Edit operations are forbidden.");
      return;
    }
    
    // 1. Compile blocks into a raw HTML content string compatible with public view rendering
    const htmlString = compileBlocksToHtml(articleForm.blocks || [], products);

    // 2. Extract structured picks for analytics data tables and lists
    const extractedPicks = (articleForm.blocks || [])
      .filter(b => b.type === 'pick')
      .map(b => ({
        type: sanitizeInput(b.badge || 'Top Pick'),
        productId: b.productId,
        reason: sanitizeInput(b.reason || '')
      }));

    const generatedSlug = articleForm.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const originalArticle = editingArticleId ? (articles.find(a => a.id === editingArticleId) || {}) : {};
    const cleanForm = {
      ...originalArticle,
      ...articleForm,
      title: sanitizeInput(articleForm.title),
      slug: generatedSlug,
      categoryId: mapCategoryToId(articleForm.category),
      blocks: (articleForm.blocks || []).map(b => ({
        ...b,
        value: b.type === 'text' ? sanitizeInput(b.value) : b.value,
        badge: b.type === 'pick' ? sanitizeInput(b.badge) : b.badge,
        title: b.type === 'pick' ? sanitizeInput(b.title) : b.title,
        reason: b.type === 'pick' ? sanitizeInput(b.reason) : b.reason,
        ctaTitle: b.type === 'text' ? sanitizeInput(b.ctaTitle) : b.ctaTitle,
        ctaDesc: b.type === 'text' ? sanitizeInput(b.ctaDesc) : b.ctaDesc,
      })),
      contentHtml: htmlString,
      picks: extractedPicks,
      clicks: articleForm.clicks || originalArticle.clicks || 0
    };

    if (editingArticleId) {
      updateArticle(cleanForm);
    } else {
      addArticle({
        ...cleanForm,
        clicks: 0
      });
    }

    setIsEditing(false);
    setEditingArticleId(null);
    if (onCancel) onCancel(cleanForm);
  };

  const handleDeleteClick = (id) => {
    if (isReadOnly) {
      alert("Bank-grade Security Alert: Access Denied. Your role 'staff_writer' is restricted to read-only access. Delete operations are forbidden.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this article?")) {
      deleteArticle(id);
      setSelectedArticleIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const handleDeleteSelectedArticles = () => {
    if (isReadOnly) {
      alert("Bank-grade Security Alert: Access Denied. Your role 'staff_writer' is restricted to read-only access. Delete operations are forbidden.");
      return;
    }
    if (selectedArticleIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete the ${selectedArticleIds.length} selected articles?`)) {
      selectedArticleIds.forEach(id => {
        deleteArticle(id);
      });
      setSelectedArticleIds([]);
    }
  };

  useEffect(() => {
    setSelectedArticleIds([]);
  }, [searchTerm, statusFilter, categoryFilter, isEditing]);

  const filteredArticles = articles.filter(art => {
    const matchesSearch = (art.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (art.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || art.status === statusFilter;
    
    // Normalize category comparison by using standardized categoryId values
    const artCatId = art.categoryId || mapCategoryToId(art.category || '');
    const filterCatId = mapCategoryToId(categoryFilter);
    const matchesCategory = categoryFilter === 'All' || artCatId === filterCatId;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6 text-left font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Review Articles</h1>
          <p className="text-xs text-slate-500 mt-1">Design buying guides using an advanced, block-intertwined structure matching NYT Wirecutter.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={handleCreateClick}
            className="inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition shadow-sm"
          >
            <Plus size={14} />
            <span>Create New Post</span>
          </button>
        )}
      </div>

      {isReadOnly && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
          <span>⚠️ Read-Only Protection Active: Your current session role is 'Staff Writer'. Article modifications are locked.</span>
        </div>
      )}

      {isEditing ? (
        /* Block-Based Editor Workspace */
        <form onSubmit={handleSaveSubmit} className="space-y-6">
          {uploadingImage && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping"></span>
              <span>Đang tải ảnh chất lượng gốc lên Supabase Storage... Vui lòng không lưu bài viết cho đến khi hoàn tất.</span>
            </div>
          )}
          
          {/* Article Header Settings */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Article Metadata</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Article Title</label>
                <IMEInput
                  type="text"
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 bg-white transition-all duration-200"
                  value={articleForm.title}
                  onChange={(val) => setArticleForm(prev => ({ ...prev, title: val }))}
                  placeholder="The Best Cordless Vacuum Cleaners of 2026"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Release Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 bg-white transition-all duration-200"
                  value={articleForm.date}
                  onChange={(e) => setArticleForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Article Introduction (Intro)</label>
              <IMEInput
                type="text"
                placeholder="A brief, compelling introduction for the guide (leave empty to hide)..."
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 bg-white transition-all duration-200"
                value={articleForm.intro || ''}
                onChange={(val) => setArticleForm(prev => ({ ...prev, intro: val }))}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-sans">Featured Image URL (Ảnh đại diện bài viết)</label>
              <div className="flex flex-col sm:flex-row gap-2.5 items-start sm:items-center">
                <div className="flex-1 w-full">
                  <IMEInput
                    type="text"
                    placeholder="e.g. https://images.unsplash.com/... or Base64 string"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 bg-white transition-all duration-200"
                    value={articleForm.image || ''}
                    onChange={(val) => setArticleForm(prev => ({ ...prev, image: val }))}
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <label className="inline-flex items-center justify-center bg-slate-950 hover:bg-slate-800 text-white text-[10px] font-bold px-4 py-2.5 rounded-lg cursor-pointer transition shadow-sm uppercase tracking-wider w-full sm:w-auto font-sans h-[38px]">
                    <span>Upload Image</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setUploadingImage(true);
                          uploadImageToSupabase(file)
                            .then((publicUrl) => {
                              setArticleForm(prev => ({ ...prev, image: publicUrl }));
                              setUploadingImage(false);
                            })
                            .catch((err) => {
                              console.error("Storage upload failed, trying fallback compression...", err);
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                compressImage(event.target.result).then((compressedBase64) => {
                                  setArticleForm(prev => ({ ...prev, image: compressedBase64 }));
                                  setUploadingImage(false);
                                });
                              };
                              reader.readAsDataURL(file);
                            });
                        }
                      }}
                    />
                  </label>
                  {articleForm.image && (
                    <button
                      type="button"
                      onClick={() => setArticleForm(prev => ({ ...prev, image: '' }))}
                      className="text-[10px] text-rose-600 hover:text-rose-800 font-bold uppercase transition px-2 py-2 font-sans"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              {articleForm.image && isValidImageUrl(articleForm.image) && (
                <div className="mt-3 border border-slate-200 rounded-xl p-2 bg-slate-50/50 inline-block shadow-sm">
                  <img src={articleForm.image} className="max-h-32 max-w-sm object-contain rounded-lg border border-slate-200" alt="Article Preview" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Author</label>
                <IMEInput
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 bg-white transition-all duration-200"
                  value={articleForm.author || ''}
                  onChange={(val) => setArticleForm(prev => ({ ...prev, author: val }))}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                <select
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 bg-white transition-all duration-200 cursor-pointer"
                  value={articleForm.category}
                  onChange={(e) => setArticleForm(prev => ({ ...prev, category: e.target.value }))}
                >
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sub-category</label>
                <select
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 bg-white transition-all duration-200 cursor-pointer"
                  value={articleForm.subCategory}
                  onChange={(e) => setArticleForm(prev => ({ ...prev, subCategory: e.target.value }))}
                >
                  {subCategoryOptions.length > 0 ? (
                    subCategoryOptions.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))
                  ) : (
                    <option value="">-- No Subcategory --</option>
                  )}
                </select>
              </div>
            </div>

            {/* Homepage Pin Configuration */}
            <div className="pt-4 border-t border-slate-100 flex items-center">
              <label className="flex items-center space-x-3 cursor-pointer group select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={!!articleForm.isSpotlight}
                    onChange={(e) => setArticleForm(prev => ({ ...prev, isSpotlight: e.target.checked }))}
                  />
                  <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-950"></div>
                </div>
                <div className="text-left">
                  <span className="block text-[11px] font-extrabold uppercase text-slate-800 tracking-wider">Ghim làm Spotlight Trang chủ</span>
                  <span className="block text-[10px] text-slate-400">Nếu bật, bài viết này sẽ được đặt làm ô tiêu điểm chính to nhất ở trên cùng Trang chủ. Các bài bên dưới sẽ tự động lấy theo subcategory của bài này.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Editorial Content Section */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Editorial Content</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Enter review content, images, and referral link.</p>
            </div>

            {articleForm.blocks && articleForm.blocks.length > 0 ? (
              (() => {
                const block = articleForm.blocks[0];
                const idx = 0;
                return (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Paragraph Markdown/Text</label>
                      <IMETextarea
                        rows="12"
                        required
                        className="w-full px-3.5 py-3 border border-slate-200 rounded-lg text-xs font-serif focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 leading-relaxed bg-white transition-all duration-200"
                        value={block.value || ''}
                        onChange={(val) => handleUpdateBlockValue(idx, val)}
                        placeholder="Write paragraphs here. Use ## for heading titles, e.g. ## Why you should trust us"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Image Field */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Image (URL or Local Upload)</label>
                        <div className="flex flex-col sm:flex-row gap-2.5 items-start sm:items-center">
                          <div className="flex-1 w-full">
                            <IMEInput
                              type="text"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 transition-all duration-200"
                              value={block.image || ''}
                              onChange={(val) => handleUpdateBlockField(idx, 'image', val)}
                              placeholder="Paste Image URL (or upload)..."
                            />
                          </div>
                          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                            <label className="inline-flex items-center justify-center bg-slate-950 hover:bg-slate-800 text-white text-[10px] font-bold px-4 py-2 rounded-lg cursor-pointer transition shadow-sm uppercase tracking-wider w-full sm:w-auto">
                              <span>Upload file</span>
                              <input 
                                type="file" 
                                accept="image/*"
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    setUploadingImage(true);
                                    uploadImageToSupabase(file)
                                      .then((publicUrl) => {
                                        handleUpdateBlockField(idx, 'image', publicUrl);
                                        setUploadingImage(false);
                                      })
                                      .catch((err) => {
                                        console.error("Storage upload failed, trying fallback compression...", err);
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                          compressImage(event.target.result).then((compressedBase64) => {
                                            handleUpdateBlockField(idx, 'image', compressedBase64);
                                            setUploadingImage(false);
                                          });
                                        };
                                        reader.readAsDataURL(file);
                                      });
                                  }
                                }}
                              />
                            </label>
                            {block.image && (
                              <button
                                type="button"
                                onClick={() => handleUpdateBlockField(idx, 'image', '')}
                                className="text-[10px] text-rose-600 hover:text-rose-800 font-bold uppercase transition px-2 py-2"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                        {block.image && (
                          <div className="mt-3 border border-slate-200 rounded-xl p-2 bg-slate-50/50 inline-block shadow-sm">
                            <img src={block.image} className="max-h-32 max-w-sm object-contain rounded-lg border border-slate-200" alt="Block Preview" />
                          </div>
                        )}
                      </div>

                      {/* Referral Link Field */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Referral Link (Ref Link)</label>
                        <IMEInput
                          type="text"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 transition-all duration-200"
                          value={block.refLink || ''}
                          onChange={(val) => handleUpdateBlockField(idx, 'refLink', val)}
                          placeholder="e.g. https://amazon.com/ref-code..."
                        />
                        <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">This link will automatically be cloaked using bank-grade AES-256 encryption on the public site.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-slate-100">
                      {/* CTA Card Title */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">CTA Card Title (Tiêu đề khối mua hàng)</label>
                        <IMEInput
                          type="text"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 transition-all duration-200"
                          value={block.ctaTitle || ''}
                          onChange={(val) => handleUpdateBlockField(idx, 'ctaTitle', val)}
                          placeholder="e.g. The best side-by-side refrigerator"
                        />
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Tiêu đề in đậm của khối mua hàng ở cuối bài viết.</p>
                      </div>

                      {/* CTA Card Description */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">CTA Card Short Description (Đoạn text ngắn khối mua hàng)</label>
                        <IMETextarea
                          rows="3"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 transition-all duration-200"
                          value={block.ctaDesc || ''}
                          onChange={(val) => handleUpdateBlockField(idx, 'ctaDesc', val)}
                          placeholder="e.g. This spacious and efficient 36-inch fridge has an especially adjustable and sturdy interior layout..."
                        />
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Đoạn mô tả ngắn hiển thị trong khối mua hàng.</p>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs font-serif">
                No content blocks found. Please recreate the article content.
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={uploadingImage}
              className={`inline-flex items-center gap-1.5 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow transition ${
                uploadingImage ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-950 hover:bg-slate-800'
              }`}
            >
              <Save size={14} />
              <span>{uploadingImage ? 'Uploading image...' : 'Save Article'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditingArticleId(null);
                if (onCancel) onCancel();
              }}
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold px-5 py-2.5 rounded-lg transition"
            >
              Cancel
            </button>
          </div>

        </form>
      ) : (
        /* List View */
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto flex-1">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search articles by title or ID..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400 bg-slate-50/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Filter Category:</span>
                <select
                  className="border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 cursor-pointer w-full sm:w-48 transition-all"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {selectedArticleIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteSelectedArticles}
                  className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-sm animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  <Trash2 size={13} />
                  <span>Xóa đã chọn ({selectedArticleIds.length})</span>
                </button>
              )}
            </div>

            <div className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-lg flex items-center gap-1 shrink-0 select-none shadow-sm w-full sm:w-auto justify-center sm:justify-start">
              <span className="text-slate-900 font-extrabold">{filteredArticles.length}</span>
              <span>reviews</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-5 w-12 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-slate-350 text-reviewsmart-brand focus:ring-reviewsmart-brand cursor-pointer w-4 h-4"
                        checked={filteredArticles.length > 0 && selectedArticleIds.length === filteredArticles.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedArticleIds(filteredArticles.map(a => a.id));
                          } else {
                            setSelectedArticleIds([]);
                          }
                        }}
                      />
                    </th>
                    <th className="py-4 px-5 w-28">Article ID</th>
                    <th className="py-4 px-5 min-w-[320px]">Title & Category</th>
                    <th className="py-4 px-5 w-24 text-center">Views</th>
                    <th className="py-4 px-5 w-32">Author</th>
                    <th className="py-4 px-5 w-32">Release Date</th>
                    <th className="py-4 px-5 w-20 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
                  {filteredArticles.length > 0 ? (
                    filteredArticles.map((art) => (
                      <tr key={art.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-5 text-center">
                          <input
                            type="checkbox"
                            className="rounded border-slate-350 text-reviewsmart-brand focus:ring-reviewsmart-brand cursor-pointer w-4 h-4"
                            checked={selectedArticleIds.includes(art.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedArticleIds(prev => [...prev, art.id]);
                              } else {
                                setSelectedArticleIds(prev => prev.filter(selectedId => selectedId !== art.id));
                              }
                            }}
                          />
                        </td>
                        <td className="py-4 px-5 font-mono text-[10px] text-slate-400 font-medium">
                          {art.id}
                        </td>
                        <td className="py-4 px-5">
                          <a
                            href={`/reviews/${art.slug || art.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-900 hover:text-[#da3723] hover:underline transition-colors mb-1.5 block font-bold text-[13px] leading-snug"
                            title="Xem chi tiết (Khách hàng)"
                          >
                            {art.title}
                          </a>
                          <div className="text-[10px] text-slate-400 font-medium flex flex-wrap items-center gap-1.5 select-none">
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">{art.category}</span>
                            {art.subCategory && (
                              <>
                                <span className="text-slate-300 font-normal">/</span>
                                <span className="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-150">{art.subCategory}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-5 text-center font-bold text-slate-700">
                          {art.clicks || 0} views
                        </td>
                        <td className="py-4 px-5 font-semibold text-slate-600">
                          {art.author || 'Staff Writer'}
                        </td>
                        <td className="py-4 px-5 text-slate-400">
                          {art.date}
                        </td>
                        <td className="py-4 px-5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              type="button"
                              onClick={() => setEditingArticleId(art.id)}
                              className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-950 transition-colors"
                              title="Edit article parameters"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleDeleteClick(art.id)}
                              className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete guide"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400 text-xs">
                        No articles matched the filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
