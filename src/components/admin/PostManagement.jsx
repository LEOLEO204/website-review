import React, { useState, useEffect } from 'react';
import { db } from '../../db';
import { menuData as staticMenuData } from '../common/menuData';
import { 
  LayoutDashboard, FileText, Database, Layers, TrendingUp, 
  Plus, Search, Filter, Edit2, Trash2, Eye, ArrowUpDown, 
  CheckCircle, AlertCircle, RefreshCw, PlusCircle, Link as LinkIcon, 
  Trash, Save, ArrowRight, User, Image, Tag, DollarSign, ListOrdered
} from 'lucide-react';

const isValidImageUrl = (url) => {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  return trimmed.startsWith('http://') || 
         trimmed.startsWith('https://') || 
         trimmed.startsWith('/') || 
         trimmed.startsWith('data:image/');
};

const compressImage = (base64Str) => {
  // Trả về trực tiếp base64 gốc 100% không qua nén để bảo toàn chất lượng ảnh gốc
  return Promise.resolve(base64Str);
};

export default function PostManagement() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [posts, setPosts] = useState([]);
  const [products, setProducts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [selectedPostIds, setSelectedPostIds] = useState([]);

  // Mega Menu State
  const [megaMenuConfig, setMegaMenuConfig] = useState({});
  const [selectedMegaCategory, setSelectedMegaCategory] = useState('');
  const [selectedMegaSubCategory, setSelectedMegaSubCategory] = useState('');

  // Analytics simulated click log state
  const [analyticsClicks, setAnalyticsClicks] = useState([]);

  // Form States
  const [editingPost, setEditingPost] = useState(null); // null = creating new post
  const [postForm, setPostForm] = useState({
    id: '', slug: '', title: '', categoryId: 'home-garden', author: 'Hai Xuyen', 
    authorRole: 'Senior Editor', intro: '', contentHtml: '', status: 'Published',
    image: '', subCategory: '', date: ''
  });

  const [editingProduct, setEditingProduct] = useState(null); // null = creating new product
  const [productForm, setProductForm] = useState({
    id: '', name: '', image: '', price: '$0.00', merchant: 'Amazon', 
    buyUrl: '#', affiliateLinks: [{ retailer: 'Amazon', link: '#' }],
    tagline: 'Outstanding performance', shortDescription: '', rating: 4.8, 
    reviewsCount: 120, pros: '', cons: '', badge: 'Our pick', badgeColor: 'bg-reviewsmart-brand'
  });

  // Load database values
  const reloadData = () => {
    setPosts(db.getArticles());
    setProducts(db.getProducts());
    setDeals(db.getDeals());
    setCategories(db.getCategories());

    // Load Mega Menu Config
    const savedMenu = localStorage.getItem('wc_mega_menu_config');
    const menuObj = savedMenu ? JSON.parse(savedMenu) : staticMenuData;
    setMegaMenuConfig(menuObj);

    const firstCat = Object.keys(menuObj)[0] || '';
    setSelectedMegaCategory(firstCat);
    if (menuObj[firstCat] && menuObj[firstCat].length > 0) {
      setSelectedMegaSubCategory(menuObj[firstCat][0].subCategory);
    } else {
      setSelectedMegaSubCategory('');
    }

    // Load Analytics Clicks
    const clicks = JSON.parse(localStorage.getItem('wc_simulated_clicks')) || [
      { id: 1, postTitle: 'The Best Cordless Vacuum Cleaners of 2026', retailer: 'Amazon', clicks: 820, conversions: 24, commission: 98.40 },
      { id: 2, postTitle: 'The Best Cordless Vacuum Cleaners of 2026', retailer: 'Dyson Store', clicks: 600, conversions: 18, commission: 144.00 },
      { id: 3, postTitle: 'The Best Air Purifiers for Your Home and Office', retailer: 'Amazon', clicks: 750, conversions: 15, commission: 45.00 },
      { id: 4, postTitle: 'The Best Air Purifiers for Your Home and Office', retailer: 'Target', clicks: 235, conversions: 8, commission: 20.80 },
      { id: 5, postTitle: 'The Best Nonstick Pans We\'ve Tested and Reviewed', retailer: 'Walmart', clicks: 1910, conversions: 57, commission: 85.50 },
      { id: 6, postTitle: 'The Best Nonstick Pans We\'ve Tested and Reviewed', retailer: 'Amazon', clicks: 1500, conversions: 45, commission: 112.50 }
    ];
    setAnalyticsClicks(clicks);
  };

  useEffect(() => {
    db.init();
    reloadData();
  }, []);

  const triggerFeedback = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  // ----------------------------------------------------
  // ARTICLE CRUD LOGIC
  // ----------------------------------------------------
  const handleSavePost = (e) => {
    e.preventDefault();
    const slugName = postForm.slug || postForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const toSave = {
      ...postForm,
      id: postForm.id || `article-${Date.now()}`,
      slug: slugName,
      updatedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      verifiedPick: true
    };
    db.saveArticle(toSave);
    reloadData();
    setActiveTab('articles');
    setEditingPost(null);
    setPostForm({
      id: '', slug: '', title: '', categoryId: 'home-garden', author: 'Hai Xuyen', 
      authorRole: 'Senior Editor', intro: '', contentHtml: '', status: 'Published',
      image: '', subCategory: '', date: ''
    });
    triggerFeedback(`Article "${toSave.title}" successfully saved!`);
  };

  const handleEditPostClick = (art) => {
    setEditingPost(art.id);
    setPostForm({
      id: art.id,
      slug: art.slug || '',
      title: art.title,
      categoryId: art.categoryId || 'home-garden',
      author: art.author || 'Hai Xuyen',
      authorRole: art.authorRole || 'Senior Editor',
      intro: art.intro || '',
      contentHtml: art.contentHtml || '',
      status: art.status || 'Published',
      image: art.image || '',
      subCategory: art.subCategory || '',
      date: art.date || ''
    });
    setActiveTab('article-creator');
  };

  const handleDeletePost = (id) => {
    if (window.confirm("Are you sure you want to delete this article review?")) {
      db.deleteArticle(id);
      setSelectedPostIds(prev => prev.filter(selectedId => selectedId !== id));
      reloadData();
      triggerFeedback("Article successfully deleted.");
    }
  };

  const handleDeleteSelectedPosts = () => {
    if (selectedPostIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete the ${selectedPostIds.length} selected articles?`)) {
      selectedPostIds.forEach(id => {
        db.deleteArticle(id);
      });
      reloadData();
      setSelectedPostIds([]);
      triggerFeedback(`${selectedPostIds.length} articles successfully deleted.`);
    }
  };

  useEffect(() => {
    setSelectedPostIds([]);
  }, [searchTerm, statusFilter, activeTab]);

  // ----------------------------------------------------
  // PRODUCT DATABASE CRUD LOGIC
  // ----------------------------------------------------
  const handleSaveProduct = (e) => {
    e.preventDefault();
    const toSave = {
      ...productForm,
      id: productForm.id || `product-${Date.now()}`,
      price: productForm.price || '$0.00',
      rating: Number(productForm.rating) || 4.5,
      reviewsCount: Number(productForm.reviewsCount) || 10,
      pros: typeof productForm.pros === 'string' ? productForm.pros.split('\n').filter(p => p.trim()) : productForm.pros,
      cons: typeof productForm.cons === 'string' ? productForm.cons.split('\n').filter(c => c.trim()) : productForm.cons
    };
    db.saveProduct(toSave);
    reloadData();
    setActiveTab('products');
    setEditingProduct(null);
    setProductForm({
      id: '', name: '', image: '', price: '$0.00', merchant: 'Amazon', 
      buyUrl: '#', affiliateLinks: [{ retailer: 'Amazon', link: '#' }],
      tagline: 'Outstanding performance', shortDescription: '', rating: 4.8, 
      reviewsCount: 120, pros: '', cons: '', badge: 'Our pick', badgeColor: 'bg-reviewsmart-brand'
    });
    triggerFeedback(`Product "${toSave.name}" successfully updated & cascaded to pages!`);
  };

  const handleEditProductClick = (prod) => {
    setEditingProduct(prod.id);
    setProductForm({
      id: prod.id,
      name: prod.name,
      image: prod.image || '',
      price: prod.price || '$0.00',
      merchant: prod.merchant || 'Amazon',
      buyUrl: prod.buyUrl || '#',
      affiliateLinks: prod.affiliateLinks && prod.affiliateLinks.length > 0 
        ? [...prod.affiliateLinks] 
        : [{ retailer: prod.merchant || 'Amazon', link: prod.buyUrl || '#' }],
      tagline: prod.tagline || 'Outstanding performance',
      shortDescription: prod.shortDescription || '',
      rating: prod.rating || 4.5,
      reviewsCount: prod.reviewsCount || 10,
      pros: Array.isArray(prod.pros) ? prod.pros.join('\n') : (prod.pros || ''),
      cons: Array.isArray(prod.cons) ? prod.cons.join('\n') : (prod.cons || ''),
      badge: prod.badge || 'Our pick',
      badgeColor: prod.badgeColor || 'bg-reviewsmart-brand'
    });
    setActiveTab('product-form');
  };

  const handleDeleteProduct = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      db.deleteProduct(id);
      reloadData();
      triggerFeedback("Product deleted from database.");
    }
  };

  const handleAddAffiliateLinkRow = () => {
    setProductForm(prev => ({
      ...prev,
      affiliateLinks: [...prev.affiliateLinks, { retailer: '', link: '' }]
    }));
  };

  const handleRemoveAffiliateLinkRow = (index) => {
    setProductForm(prev => {
      const updated = [...prev.affiliateLinks];
      updated.splice(index, 1);
      return { ...prev, affiliateLinks: updated.length === 0 ? [{ retailer: '', link: '' }] : updated };
    });
  };

  const handleAffiliateLinkRowChange = (index, field, value) => {
    setProductForm(prev => {
      const updated = [...prev.affiliateLinks];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, affiliateLinks: updated };
    });
  };

  // ----------------------------------------------------
  // MEGA MENU CONFIG LOGIC
  // ----------------------------------------------------
  const handleSaveMegaMenuConfig = () => {
    localStorage.setItem('wc_mega_menu_config', JSON.stringify(megaMenuConfig));
    triggerFeedback("Mega Menu Structure successfully updated and published to public site!");
  };

  const handleResetMegaMenuConfig = () => {
    if (window.confirm("Restore mega menu layout to defaults?")) {
      localStorage.removeItem('wc_mega_menu_config');
      reloadData();
      triggerFeedback("Mega Menu Layout restored to default.");
    }
  };

  const handleUpdateMegaSubCategoryName = (oldName, newName) => {
    if (!newName.trim() || oldName === newName) return;
    setMegaMenuConfig(prev => {
      const copy = { ...prev };
      if (copy[selectedMegaCategory]) {
        copy[selectedMegaCategory] = copy[selectedMegaCategory].map(sub => 
          sub.subCategory === oldName ? { ...sub, subCategory: newName } : sub
        );
      }
      return copy;
    });
    setSelectedMegaSubCategory(newName);
  };

  const handleAddSubCategory = () => {
    const name = window.prompt("Enter new subcategory name:");
    if (!name || !name.trim()) return;
    setMegaMenuConfig(prev => {
      const copy = { ...prev };
      if (!copy[selectedMegaCategory]) {
        copy[selectedMegaCategory] = [];
      }
      copy[selectedMegaCategory].push({
        subCategory: name.trim(),
        columns: [{ title: 'New Column', items: ['Sample Item'] }]
      });
      return copy;
    });
    setSelectedMegaSubCategory(name.trim());
  };

  const handleAddMegaColumn = (subCatName) => {
    setMegaMenuConfig(prev => {
      const copy = { ...prev };
      const list = copy[selectedMegaCategory] || [];
      const sub = list.find(s => s.subCategory === subCatName);
      if (sub) {
        sub.columns.push({ title: 'New Category Column', items: ['Sample Product'] });
      }
      return copy;
    });
  };

  const handleUpdateMegaColumnTitle = (subCatName, colIndex, newTitle) => {
    setMegaMenuConfig(prev => {
      const copy = { ...prev };
      const sub = (copy[selectedMegaCategory] || []).find(s => s.subCategory === subCatName);
      if (sub && sub.columns[colIndex]) {
        sub.columns[colIndex].title = newTitle;
      }
      return copy;
    });
  };

  const handleAddMegaItem = (subCatName, colIndex) => {
    const item = window.prompt("Enter new item name:");
    if (!item || !item.trim()) return;
    setMegaMenuConfig(prev => {
      const copy = { ...prev };
      const sub = (copy[selectedMegaCategory] || []).find(s => s.subCategory === subCatName);
      if (sub && sub.columns[colIndex]) {
        sub.columns[colIndex].items.push(item.trim());
      }
      return copy;
    });
  };

  const handleRemoveMegaItem = (subCatName, colIndex, itemIndex) => {
    setMegaMenuConfig(prev => {
      const copy = { ...prev };
      const sub = (copy[selectedMegaCategory] || []).find(s => s.subCategory === subCatName);
      if (sub && sub.columns[colIndex]) {
        sub.columns[colIndex].items.splice(itemIndex, 1);
      }
      return copy;
    });
  };

  const handleRemoveMegaColumn = (subCatName, colIndex) => {
    if (!window.confirm("Delete this entire column and all its products?")) return;
    setMegaMenuConfig(prev => {
      const copy = { ...prev };
      const sub = (copy[selectedMegaCategory] || []).find(s => s.subCategory === subCatName);
      if (sub) {
        sub.columns.splice(colIndex, 1);
      }
      return copy;
    });
  };

  const handleRemoveSubCategory = (subCatName) => {
    if (!window.confirm(`Delete "${subCatName}" subcategory and all column lists?`)) return;
    setMegaMenuConfig(prev => {
      const copy = { ...prev };
      copy[selectedMegaCategory] = (copy[selectedMegaCategory] || []).filter(s => s.subCategory !== subCatName);
      return copy;
    });
    // Set active to first left
    const remaining = (megaMenuConfig[selectedMegaCategory] || []).filter(s => s.subCategory !== subCatName);
    if (remaining.length > 0) {
      setSelectedMegaSubCategory(remaining[0].subCategory);
    } else {
      setSelectedMegaSubCategory('');
    }
  };

  // ----------------------------------------------------
  // WIRECUTTER BOX INSERTER WIDGET
  // ----------------------------------------------------
  const [wirecutterBoxBadge, setWirecutterBoxBadge] = useState('Our pick');
  const [wirecutterBoxBadgeColor, setWirecutterBoxBadgeColor] = useState('bg-reviewsmart-brand');
  const [selectedBoxProduct, setSelectedBoxProduct] = useState('');
  const [wirecutterBoxWhyText, setWirecutterBoxWhyText] = useState('');

  const handleInsertWirecutterBox = () => {
    const product = products.find(p => p.id === selectedBoxProduct);
    if (!product) {
      alert("Please select a product from the database first.");
      return;
    }
    
    // Generate beautiful Wirecutter box HTML block
    const boxHtml = `
<div class="my-8 border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white font-sans text-slate-800">
  <div class="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <span class="${wirecutterBoxBadgeColor} text-white font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded">
        ${wirecutterBoxBadge}
      </span>
      <span class="text-xs font-bold text-gray-500 uppercase tracking-wide truncate max-w-xs">
        ${product.name}
      </span>
    </div>
    <span class="text-sm font-bold text-gray-900">${product.price}</span>
  </div>
  <div class="p-5 flex flex-col md:flex-row gap-5">
    <div class="w-full md:w-1/4 flex justify-center items-center bg-[#fcfcfc] p-2 border border-gray-100 rounded">
      <img src="${product.image || 'https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&q=80&w=400'}" alt="${product.name}" class="max-h-28 object-contain" />
    </div>
    <div class="w-full md:w-3/4 flex flex-col justify-between">
      <div>
        <h4 class="text-sm font-bold text-gray-900 mb-1.5">${product.tagline || 'Highly recommended pick'}</h4>
        <p class="text-xs text-gray-600 leading-relaxed mb-3">${product.shortDescription || 'Tested and reviewed for absolute reliability.'}</p>
        <div class="bg-slate-50 border border-slate-100 rounded p-3 mb-4">
          <p class="text-xs font-semibold text-slate-900 mb-1">Why we pick it:</p>
          <p class="text-xs text-slate-600 leading-relaxed italic">"${wirecutterBoxWhyText || 'It offers the perfect combination of durability, performance, and price.'}"</p>
        </div>
      </div>
      <div>
        <a href="/reviews/${postForm.slug || 'best-basic-home-toolkit'}" class="inline-flex items-center text-xs font-extrabold text-reviewsmart-brand hover:underline">
          View full review specs <span class="ml-1">→</span>
        </a>
      </div>
    </div>
  </div>
</div>
`;

    setPostForm(prev => ({
      ...prev,
      contentHtml: (prev.contentHtml || '') + boxHtml
    }));
    
    // Auto sync product's badge in db
    const updatedProd = {
      ...product,
      badge: wirecutterBoxBadge,
      badgeColor: wirecutterBoxBadgeColor,
      articleId: postForm.id || `article-${Date.now()}`
    };
    db.saveProduct(updatedProd);
    reloadData();

    triggerFeedback("Linked product box inserted into post HTML!");
  };

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || post.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate high-level stats
  const totalClicks = analyticsClicks.reduce((sum, c) => sum + c.clicks, 0);
  const totalConversions = analyticsClicks.reduce((sum, c) => sum + c.conversions, 0);
  const totalCommission = analyticsClicks.reduce((sum, c) => sum + c.commission, 0);
  const averageCR = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : '0.00';

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans antialiased text-slate-800">
      
      {/* ----------------------------------------------------
          SIDEBAR NAVIGATION (1/5 Width)
          ---------------------------------------------------- */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0">
        {/* Brand identity */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-reviewsmart-brand flex items-center justify-center font-bold text-white text-base">
              RS
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-white leading-tight">ReviewSmart</h2>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">CMS Portal</span>
            </div>
          </div>
        </div>

        {/* Identity bar */}
        <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/50 flex items-center gap-3">
          <div className="h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs uppercase text-slate-300">
            HX
          </div>
          <div>
            <p className="text-xs font-bold text-white">Hai Xuyen</p>
            <span className="text-[9px] text-slate-500 font-medium">Senior Editor</span>
          </div>
        </div>

        {/* Sidebar Navigation items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <button
            onClick={() => { setActiveTab('dashboard'); reloadData(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'hover:bg-slate-800/50 hover:text-white text-slate-400'
            }`}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => { setActiveTab('articles'); reloadData(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'articles' || activeTab === 'article-creator'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'hover:bg-slate-800/50 hover:text-white text-slate-400'
            }`}
          >
            <FileText size={16} />
            <span>Review Articles</span>
          </button>

          <button
            onClick={() => { setActiveTab('products'); reloadData(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'products' || activeTab === 'product-form'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'hover:bg-slate-800/50 hover:text-white text-slate-400'
            }`}
          >
            <Database size={16} />
            <span>Product Database</span>
          </button>

          <button
            onClick={() => { setActiveTab('mega-menu'); reloadData(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'mega-menu'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'hover:bg-slate-800/50 hover:text-white text-slate-400'
            }`}
          >
            <Layers size={16} />
            <span>Mega Menu Config</span>
          </button>

          <button
            onClick={() => { setActiveTab('aff-analytics'); reloadData(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'aff-analytics'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'hover:bg-slate-800/50 hover:text-white text-slate-400'
            }`}
          >
            <TrendingUp size={16} />
            <span>Affiliate Analytics</span>
          </button>
        </nav>

        {/* CMS Reset widget */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => {
              if (window.confirm("Reset all custom articles, database products, and configurations?")) {
                db.resetDatabase();
                localStorage.removeItem('wc_mega_menu_config');
                localStorage.removeItem('wc_simulated_clicks');
                reloadData();
                triggerFeedback("Database reset to seeded original values successfully.");
              }
            }}
            className="w-full flex items-center justify-center gap-2 border border-slate-800 bg-slate-950/40 hover:bg-rose-950/40 hover:border-rose-900/60 hover:text-rose-400 py-2 rounded text-[10px] font-bold text-slate-500 uppercase tracking-wider transition-all"
          >
            <RefreshCw size={12} />
            <span>Restore Defaults</span>
          </button>
        </div>
      </aside>

      {/* ----------------------------------------------------
          MAIN CONTENT WORKSPACE (4/5 Width)
          ---------------------------------------------------- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium text-xs">CMS /</span>
            <span className="text-slate-900 font-bold text-xs capitalize">{activeTab.replace('-', ' ')}</span>
          </div>
          
          <div className="flex items-center gap-4">
            {feedbackMsg && (
              <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md font-medium animate-pulse">
                {feedbackMsg}
              </span>
            )}

          </div>
        </header>

        {/* Dashboard/Tab Contents Panel */}
        <div className="p-8 max-w-7xl w-full mx-auto flex-1">
          
          {/* ====================================================
              TAB: DASHBOARD
              ==================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Executive Dashboard</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Vetted product recommendation CTR and affiliate revenue tracker.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide">Live Feed Connected</span>
                </div>
              </div>

              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Gross Click-Throughs</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-black text-slate-900">{totalClicks.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+12.4%</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2 block">Direct clicks to affiliated merchants</span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Conversion rate (CR)</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-black text-slate-900">{averageCR}%</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Steady</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2 block">Standard 2.5% industry benchmark</span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Est. Earnings</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-black text-slate-900">${totalCommission.toFixed(2)}</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+$42.50</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2 block">Accumulated commission earnings</span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Products Vetted</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-black text-slate-900">{products.length} items</span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Seeded</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2 block">Unique active product recommendations</span>
                </div>
              </div>

              {/* Interactive Performance SVG Chart */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-950">Click-Through Growth Trend</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Clicks captured across categories in the last 7 days.</p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold border border-slate-200 rounded px-2.5 py-1">Last 7 Days</span>
                </div>
                
                {/* SVG Line Chart */}
                <div className="h-48 w-full relative">
                  <svg className="w-full h-full" viewBox="0 0 700 150" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#da3723" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#da3723" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Grid lines */}
                    <line x1="0" y1="25" x2="700" y2="25" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3" />
                    <line x1="0" y1="75" x2="700" y2="75" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3" />
                    <line x1="0" y1="125" x2="700" y2="125" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3" />
                    
                    {/* Area fill */}
                    <path
                      d="M 0,150 L 0,110 L 116,95 L 233,130 L 350,60 L 466,75 L 583,40 L 700,20 L 700,150 Z"
                      fill="url(#chartGrad)"
                    />
                    
                    {/* Line path */}
                    <path
                      d="M 0,110 L 116,95 L 233,130 L 350,60 L 466,75 L 583,40 L 700,20"
                      fill="none"
                      stroke="#da3723"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Nodes */}
                    <circle cx="116" cy="95" r="4" fill="#ffffff" stroke="#da3723" strokeWidth="2" />
                    <circle cx="233" cy="130" r="4" fill="#ffffff" stroke="#da3723" strokeWidth="2" />
                    <circle cx="350" cy="60" r="4" fill="#ffffff" stroke="#da3723" strokeWidth="2" />
                    <circle cx="466" cy="75" r="4" fill="#ffffff" stroke="#da3723" strokeWidth="2" />
                    <circle cx="583" cy="40" r="4" fill="#ffffff" stroke="#da3723" strokeWidth="2" />
                    <circle cx="700" cy="20" r="4" fill="#ffffff" stroke="#da3723" strokeWidth="2" />
                  </svg>
                </div>
                
                {/* Chart labels */}
                <div className="flex justify-between items-center text-[9px] font-extrabold text-slate-400 mt-4 px-2 uppercase tracking-wider">
                  <span>Mon (12)</span>
                  <span>Tue (13)</span>
                  <span>Wed (14)</span>
                  <span>Thu (15)</span>
                  <span>Fri (16)</span>
                  <span>Sat (17)</span>
                  <span>Sun (18)</span>
                </div>
              </div>

              {/* Bottom split: Top Performing and Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Performing Articles */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
                  <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider mb-4">Top Conversion Sources</h3>
                  <div className="divide-y divide-slate-100">
                    {posts.slice(0, 3).map((art, idx) => (
                      <div key={idx} className="py-3 flex items-center justify-between">
                        <div className="min-w-0 pr-4">
                          <p className="text-xs font-bold text-slate-900 truncate">{art.title}</p>
                          <span className="text-[10px] text-slate-400">{art.categoryId || 'home-garden'} • {art.author}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-extrabold text-slate-950">{(totalClicks * (0.4 - idx * 0.1)).toFixed(0)} clicks</p>
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{(5.2 - idx * 0.8).toFixed(1)}% CR</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions Panel */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider mb-3">Vetted Quick Editor</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">Jump straight to editor mode to author new reviews or register pricing changes.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <button 
                      onClick={() => {
                        setEditingPost(null);
                        setPostForm({
                          id: '', slug: '', title: '', categoryId: 'home-garden', author: 'Hai Xuyen', 
                          authorRole: 'Senior Editor', intro: '', contentHtml: '', status: 'Published'
                        });
                        setActiveTab('article-creator');
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg text-xs font-bold transition shadow-sm"
                    >
                      <PlusCircle size={14} />
                      <span>Write Review Article</span>
                    </button>
                    
                    <button 
                      onClick={() => {
                        setEditingProduct(null);
                        setProductForm({
                          id: '', name: '', image: '', price: '$0.00', merchant: 'Amazon', 
                          buyUrl: '#', affiliateLinks: [{ retailer: 'Amazon', link: '#' }],
                          tagline: 'Outstanding performance', shortDescription: '', rating: 4.8, 
                          reviewsCount: 120, pros: '', cons: '', badge: 'Our pick', badgeColor: 'bg-reviewsmart-brand'
                        });
                        setActiveTab('product-form');
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2 rounded-lg text-xs font-bold transition"
                    >
                      <PlusCircle size={14} />
                      <span>Add Product Specs</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ====================================================
              TAB: REVIEW ARTICLES
              ==================================================== */}
          {activeTab === 'articles' && (
            <div className="space-y-6 text-left">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Review Articles</h1>
                  <p className="text-xs text-slate-500 mt-1">Vetted comparison guides and product ranking editorials.</p>
                </div>
                <button 
                  onClick={() => {
                    setEditingPost(null);
                    setPostForm({
                      id: '', slug: '', title: '', categoryId: 'home-garden', author: 'Hai Xuyen', 
                      authorRole: 'Senior Editor', intro: '', contentHtml: '', status: 'Published'
                    });
                    setActiveTab('article-creator');
                  }}
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  <Plus size={14} />
                  <span>Create New Post</span>
                </button>
              </div>

              {/* Filter Area */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search by title or ID..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400 bg-slate-50/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {selectedPostIds.length > 0 && (
                  <button
                    onClick={handleDeleteSelectedPosts}
                    className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm animate-in fade-in slide-in-from-top-1 duration-150"
                  >
                    <Trash2 size={14} />
                    <span>Xóa các bài viết đã chọn ({selectedPostIds.length})</span>
                  </button>
                )}
              </div>

              {/* Articles Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-5 w-12 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-slate-350 text-reviewsmart-brand focus:ring-reviewsmart-brand cursor-pointer w-4 h-4"
                        checked={filteredPosts.length > 0 && selectedPostIds.length === filteredPosts.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPostIds(filteredPosts.map(p => p.id));
                          } else {
                            setSelectedPostIds([]);
                          }
                        }}
                      />
                    </th>
                    <th className="py-4 px-5 w-28">Article ID</th>
                    <th className="py-4 px-5 min-w-[320px]">Title & Category</th>
                    <th className="py-4 px-5 w-32">Status</th>
                    <th className="py-4 px-5 w-24 text-center">Views</th>
                    <th className="py-4 px-5 w-36">
                      <div className="flex items-center gap-1 cursor-pointer hover:text-slate-900">
                        <span>Author</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th className="py-4 px-5 w-32">Updated Date</th>
                    <th className="py-4 px-5 w-24 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
                  {filteredPosts.length > 0 ? (
                    filteredPosts.map((post) => (
                      <tr key={post.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-5 text-center">
                          <input
                            type="checkbox"
                            className="rounded border-slate-350 text-reviewsmart-brand focus:ring-reviewsmart-brand cursor-pointer w-4 h-4"
                            checked={selectedPostIds.includes(post.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPostIds(prev => [...prev, post.id]);
                              } else {
                                setSelectedPostIds(prev => prev.filter(selectedId => selectedId !== post.id));
                              }
                            }}
                          />
                        </td>
                        <td className="py-4 px-5 font-mono text-[10px] text-slate-400 font-medium">
                          {post.id}
                        </td>
                        <td className="py-4 px-5">
                          <div className="font-bold text-slate-900 line-clamp-1">
                            {post.title}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                            <span>{post.categoryId}</span>
                            <span>•</span>
                            <span>Slug: /{post.slug}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          {post.status === 'Published' || !post.status ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50/50 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-100">
                              <CheckCircle size={10} /> Published
                            </span>
                          ) : post.status === 'Draft' ? (
                            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50/50 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-100">
                              <FileText size={10} /> Draft
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-50 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200">
                              <AlertCircle size={10} /> Archived
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-center font-bold text-slate-700">
                          {post.clicks || 0} views
                        </td>
                        <td className="py-4 px-5 font-medium text-slate-900">
                          {post.author}
                        </td>
                        <td className="py-4 px-5 text-slate-400">
                          {post.updatedAt || 'June 18, 2026'}
                        </td>
                            <td className="py-4 px-5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button 
                                  onClick={() => handleEditPostClick(post)}
                                  className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
                                  title="Edit review guide"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <a 
                                  href={`/reviews/${post.slug}`} 
                                  className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 transition-colors"
                                  title="Preview page"
                                >
                                  <Eye size={13} />
                                </a>
                                <button 
                                  onClick={() => handleDeletePost(post.id)}
                                  className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-600 transition-colors"
                                  title="Delete review guide"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="py-12 text-center text-slate-400 text-xs">
                            No articles found matching your query.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ====================================================
              TAB: ARTICLE CREATOR (Block Insert interface)
              ==================================================== */}
          {activeTab === 'article-creator' && (
            <div className="space-y-6 text-left">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {editingPost ? 'Edit Review Post' : 'Create New Review Post'}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">Author article content and link recommended products directly.</p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                
                {/* Form fields (Left 2 columns) */}
                <form onSubmit={handleSavePost} className="xl:col-span-2 space-y-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1.5">Article Title</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                        value={postForm.title}
                        onChange={(e) => setPostForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g. The Best Cordless Vacuum Cleaners of 2026"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1.5">Category ID</label>
                      <select
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400 bg-white"
                        value={postForm.categoryId}
                        onChange={(e) => setPostForm(prev => ({ ...prev, categoryId: e.target.value }))}
                      >
                        <option value="home-garden">Home & Garden</option>
                        <option value="kitchen">Kitchen</option>
                        <option value="electronics">Electronics</option>
                        <option value="health-fitness">Health & Fitness</option>
                        <option value="baby-kid">Baby & Kid</option>
                        <option value="outdoors">Outdoors</option>
                        <option value="style">Style</option>
                        <option value="office">Office</option>
                        <option value="pets">Pets</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1.5">Author</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                        value={postForm.author}
                        onChange={(e) => setPostForm(prev => ({ ...prev, author: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1.5">Author Role</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                        value={postForm.authorRole}
                        onChange={(e) => setPostForm(prev => ({ ...prev, authorRole: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1.5">Publish Status</label>
                      <select
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400 bg-white"
                        value={postForm.status}
                        onChange={(e) => setPostForm(prev => ({ ...prev, status: e.target.value }))}
                      >
                        <option value="Published">Published</option>
                        <option value="Draft">Draft</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1.5">Featured Image URL (Ảnh đại diện)</label>
                      <div className="flex flex-col sm:flex-row gap-2.5 items-start sm:items-center">
                        <div className="flex-1 w-full">
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                            value={postForm.image || ''}
                            onChange={(e) => setPostForm(prev => ({ ...prev, image: e.target.value }))}
                            placeholder="e.g. https://example.com/image.jpg or Base64"
                          />
                        </div>
                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                          <label className="inline-flex items-center justify-center bg-slate-950 hover:bg-slate-800 text-white text-[10px] font-bold px-4 py-2 rounded-lg cursor-pointer transition shadow-sm uppercase tracking-wider w-full sm:w-auto h-[34px]">
                            <span>Upload Image</span>
                            <input 
                              type="file" 
                              accept="image/*"
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    const originalBase64 = event.target.result;
                                    compressImage(originalBase64).then((compressedBase64) => {
                                      setPostForm(prev => ({ ...prev, image: compressedBase64 }));
                                    });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          {postForm.image && (
                            <button
                              type="button"
                              onClick={() => setPostForm(prev => ({ ...prev, image: '' }))}
                              className="text-[10px] text-rose-600 hover:text-rose-800 font-bold uppercase transition px-2 py-2"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                      {postForm.image && isValidImageUrl(postForm.image) && (
                        <div className="mt-3 border border-slate-200 rounded-xl p-2 bg-slate-50/50 inline-block shadow-sm">
                          <img src={postForm.image} className="max-h-24 max-w-xs object-contain rounded-lg border border-slate-200" alt="Article Preview" />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1.5">Sub-category (Danh mục con)</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                          value={postForm.subCategory}
                          onChange={(e) => setPostForm(prev => ({ ...prev, subCategory: e.target.value }))}
                          placeholder="e.g. Coffee & Tea"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1.5">Publish Date (Ngày đăng)</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                          value={postForm.date}
                          onChange={(e) => setPostForm(prev => ({ ...prev, date: e.target.value }))}
                          placeholder="e.g. 2026-06-20"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1.5">Intro / Standfirst</label>
                    <textarea
                      rows="2"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                      value={postForm.intro}
                      onChange={(e) => setPostForm(prev => ({ ...prev, intro: e.target.value }))}
                      placeholder="Write a brief, compelling introduction for the guide..."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1.5">Editorial Content (HTML Block)</label>
                    <textarea
                      rows="10"
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs focus:outline-none focus:border-slate-400"
                      value={postForm.contentHtml}
                      onChange={(e) => setPostForm(prev => ({ ...prev, contentHtml: e.target.value }))}
                      placeholder="<h3>Why you should trust us</h3><p>Content goes here...</p>"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow transition"
                    >
                      <Save size={14} />
                      <span>Publish Post</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('articles')}
                      className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold px-5 py-2.5 rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>

                {/* Wirecutter product card insertion panel (Right column) */}
                <div className="space-y-6">
                  
                  {/* Insert Box Panel */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div>
                      <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <LinkIcon size={14} className="text-reviewsmart-brand" />
                        <span>Insert Wirecutter Box</span>
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-1">Choose a database product to link and insert a pre-designed vetted card block directly into your article.</p>
                    </div>

                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">1. Select Badge Title</label>
                      <select
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs bg-white"
                        value={wirecutterBoxBadge}
                        onChange={(e) => setWirecutterBoxBadge(e.target.value)}
                      >
                        <option value="Our pick">Our pick (Default)</option>
                        <option value="Also great">Also great</option>
                        <option value="The budget pick">The budget pick</option>
                        <option value="Upgrade pick">Upgrade pick</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">2. Badge Color Theme</label>
                      <div className="flex gap-2">
                        {[
                          { color: 'bg-reviewsmart-brand', label: 'Brand Red' },
                          { color: 'bg-slate-900', label: 'Dark Charcoal' },
                          { color: 'bg-blue-600', label: 'Tech Blue' },
                          { color: 'bg-emerald-600', label: 'Eco Green' }
                        ].map(theme => (
                          <button
                            key={theme.color}
                            type="button"
                            onClick={() => setWirecutterBoxBadgeColor(theme.color)}
                            className={`flex-1 text-[9px] font-bold py-1.5 rounded text-white ${theme.color} border-2 ${
                              wirecutterBoxBadgeColor === theme.color ? 'border-amber-400 scale-105' : 'border-transparent opacity-80'
                            }`}
                          >
                            {theme.label.split(' ')[1]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">3. Select DB Product</label>
                      <select
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs bg-white"
                        value={selectedBoxProduct}
                        onChange={(e) => setSelectedBoxProduct(e.target.value)}
                      >
                        <option value="">-- Choose Product --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            [{p.id.toUpperCase()}] {p.name} ({p.price})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">4. Why we pick it (Short Statement)</label>
                      <textarea
                        rows="3"
                        className="w-full px-2.5 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-slate-400"
                        value={wirecutterBoxWhyText}
                        onChange={(e) => setWirecutterBoxWhyText(e.target.value)}
                        placeholder="Explain briefly to readers why this particular product was selected..."
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleInsertWirecutterBox}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-lg transition"
                    >
                      <Plus size={13} />
                      <span>Inject Card into HTML</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ====================================================
              TAB: PRODUCT DATABASE
              ==================================================== */}
          {activeTab === 'products' && (
            <div className="space-y-6 text-left">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Product Database</h1>
                  <p className="text-xs text-slate-500 mt-1">Central repository for products, base prices, and multi-retailer affiliate urls.</p>
                </div>
                <button 
                  onClick={() => {
                    setEditingProduct(null);
                    setProductForm({
                      id: '', name: '', image: '', price: '$0.00', merchant: 'Amazon', 
                      buyUrl: '#', affiliateLinks: [{ retailer: 'Amazon', link: '#' }],
                      tagline: 'Outstanding performance', shortDescription: '', rating: 4.8, 
                      reviewsCount: 120, pros: '', cons: '', badge: 'Our pick', badgeColor: 'bg-reviewsmart-brand'
                    });
                    setActiveTab('product-form');
                  }}
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  <Plus size={14} />
                  <span>Add New Product</span>
                </button>
              </div>

              {/* Products List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {products.map(prod => (
                  <div key={prod.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition">
                    <div>
                      {/* Top bar info */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <span className="font-mono text-[9px] font-extrabold text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {prod.id}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => handleEditProductClick(prod)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-950 transition"
                            title="Edit product parameters"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-600 transition"
                            title="Remove product"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Main info row */}
                      <div className="flex gap-4">
                        <div className="h-16 w-16 bg-slate-50 border border-slate-100 rounded flex items-center justify-center shrink-0 p-1.5">
                          <img 
                            src={prod.image || 'https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&q=80&w=400'} 
                            alt={prod.name}
                            className="max-h-full object-contain"
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&q=80&w=400'; }}
                          />
                        </div>
                        
                        <div>
                          <h3 className="font-bold text-xs text-slate-950 line-clamp-1">{prod.name}</h3>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-xs font-black text-reviewsmart-brand">{prod.price}</span>
                            <span className="text-[10px] text-slate-400">Reference Price</span>
                          </div>
                          <p className="text-[10px] text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                            {prod.shortDescription || 'No description recorded.'}
                          </p>
                        </div>
                      </div>

                      {/* Affiliate links display list */}
                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Affiliate Commission Channels</span>
                        
                        {prod.affiliateLinks && prod.affiliateLinks.length > 0 ? (
                          <div className="grid grid-cols-2 gap-1.5">
                            {prod.affiliateLinks.map((linkObj, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100">
                                <span className="text-[9px] font-bold text-slate-700 truncate mr-2">{linkObj.retailer || 'Unknown'}</span>
                                <a 
                                  href={linkObj.link} 
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[9px] text-reviewsmart-brand hover:underline font-extrabold"
                                >
                                  Link <span className="font-sans">↗</span>
                                </a>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100">
                            <span className="text-[9px] font-bold text-slate-700 truncate mr-2">{prod.merchant || 'Amazon'} (Single)</span>
                            <a 
                              href={prod.buyUrl} 
                              target="_blank"
                              rel="noreferrer"
                              className="text-[9px] text-reviewsmart-brand hover:underline font-extrabold"
                            >
                              Link <span className="font-sans">↗</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ====================================================
              TAB: PRODUCT EDIT FORM / CREATE NEW
              ==================================================== */}
          {activeTab === 'product-form' && (
            <div className="space-y-6 text-left">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {editingProduct ? 'Edit Product Parameters' : 'Register New Product'}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">Control pricing tables, images, and multi-retailer affiliate link channels.</p>
              </div>

              <form onSubmit={handleSaveProduct} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1.5">Product ID</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400 font-mono"
                      value={productForm.id}
                      onChange={(e) => setProductForm(prev => ({ ...prev, id: e.target.value }))}
                      disabled={editingProduct !== null}
                      placeholder="e.g. vacuum-dyson-v15"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1.5">Product Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                      value={productForm.name}
                      onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Dyson V15 Detect Cordless Vacuum"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1.5">Base Price</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400 font-bold text-reviewsmart-brand"
                      value={productForm.price}
                      onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="e.g. $650"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1.5">Product Image Link</label>
                    <div className="flex flex-col sm:flex-row gap-2.5 items-start sm:items-center">
                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                          value={productForm.image || ''}
                          onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.value }))}
                          placeholder="URL or base64 data"
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                        <label className="inline-flex items-center justify-center bg-slate-950 hover:bg-slate-800 text-white text-[10px] font-bold px-4 py-2.5 rounded-lg cursor-pointer transition shadow-sm uppercase tracking-wider w-full sm:w-auto h-[34px]">
                          <span>Upload</span>
                          <input 
                            type="file" 
                            accept="image/*"
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const originalBase64 = event.target.result;
                                  compressImage(originalBase64).then((compressedBase64) => {
                                    setProductForm(prev => ({ ...prev, image: compressedBase64 }));
                                  });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {productForm.image && (
                          <button
                            type="button"
                            onClick={() => setProductForm(prev => ({ ...prev, image: '' }))}
                            className="text-[10px] text-rose-600 hover:text-rose-800 font-bold uppercase transition px-2 py-2"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                    {productForm.image && isValidImageUrl(productForm.image) && (
                      <div className="mt-3 border border-slate-200 rounded-xl p-2 bg-slate-50/50 inline-block shadow-sm">
                        <img src={productForm.image} className="max-h-24 max-w-xs object-contain rounded-lg border border-slate-200" alt="Product Preview" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1.5">Product Tagline</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                      value={productForm.tagline}
                      onChange={(e) => setProductForm(prev => ({ ...prev, tagline: e.target.value }))}
                      placeholder="e.g. Best cordless vacuum cleaner overall"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1.5">Short Product Synopsis</label>
                  <textarea
                    rows="2"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                    value={productForm.shortDescription}
                    onChange={(e) => setProductForm(prev => ({ ...prev, shortDescription: e.target.value }))}
                    placeholder="Short description highlighting key test performance results..."
                  />
                </div>

                {/* DYNAMIC AFFILIATE LINKS ARRAY EDITOR */}
                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">Multi-Retailer Affiliate link list</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Associate this product with multiple purchase platforms for commission generation.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddAffiliateLinkRow}
                      className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold px-2.5 py-1.5 rounded transition uppercase tracking-wide"
                    >
                      <Plus size={12} />
                      <span>Add Retailer Link</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {productForm.affiliateLinks.map((linkObj, idx) => (
                      <div key={idx} className="flex gap-3 items-center">
                        <div className="w-1/4">
                          <input
                            type="text"
                            required
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white text-xs"
                            placeholder="Retailer (e.g. Amazon)"
                            value={linkObj.retailer}
                            onChange={(e) => handleAffiliateLinkRowChange(idx, 'retailer', e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            required
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white text-xs font-mono"
                            placeholder="Affiliate Redirect Link (e.g. https://amazon.com/...)"
                            value={linkObj.link}
                            onChange={(e) => handleAffiliateLinkRowChange(idx, 'link', e.target.value)}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAffiliateLinkRow(idx)}
                          className="p-2 border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 rounded transition"
                          title="Delete link row"
                        >
                          <Trash size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1.5">Pros (One item per line)</label>
                    <textarea
                      rows="3"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-sans"
                      value={productForm.pros}
                      onChange={(e) => setProductForm(prev => ({ ...prev, pros: e.target.value }))}
                      placeholder="e.g. Extremely lightweight&#10;Excellent battery run time"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1.5">Cons (One item per line)</label>
                    <textarea
                      rows="3"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-sans"
                      value={productForm.cons}
                      onChange={(e) => setProductForm(prev => ({ ...prev, cons: e.target.value }))}
                      placeholder="e.g. Expensive retail price&#10;Dustbin capacity is small"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow transition"
                  >
                    <Save size={14} />
                    <span>Save Product specs</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('products')}
                    className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold px-5 py-2.5 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ====================================================
              TAB: MEGA MENU CONFIG
              ==================================================== */}
          {activeTab === 'mega-menu' && (
            <div className="space-y-6 text-left">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mega Menu Configuration</h1>
                  <p className="text-xs text-slate-500 mt-1">Configure the 3-level navigation menu (Header category, sidebar group, column contents).</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleSaveMegaMenuConfig}
                    className="inline-flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded shadow transition"
                  >
                    <Save size={13} />
                    <span>Publish Menu Layout</span>
                  </button>
                  <button 
                    onClick={handleResetMegaMenuConfig}
                    className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold px-4 py-2 rounded transition"
                  >
                    <RefreshCw size={13} />
                    <span>Restore Defaults</span>
                  </button>
                </div>
              </div>

              {/* 3-level tree visual builder */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                
                {/* Level 1: Category selection (Left 1/4) */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                  <h3 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider">Level 1: Main Category</h3>
                  
                  <div className="flex flex-col space-y-1">
                    {Object.keys(megaMenuConfig).map(catKey => (
                      <button
                        key={catKey}
                        onClick={() => {
                          setSelectedMegaCategory(catKey);
                          const subList = megaMenuConfig[catKey] || [];
                          setSelectedMegaSubCategory(subList.length > 0 ? subList[0].subCategory : '');
                        }}
                        className={`text-left px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
                          selectedMegaCategory === catKey 
                            ? 'text-reviewsmart-brand bg-rose-50/50' 
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {catKey}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Level 2: Subcategory/Sidebar (Center-Left 1/4) */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider">Level 2: Sidebar List</h3>
                    <button 
                      onClick={handleAddSubCategory}
                      className="text-[10px] text-reviewsmart-brand font-bold hover:underline"
                    >
                      + Add
                    </button>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    {(megaMenuConfig[selectedMegaCategory] || []).length > 0 ? (
                      (megaMenuConfig[selectedMegaCategory] || []).map(sub => (
                        <div key={sub.subCategory} className="group flex items-center justify-between rounded-lg hover:bg-slate-50">
                          <button
                            onClick={() => setSelectedMegaSubCategory(sub.subCategory)}
                            className={`flex-1 text-left px-3 py-2 text-xs font-bold transition-all ${
                              selectedMegaSubCategory === sub.subCategory 
                                ? 'text-slate-950 font-extrabold' 
                                : 'text-slate-500'
                            }`}
                          >
                            {sub.subCategory}
                          </button>
                          
                          <div className="hidden group-hover:flex items-center pr-2 gap-1.5">
                            <button 
                              onClick={() => {
                                const newName = window.prompt("Rename subcategory:", sub.subCategory);
                                if (newName) handleUpdateMegaSubCategoryName(sub.subCategory, newName);
                              }}
                              className="text-slate-400 hover:text-slate-700"
                              title="Rename subcategory"
                            >
                              <Edit2 size={11} />
                            </button>
                            <button 
                              onClick={() => handleRemoveSubCategory(sub.subCategory)}
                              className="text-slate-300 hover:text-rose-600"
                              title="Delete subcategory"
                            >
                              <Trash size={11} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400 text-center py-4">No subcategories.</span>
                    )}
                  </div>
                </div>

                {/* Level 3: Right columns layout details (Right 2/4) */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider">Level 3: Category Grid</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">Columns and items rendered when "{selectedMegaSubCategory || 'N/A'}" is active.</p>
                    </div>
                    {selectedMegaSubCategory && (
                      <button 
                        onClick={() => handleAddMegaColumn(selectedMegaSubCategory)}
                        className="inline-flex items-center gap-1 border border-slate-200 hover:bg-slate-50 px-2.5 py-1 rounded text-[10px] font-bold text-slate-700"
                      >
                        <Plus size={11} /> Add Column
                      </button>
                    )}
                  </div>

                  {selectedMegaSubCategory ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {((megaMenuConfig[selectedMegaCategory] || []).find(s => s.subCategory === selectedMegaSubCategory)?.columns || []).map((col, colIdx) => (
                        <div key={colIdx} className="border border-slate-100 rounded-lg p-4 bg-slate-50/50 space-y-3 relative group">
                          
                          {/* Column delete icon */}
                          <button
                            onClick={() => handleRemoveMegaColumn(selectedMegaSubCategory, colIdx)}
                            className="absolute top-3 right-3 text-slate-300 hover:text-rose-600 hidden group-hover:block"
                            title="Delete this column"
                          >
                            <Trash size={12} />
                          </button>
                          
                          <div>
                            <label className="block text-[8px] font-extrabold text-slate-400 uppercase mb-1">Column Header</label>
                            <input 
                              type="text"
                              className="w-full px-2 py-1 border border-slate-200 rounded font-bold text-xs bg-white"
                              value={col.title}
                              onChange={(e) => handleUpdateMegaColumnTitle(selectedMegaSubCategory, colIdx, e.target.value)}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="block text-[8px] font-extrabold text-slate-400 uppercase">Product items</label>
                              <button 
                                onClick={() => handleAddMegaItem(selectedMegaSubCategory, colIdx)}
                                className="text-[9px] text-reviewsmart-brand font-bold hover:underline"
                              >
                                + Add item
                              </button>
                            </div>

                            <ul className="space-y-1">
                              {col.items.map((item, itemIdx) => (
                                <li key={itemIdx} className="flex items-center justify-between text-xs text-slate-600 bg-white px-2 py-1 rounded border border-slate-100">
                                  <span className="font-semibold text-[11px] truncate max-w-[120px]">{item}</span>
                                  <button
                                    onClick={() => handleRemoveMegaItem(selectedMegaSubCategory, colIdx, itemIdx)}
                                    className="text-slate-300 hover:text-rose-500 font-bold"
                                    title="Delete product item link"
                                  >
                                    ×
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      Please select/create a Level 2 subcategory.
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ====================================================
              TAB: AFFILIATE ANALYTICS
              ==================================================== */}
          {activeTab === 'aff-analytics' && (
            <div className="space-y-8 text-left">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Affiliate Analytics</h1>
                <p className="text-xs text-slate-500 mt-1">Detailed performance tracking, click logging, and estimated commission revenue logs.</p>
              </div>

              {/* Chart of performance */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-extrabold text-xs text-slate-950 uppercase tracking-wider mb-4">Daily Referral Conversions</h3>
                
                {/* SVG Bar Chart */}
                <div className="h-32 flex items-end justify-between gap-3 pt-6 border-b border-slate-100">
                  {[
                    { day: 'Mon', clicks: 240, height: 'h-12' },
                    { day: 'Tue', clicks: 360, height: 'h-[72px]' },
                    { day: 'Wed', clicks: 180, height: 'h-9' },
                    { day: 'Thu', clicks: 510, height: 'h-[102px]' },
                    { day: 'Fri', clicks: 420, height: 'h-[84px]' },
                    { day: 'Sat', clicks: 680, height: 'h-[120px]' },
                    { day: 'Sun', clicks: 750, height: 'h-[128px]' }
                  ].map((bar, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-[9px] font-bold text-slate-500">{bar.clicks}</span>
                      <div className={`w-full ${bar.height} bg-slate-900 rounded-t transition-all duration-300 hover:bg-reviewsmart-brand`}></div>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase mt-1">{bar.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Click Sources Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-extrabold text-xs text-slate-950 uppercase tracking-wider">Simulated Traffic click log</h3>
                  <button
                    onClick={() => {
                      const reset = [
                        { id: 1, postTitle: 'The Best Cordless Vacuum Cleaners of 2026', retailer: 'Amazon', clicks: 0, conversions: 0, commission: 0.00 },
                        { id: 2, postTitle: 'The Best Cordless Vacuum Cleaners of 2026', retailer: 'Dyson Store', clicks: 0, conversions: 0, commission: 0.00 },
                        { id: 3, postTitle: 'The Best Air Purifiers for Your Home and Office', retailer: 'Amazon', clicks: 0, conversions: 0, commission: 0.00 }
                      ];
                      localStorage.setItem('wc_simulated_clicks', JSON.stringify(reset));
                      reloadData();
                      triggerFeedback("Analytics log cleared successfully.");
                    }}
                    className="text-[10px] text-rose-600 hover:underline font-extrabold"
                  >
                    Clear Analytics Logs
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-4 px-5">Active Source Article</th>
                        <th className="py-4 px-5 w-40">Merchant Partner</th>
                        <th className="py-4 px-5 w-28 text-right">Raw Clicks</th>
                        <th className="py-4 px-5 w-32 text-right">Conversions (2.5%)</th>
                        <th className="py-4 px-5 w-32 text-right">Commission</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
                      {analyticsClicks.map((log, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition">
                          <td className="py-4 px-5 font-bold text-slate-900">{log.postTitle}</td>
                          <td className="py-4 px-5 font-semibold text-slate-600">{log.retailer}</td>
                          <td className="py-4 px-5 text-right font-mono font-medium text-slate-900">{log.clicks.toLocaleString()}</td>
                          <td className="py-4 px-5 text-right font-mono text-slate-500">{log.conversions} conversion</td>
                          <td className="py-4 px-5 text-right font-mono font-extrabold text-emerald-700">${log.commission.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

    </div>
  );
}
