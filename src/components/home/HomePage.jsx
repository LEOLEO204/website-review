import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../db';
import { secureStorage } from '../../utils/security';

const removeAccents = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

const highlightText = (text, query) => {
  return text;
};

// Helper to get matching beautiful image for a category

const isValidImageUrl = (url) => {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  return trimmed.startsWith('http://') || 
         trimmed.startsWith('https://') || 
         trimmed.startsWith('/') || 
         trimmed.startsWith('data:image/');
};

const getArticleImage = (art) => {
  if (!art) return "";
  if (art.image && isValidImageUrl(art.image)) {
    return art.image.trim();
  }
  
  const categoryImages = {
    'electronics': 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&q=80&w=600',
    'sleep': 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=600',
    'kitchen': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=600',
    'home-garden': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600',
    'outdoors': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=600',
    'gifts': 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=600',
    'style': 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=600',
    'baby-kid': 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=600',
    'pets': 'https://images.unsplash.com/photo-1444212477490-ca407925329e?auto=format&fit=crop&q=80&w=600',
    'games-hobbies': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=600',
    'office': 'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&q=80&w=600',
    'money': 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=600',
    'apparel': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=600'
  };

  const catKey = (art.categoryId || art.category || '').toLowerCase().trim();
  
  if (catKey.includes('tech') || catKey.includes('electronic')) {
    return categoryImages['electronics'];
  }
  if (catKey.includes('home') || catKey.includes('garden') || catKey.includes('bathroom') || catKey.includes('clean') || catKey.includes('laundry')) {
    return categoryImages['home-garden'];
  }
  if (catKey.includes('nursing') || catKey.includes('baby') || catKey.includes('kid') || catKey.includes('child')) {
    return categoryImages['baby-kid'];
  }

  for (const key in categoryImages) {
    if (catKey.includes(key) || key.includes(catKey)) {
      return categoryImages[key];
    }
  }

  return 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=600';
};

// ----------------------------------------------------
// PAGE: HOMEPAGE COMPONENT
// ----------------------------------------------------

