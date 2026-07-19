import React, { useState, useEffect } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../db';
import { menuData as staticMenuData } from '../common/menuData';

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

const mapIdToCategoryName = (id) => {
  const mapping = {
    "home-garden": "Home & Garden",
    "kitchen": "Kitchen",
    "electronics": "Tech",
    "health-fitness": "Health & Lifestyle",
    "baby-kid": "Baby & Kid",
    "style": "Style",
    "gifts": "Gifts",
    "pets": "Pets",
    "office": "Office",
    "sleep": "Sleep"
  };
  return mapping[id] || id;
};

export default function CategoryPage() {
  const { catId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract query filters first
  const queryParams = new URLSearchParams(location.search);
  const activeSubFilter = queryParams.get('sub');
  const activeItemFilter = queryParams.get('item');

  const [category, setCategory] = useState(() => {
    const cats = db.getCategories();
    return cats.find(c => c.id === catId) || null;
  });
  
  const [subCategories, setSubCategories] = useState(() => {
    const savedMenu = localStorage.getItem('wc_mega_menu_config');
    const menuData = savedMenu ? JSON.parse(savedMenu) : staticMenuData;
    const mappedName = mapIdToCategoryName(catId);
    const subMenuList = menuData[mappedName] || [];
    return subMenuList.map(s => s.subCategory);
  });

  const [articles, setArticles] = useState(() => {
    let categoryArticles = db.getArticles().filter(a => a.categoryId === catId);
    if (activeSubFilter) {
      return categoryArticles.filter(a => 
        a.subCategory && a.subCategory.toLowerCase() === activeSubFilter.toLowerCase()
      );
    }
    return categoryArticles;
  });

  useEffect(() => {
    const handleSync = () => {
      // 1. Find category config from db
      const cats = db.getCategories();
      const activeCat = cats.find(c => c.id === catId);
      setCategory(activeCat);

      // 2. Load dynamic subcategories from menu configuration
      const savedMenu = localStorage.getItem('wc_mega_menu_config');
      const menuData = savedMenu ? JSON.parse(savedMenu) : staticMenuData;
      const mappedName = mapIdToCategoryName(catId);
      const subMenuList = menuData[mappedName] || [];
      const subNames = subMenuList.map(s => s.subCategory);
      setSubCategories(subNames);

      // 3. Filter review articles
      let categoryArticles = db.getArticles().filter(a => a.categoryId === catId);
      
      if (activeSubFilter) {
        // Show articles matching active subcategory
        const filtered = categoryArticles.filter(a => 
          a.subCategory && a.subCategory.toLowerCase() === activeSubFilter.toLowerCase()
        );
        setArticles(filtered);
      } else {
        // By default, show all review articles belonging to the category
        setArticles(categoryArticles);
      }
    };

    handleSync();

    window.addEventListener('supabase-db-synced', handleSync);
    return () => window.removeEventListener('supabase-db-synced', handleSync);
  }, [catId, activeSubFilter, location.search]);

  if (!category) {
    return <div className="text-center py-20 font-serif">Category not found.</div>;
  }

  const pathPrefix = location.pathname.startsWith('/admin') ? '/admin' : '';

  const handleSubCategoryClick = (subName) => {
    if (activeSubFilter && activeSubFilter.toLowerCase() === subName.toLowerCase()) {
      // Toggle off if clicking the already active subcategory
      navigate(`${pathPrefix}/category/${catId}`);
    } else {
      navigate(`${pathPrefix}/category/${catId}?sub=${encodeURIComponent(subName)}`);
    }
  };

  const featuredArt = articles[0];
  const relatedArts = articles.slice(1, 4);
  const remainingArticles = articles.slice(4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-left font-sans">
      
      {/* Category Header */}
      <div className="border-t-[3px] border-slate-900 pt-6 pb-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold tracking-widest text-reviewsmart-brand uppercase">
              Category Review Feed
            </span>
            <h1 className="text-4xl font-serif font-black text-gray-900 mt-1">
              {category.name}
            </h1>
          </div>
          {activeSubFilter && (
            <Link 
              to={`${pathPrefix}/category/${catId}`}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded transition"
            >
              <span>Showing: {activeSubFilter}</span>
              <span className="font-extrabold text-[14px]">×</span>
            </Link>
          )}
        </div>
        
        {/* Render subcategories dynamically configured in admin menu */}
        <div className="mt-6">
          <span className="text-[11px] text-gray-400 font-extrabold uppercase tracking-widest block mb-2">Filter by Department:</span>
          <div className="flex flex-wrap gap-1.5">
            {subCategories.map((sub, idx) => {
              const isActive = activeSubFilter === sub;
              return (
                <button 
                  key={idx} 
                  onClick={() => handleSubCategoryClick(sub)}
                  className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition select-none ${
                    isActive 
                      ? 'bg-reviewsmart-brand text-white' 
                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {sub}
                </button>
              );
            })}
            {subCategories.length === 0 && (
              <span className="text-xs text-gray-400 italic">No subcategories defined for this category.</span>
            )}
          </div>
        </div>
      </div>

      {/* Featured Layout (Wirecutter Image 2 style) */}
      {articles.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 border-b border-gray-150 pb-12">
          {/* Left: Featured category article card (width: 3/5) */}
          <div className="lg:col-span-3 group text-left">
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
              {featuredArt.subCategory && (
                <span className="text-[10px] bg-slate-100 text-slate-600 font-black px-2 py-0.5 rounded uppercase tracking-wider mb-2 inline-block">
                  {featuredArt.subCategory}
                </span>
              )}
              <h2 className="font-serif font-black text-2xl lg:text-3xl text-gray-900 group-hover:text-reviewsmart-brand transition leading-snug">
                {featuredArt.title}
              </h2>
              <p className="text-xs lg:text-sm text-gray-600 font-serif leading-relaxed line-clamp-2">
                {featuredArt.intro || 'Read our hands-on review to find the absolute best options.'}
              </p>
              <div className="flex items-center space-x-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <span>By {featuredArt.author || 'Staff Writer'}</span>
                <span>•</span>
                <span>Updated {featuredArt.date || featuredArt.updatedAt || 'recently'}</span>
              </div>
            </Link>
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
                        {art.subCategory && (
                          <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider mb-1 inline-block">
                            {art.subCategory}
                          </span>
                        )}
                        <Link to={`/reviews/${art.slug}`}>
                          <h3 className="font-serif font-bold text-[14px] lg:text-[15px] text-gray-900 group-hover:text-reviewsmart-brand transition leading-snug line-clamp-2 mb-1">
                            {art.title}
                          </h3>
                        </Link>
                        <div className="text-[10px] text-gray-400 font-sans font-bold">
                          by {art.author || 'Staff Writer'}
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed font-serif mt-1">
                          {art.intro || 'Read our hands-on review to find the absolute best options.'}
                        </p>
                        <span className="text-[9px] text-gray-400 font-sans font-semibold mt-1 block">
                          Updated {art.date || art.updatedAt || 'recently'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-xs italic py-4">
                  No related reviews in this category.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400 font-serif bg-gray-50 border border-dashed rounded-lg">
          No articles exist under "{activeSubFilter || category.name}" yet. Add new ones in the Admin Panel!
        </div>
      )}

      {/* Remaining Articles Grid */}
      {remainingArticles.length > 0 && (
        <div className="pt-12">
          <h3 className="font-serif font-black text-2xl text-gray-900 mb-6">
            More Reviews in {category.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {remainingArticles.map(art => (
              <div key={art.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition flex flex-col justify-between group">
                <Link to={`/reviews/${art.slug}`}>
                  {getArticleImage(art) && (
                    <div className="h-48 bg-slate-100 border-b border-gray-200/60 animate-in fade-in duration-200 overflow-hidden">
                      <img 
                        src={getArticleImage(art)}
                        alt={art.title} 
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-500"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    {art.subCategory && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-black px-2 py-0.5 rounded uppercase tracking-wider mb-2 inline-block">
                        {art.subCategory}
                      </span>
                    )}
                    <h3 className="font-serif font-bold text-xl text-gray-900 leading-snug hover:text-reviewsmart-brand transition mb-2">
                      {art.title}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-4">
                      {art.intro || 'Read our hands-on review to find the absolute best options.'}
                    </p>
                  </div>
                </Link>
                <div className="px-5 pb-5 border-t border-gray-100 pt-3 flex items-center justify-between text-[11px] text-gray-400 font-medium">
                  <span>By {art.author || 'Staff Writers'}</span>
                  <span>Updated {art.date || art.updatedAt || 'today'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