export default function HomePage({ triggerAffiliate, searchQuery }) {
  const [articles, setArticles] = useState(() => {
    const rawArticles = db.getArticles();
    let sortedArticles = Array.isArray(rawArticles) ? [...rawArticles] : [];
    sortedArticles.sort((a, b) => {
      const dateA = new Date(a.date || a.updatedAt || 0);
      const dateB = new Date(b.date || b.updatedAt || 0);
      return dateB - dateA;
    });
    return sortedArticles;
  });

  const [deals, setDeals] = useState(() => {
    const rawDeals = db.getDeals();
    return Array.isArray(rawDeals) ? rawDeals.filter(d => d.active) : [];
  });

  const [products, setProducts] = useState(() => {
    const rawProducts = db.getProducts();
    return Array.isArray(rawProducts) ? rawProducts : [];
  });

  const [categories, setCategories] = useState(() => {
    const rawCategories = db.getCategories();
    const menuKeys = ['home-garden', 'kitchen', 'health-fitness', 'electronics', 'baby-kid', 'style', 'gifts'];
    const filtered = (Array.isArray(rawCategories) ? rawCategories : [])
      .filter(cat => menuKeys.includes(cat.id));
    const orderMap = {
      'home-garden': 1,
      'kitchen': 2,
      'health-fitness': 3,
      'electronics': 4,
      'baby-kid': 5,
      'style': 6,
      'gifts': 7
    };
    filtered.sort((a, b) => (orderMap[a.id] || 99) - (orderMap[b.id] || 99));
    return filtered;
  });

  useEffect(() => {
    const handleSync = () => {
      // Re-sync states when sync/change happens
      const rawArticles = db.getArticles();
      let sortedArticles = Array.isArray(rawArticles) ? [...rawArticles] : [];
      sortedArticles.sort((a, b) => {
        const dateA = new Date(a.date || a.updatedAt || 0);
        const dateB = new Date(b.date || b.updatedAt || 0);
        return dateB - dateA;
      });
      setArticles(sortedArticles);

      const rawDeals = db.getDeals();
      setDeals(Array.isArray(rawDeals) ? rawDeals.filter(d => d.active) : []);

      const rawProducts = db.getProducts();
      setProducts(Array.isArray(rawProducts) ? rawProducts : []);

      const rawCategories = db.getCategories();
      const menuKeys = ['home-garden', 'kitchen', 'health-fitness', 'electronics', 'baby-kid', 'style', 'gifts'];
      const filteredCategories = (Array.isArray(rawCategories) ? rawCategories : [])
        .filter(cat => menuKeys.includes(cat.id));
      const orderMap = {
        'home-garden': 1,
        'kitchen': 2,
        'health-fitness': 3,
        'electronics': 4,
        'baby-kid': 5,
        'style': 6,
        'gifts': 7
      };
      filteredCategories.sort((a, b) => (orderMap[a.id] || 99) - (orderMap[b.id] || 99));
      setCategories(filteredCategories);
    };

    handleSync();

    window.addEventListener('supabase-db-synced', handleSync);
    return () => window.removeEventListener('supabase-db-synced', handleSync);
  }, []);

  const filteredArticles = searchQuery
    ? articles.filter(art => {
        const normalizedQuery = removeAccents(searchQuery.toLowerCase()).trim();
        if (!normalizedQuery) return true;
        const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

        const titleNorm = removeAccents((art.title || '').toLowerCase());
        const introNorm = removeAccents((art.intro || '').toLowerCase());
        const categoryNameNorm = removeAccents((art.categoryId || '').toLowerCase());
        const categoryDisplayNorm = removeAccents((art.category || '').toLowerCase());
        const subCategoryNorm = removeAccents((art.subCategory || '').toLowerCase());

        return queryTokens.every(token => {
          return titleNorm.includes(token) || 
                 introNorm.includes(token) || 
                 categoryNameNorm.includes(token) || 
                 categoryDisplayNorm.includes(token) || 
                 subCategoryNorm.includes(token);
        });
      })
    : articles;

  // Extract sections
  const pinnedSpotlight = filteredArticles.find(a => a.isSpotlight);
  const heroSpotlight = pinnedSpotlight || filteredArticles[0];
  const displayHeroSpotlight = heroSpotlight;

  // Load customized homepage configuration
  const getHomepageConfig = () => {
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
    let config = { latestArticleIds: [], dailyDeals: [] };
    if (stored) {
      config = stored;
    }
    
    // Find left column articles
    let latestArticles = [];
    if (config.latestArticleIds && config.latestArticleIds.length > 0) {
      latestArticles = config.latestArticleIds
        .map(id => articles.find(a => a.id === id))
        .filter(Boolean);
    }
    // Fallback if less than 5
    if (latestArticles.length < 5) {
      const needed = 5 - latestArticles.length;
      const unused = articles.filter(a => !latestArticles.some(x => x.id === a.id) && a.id !== displayHeroSpotlight?.id);
      latestArticles = [...latestArticles, ...unused.slice(0, needed)].slice(0, 5);
    }

    // Find right column daily deals products
    let dailyDealsProducts = [];
    if (config.dailyDeals && Array.isArray(config.dailyDeals)) {
      dailyDealsProducts = config.dailyDeals.map(d => ({
        id: `deal-${d.name}`,
        name: d.name || '',
        merchant: d.merchant || 'Amazon',
        price: d.price || '',
        dealPrice: d.dealPrice || '',
        discount: d.discount || '',
        buyUrl: d.buyUrl || '',
        imageUrl: d.imageUrl || ''
      }));
    } else if (config.dailyDealsProductIds && config.dailyDealsProductIds.length > 0) {
      dailyDealsProducts = config.dailyDealsProductIds
        .map(id => {
          const p = products.find(prod => prod.id === id);
          return {
            id: id,
            name: p ? p.name : '',
            merchant: p ? p.merchant : 'Amazon',
            price: p ? p.price || p.basePrice || '' : '',
            dealPrice: p ? p.dealPrice || p.price || p.basePrice || '' : '',
            discount: p ? p.discount || '' : '',
            buyUrl: p ? p.buyUrl || (p.affiliateLinks && p.affiliateLinks[0]?.link) || '' : '',
            imageUrl: p ? p.imageUrl || p.image || '' : ''
          };
        })
        .filter(Boolean);
    }

    // Fallback if less than 3
    if (dailyDealsProducts.length < 3) {
      const needed = 3 - dailyDealsProducts.length;
      const unused = products
        .filter(p => !dailyDealsProducts.some(x => x.name === p.name))
        .slice(0, needed)
        .map(p => ({
          id: p.id,
          name: p.name || '',
          merchant: p.merchant || 'Amazon',
          price: p.price || p.basePrice || '',
          dealPrice: p.dealPrice || p.price || p.basePrice || '',
          discount: p.discount || '',
          buyUrl: p.buyUrl || (p.affiliateLinks && p.affiliateLinks[0]?.link) || '',
          imageUrl: p.imageUrl || p.image || ''
        }));
      dailyDealsProducts = [...dailyDealsProducts, ...unused].slice(0, 3);
    }

    return { latestArticles, dailyDealsProducts };
  };

  const { latestArticles: leftArticles, dailyDealsProducts: rightProducts } = getHomepageConfig();

  if (articles.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center font-sans">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/60 rounded-3xl p-10 md:p-16 shadow-xl relative overflow-hidden text-left">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#da3723] via-indigo-600 to-emerald-500"></div>
          
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-md text-slate-800 mb-8 border border-slate-100">
            <svg className="w-8 h-8 text-[#da3723]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
                     <h2 className="text-3xl font-serif font-black text-slate-900 mb-4 leading-tight">
            Welcome to ReviewSmart!
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed max-w-xl mb-8 font-serif">
            No review articles found in the database. Please visit the secure CMS dashboard to write your first post, or generate sample posts below to experience the system.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Link 
              to="/admin" 
              className="inline-flex items-center justify-center px-6 py-3 text-xs font-bold uppercase tracking-wider rounded-xl text-white bg-slate-900 hover:bg-slate-800 transition duration-150 shadow-md w-full sm:w-auto cursor-pointer"
            >
              ⚙ Access CMS Portal
            </Link>
            <button 
              onClick={() => {
                const sample = {
                  id: `POST-${Date.now().toString().slice(-4)}`,
                  slug: 'best-basic-home-toolkit',
                  title: 'The Best Basic Home Toolkit of 2026',
                  category: 'Home & Garden',
                  subCategory: 'Bathroom',
                  status: 'Published',
                  date: new Date().toISOString().split('T')[0],
                  author: 'Hai Xuyen',
                  authorRole: 'Senior Editor',
                  intro: 'After testing over 20 different tool kits, we found that the basic home kit is the best for general household repairs and DIY projects.',
                  clicks: 120,
                  blocks: [
                    {
                      id: `block-${Date.now()}`,
                      type: 'text',
                      value: '## Why you should trust us\n\nAt ReviewSmart, our reviews are fully independent and based on hours of testing.'
                    }
                  ]
                };
                db.saveArticle(sample);
                window.location.reload();
              }}
              className="inline-flex items-center justify-center px-6 py-3 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition duration-150 shadow-sm w-full sm:w-auto cursor-pointer font-sans"
            >
              ✨ Generate Sample Posts
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {searchQuery && (
        <div className="border-b border-reviewsmart-border pb-5 mb-8 text-left">
          <h2 className="text-2xl font-serif font-bold text-slate-900">
            Search results for: <span className="text-reviewsmart-brand">"{searchQuery}"</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-sans">
            Found <strong className="text-slate-800">{filteredArticles.length}</strong> matching reviews.
          </p>
        </div>
      )}

      {/* Main Hero, Latest, and Deals Grid (Restructured to 3-Column Layout) */}
      {!searchQuery ? (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-b border-reviewsmart-border pb-10">
          
          {/* Column 1: Left - "The latest" (width: 3/12 on large screens) */}
          <div className="lg:col-span-3 lg:border-r lg:border-reviewsmart-border lg:pr-6 space-y-6 text-left order-2 lg:order-1">
            <h3 className="text-xl font-serif font-black text-slate-900 border-b-2 border-slate-900 pb-2 mb-4 uppercase tracking-tight">
              The latest
            </h3>
            <div className="divide-y divide-slate-100 space-y-4">
              {leftArticles.map((art, idx) => (
                <div key={art.id} className={`pt-4 ${idx === 0 ? 'pt-0' : ''}`}>
                  <Link to={`/reviews/${art.slug}`} className="group block">
                    <h4 className="font-serif font-bold text-slate-900 group-hover:text-reviewsmart-brand transition duration-150 text-[15px] leading-snug">
                      {art.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-sans mt-1.5 font-semibold block">
                      {art.date}
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Middle - Spotlight (width: 6/12 on large screens) */}
          <div className="lg:col-span-6 lg:border-r lg:border-reviewsmart-border lg:px-4 text-left flex flex-col justify-between space-y-6 order-1 lg:order-2">
            {displayHeroSpotlight && (
              <div className="group">
                <Link to={`/reviews/${displayHeroSpotlight.slug}`} className="block">
                  {getArticleImage(displayHeroSpotlight) && (
                    <div className="bg-slate-100 w-full aspect-[16/10] rounded-lg border border-slate-100/60 overflow-hidden relative mb-4 animate-in fade-in duration-200">
                      <img 
                        src={getArticleImage(displayHeroSpotlight)}
                        alt={displayHeroSpotlight.title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-500"
                      />
                    </div>
                  )}
                  <h2 className="text-2xl lg:text-3xl font-serif font-black text-gray-900 leading-tight group-hover:text-reviewsmart-brand transition mb-3">
                    {displayHeroSpotlight.title}
                  </h2>
                  <p className="text-xs text-gray-600 font-serif leading-relaxed line-clamp-3 mb-3">
                    {displayHeroSpotlight.intro}
                  </p>
                </Link>
                <div className="flex items-center space-x-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <span>By {displayHeroSpotlight.author}</span>
                  <span>•</span>
                  <span>{displayHeroSpotlight.date}</span>
                </div>
              </div>
            )}
          </div>

          {/* Column 3: Right - "Daily deals" (width: 3/12 on large screens) */}
          <div className="lg:col-span-3 space-y-6 text-left order-3">
            <div>
              <h3 className="text-xl font-serif font-black text-slate-900 border-b-2 border-slate-900 pb-2 uppercase tracking-tight">
                Daily deals
              </h3>
              <p className="text-[11px] text-slate-500 font-sans mt-2 font-medium">
                Price drops on products we already love
              </p>
            </div>
            <div className="divide-y divide-slate-100 space-y-5">
              {rightProducts.map((prod, idx) => {
                const dealPrice = prod.dealPrice || prod.price;
                const hasOriginalPrice = prod.price && prod.dealPrice && prod.price !== prod.dealPrice;
                
                return (
                  <div key={prod.id} className={`pt-5 flex flex-col ${idx === 0 ? 'pt-0' : ''}`}>
                    {/* Image */}
                    {prod.imageUrl && (
                      <div className="bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center h-12 w-[120px] overflow-hidden mb-2">
                        <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    
                    {/* Title / Link */}
                    <a
                      href={prod.buyUrl || prod.link || "#"}
                      onClick={(e) => triggerAffiliate(prod.merchant, prod.buyUrl || prod.link, e)}
                      className="font-sans font-extrabold text-[12px] text-slate-800 hover:text-reviewsmart-brand hover:underline leading-snug cursor-pointer transition mb-1"
                    >
                      {prod.name}
                    </a>

                    {/* Price Details */}
                    <div className="flex items-baseline flex-wrap gap-1 mt-0.5">
                      <span className="text-slate-900 font-black text-[11px]">
                        {dealPrice}
                      </span>
                      {hasOriginalPrice && (
                        <span className="line-through text-slate-400 text-[9px] font-medium ml-1">
                          {prod.price}
                        </span>
                      )}
                      <span className="text-slate-500 font-semibold text-[9px] ml-1">
                        from {prod.merchant}
                      </span>
                    </div>

                    {/* Discount Badge */}
                    {prod.discount && prod.discount.toLowerCase().trim() !== 'giảm giá' && prod.discount.toLowerCase().trim() !== 'giam gia' && prod.discount.replace(/giảm giá/gi, '').replace(/giam gia/gi, '').trim() !== '' && (
                      <span className="text-[9px] font-bold text-[#da3723] mt-1 block">
                        {prod.discount.replace(/giảm giá/gi, '').replace(/giam gia/gi, '').trim()}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </section>
      ) : (
        // Search results page layout
        <section className="text-left border-b border-reviewsmart-border pb-10">
          <h2 className="text-2xl font-serif font-black text-gray-900 mb-6">
            Search Results ({filteredArticles.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map(art => (
              <div key={art.id} className="bg-white border border-gray-200 rounded overflow-hidden flex flex-col justify-between hover:shadow-md transition group">
                <Link to={`/reviews/${art.slug}`}>
                  {getArticleImage(art) && (
                    <div className="aspect-[16/9] bg-slate-100 flex items-center justify-center overflow-hidden border-b border-gray-150 animate-in fade-in duration-200">
                      <img src={getArticleImage(art)} alt={art.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-500" />
                    </div>
                  )}
                  <div className="p-4">
                    <span className="text-[10px] font-sans font-bold text-reviewsmart-brand uppercase tracking-wider block mb-1">
                      {categories.find(c => c.id === art.categoryId)?.name || 'Review'}
                    </span>
                    <h3 className="font-serif font-bold text-lg text-gray-900 leading-snug mb-2 hover:text-reviewsmart-brand transition">
                      {highlightText(art.title, searchQuery)}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {highlightText(art.intro, searchQuery)}
                    </p>
                  </div>
                </Link>
                <div className="p-4 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-semibold">
                  <span>By {art.author}</span>
                  <span>{art.updatedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}


      {/* Grid: Browse categories in detail (Detailed editorial content-grids for Home, Kitchen, Electronics, etc.) */}
      <section className="text-left space-y-8">
        <div>
          <h3 className="font-serif font-black text-3xl text-gray-900">
            Browse Our Vetted Reviews By Department
          </h3>
          <p className="text-xs text-gray-500 font-sans mt-1">
            Read comprehensive, pixel-perfect reviews written and verified by our professional writers.
          </p>
        </div>

        <div className="flex flex-col gap-16">
          {categories.map(cat => {
            // Find articles under this category
            const catArticles = articles.filter(a => a.categoryId === cat.id);
            // Featured category article (e.g. first one / newest)
            const featuredArt = catArticles[0];
            const relatedArts = catArticles.slice(1, 4);

            // Get subcategories that have active articles
            const activeSubs = [];
            catArticles.forEach(a => {
              if (a.subCategory && !activeSubs.includes(a.subCategory)) {
                activeSubs.push(a.subCategory);
              }
            });

            // Fill remaining slots with default subcategories from the config
            const displaySubs = [...activeSubs];
            if (cat.subcategories && Array.isArray(cat.subcategories)) {
              cat.subcategories.forEach(sub => {
                if (displaySubs.length < 3 && !displaySubs.some(s => s.toLowerCase() === sub.toLowerCase())) {
                  displaySubs.push(sub);
                }
              });
            }
            const finalSubs = displaySubs.slice(0, 3);

            return (
              <div 
                key={cat.id} 
                className="bg-white border-t-[3px] border-slate-900 pt-6 flex flex-col justify-between space-y-6"
              >
                {/* Header */}
                <div>
                  <div className="flex flex-wrap items-baseline justify-between pb-3 gap-2">
                    <div className="flex items-baseline space-x-1 select-none">
                      <h4 className="font-serif font-black text-2xl lg:text-3xl text-gray-900">
                        {cat.name}
                      </h4>
                    </div>
                    
                    {/* Subcategory Comma-separated links */}
                    <div className="text-xs text-[#5a5a5a] font-sans flex flex-wrap gap-x-1 items-center">
                      {finalSubs.map((sub, idx) => {
                        let matchArt = articles.find(a => 
                          a.categoryId === cat.id && 
                          a.subCategory && 
                          a.subCategory.toLowerCase() === sub.toLowerCase()
                        );
                        const targetUrl = matchArt 
                          ? `/reviews/${matchArt.slug}` 
                          : `/reviews/best-${sub.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                        return (
                          <React.Fragment key={idx}>
                            <Link 
                              to={targetUrl}
                              className="hover:text-reviewsmart-brand hover:underline font-bold text-gray-700"
                            >
                              {sub}
                            </Link>
                            {idx < finalSubs.length - 1 ? <span className="text-gray-400 mr-1.5">,</span> : null}
                          </React.Fragment>
                        );
                      })}
                      {finalSubs.length > 0 && <span className="text-gray-400 mr-1.5">, or</span>}
                      <Link 
                        to={`/category/${cat.id}`}
                        className="hover:text-reviewsmart-brand hover:underline font-bold text-reviewsmart-brand"
                      >
                        see all in {cat.name}
                      </Link>
                    </div>
                  </div>

                  {/* Main Grid: Left featured article, Right related links */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-6">
                    {/* Left: Featured category article card (width: 3/5) */}
                    <div className="lg:col-span-3 group text-left">
                      {featuredArt ? (
                        <Link to={`/reviews/${featuredArt.slug}`} className="block space-y-3">
                          {getArticleImage(featuredArt) && (
                            <div className="bg-slate-100 aspect-[16/10] rounded-lg overflow-hidden flex items-center justify-center border border-slate-100/60 animate-in fade-in duration-200">
                              <img 
                                src={getArticleImage(featuredArt)} 
                                alt={featuredArt.title} 
                                className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-500" 
                              />
                            </div>
                          )}
                          <h5 className="font-serif font-black text-xl lg:text-2xl text-gray-900 group-hover:text-reviewsmart-brand transition leading-snug line-clamp-2">
                            {featuredArt.title}
                          </h5>
                          <p className="text-xs lg:text-sm text-gray-600 font-serif leading-relaxed line-clamp-2">
                            {featuredArt.intro}
                          </p>
                          <div className="flex items-center space-x-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            <span>By {featuredArt.author || 'Staff Writer'}</span>
                            {featuredArt.date && (
                              <>
                                <span>•</span>
                                <span>{featuredArt.date}</span>
                              </>
                            )}
                          </div>
                        </Link>
                      ) : (
                        <div className="text-gray-400 text-xs italic py-10 bg-gray-50 rounded text-center">
                          No reviews pre-seeded in this category yet.
                        </div>
                      )}
                    </div>

                    {/* Right: Related review lists (width: 2/5) */}
                    <div className="lg:col-span-2 flex flex-col justify-between">
                      <div className="space-y-6">
                        {relatedArts.length > 0 ? (
                          <div className="flex flex-col gap-6">
                            {relatedArts.map(art => (
                              <div key={art.id} className="group flex gap-4 items-start">
                                <Link to={`/reviews/${art.slug}`} className="w-1/3 aspect-[4/3] bg-slate-100 border border-slate-100/60 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                                  <img 
                                    src={getArticleImage(art)} 
                                    alt={art.title} 
                                    className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-300" 
                                  />
                                </Link>
                                <div className="w-2/3 text-left">
                                  <Link to={`/reviews/${art.slug}`}>
                                    <h6 className="font-serif font-bold text-[14px] lg:text-[15px] text-gray-900 group-hover:text-reviewsmart-brand transition leading-snug line-clamp-2 mb-1">
                                      {art.title}
                                    </h6>
                                  </Link>
                                  <div className="text-[10px] text-gray-400 font-sans font-bold">
                                    by {art.author || 'Staff Writer'}
                                  </div>
                                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed font-serif mt-1">
                                    {art.intro || 'Read our hands-on review to find the absolute best options for your home and lifestyle.'}
                                  </p>
                                  <span className="text-[9px] text-gray-400 font-sans font-semibold mt-1 block">
                                    {art.date || 'Updated recently'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-400 text-xs italic py-4">
                            No related reviews.
                          </div>
                        )}
                      </div>

                      <div className="pt-4 h-4"></div>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}

// ----------------------------------------------------
// PAGE: CATEGORY LIST PAGE COMPONENT
// ----------------------------------------------------
