import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { menuData as staticMenuData } from './menuData';
import { db } from '../../db';

export default function MegaMenu() {
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [activeSubCategory, setActiveSubCategory] = useState('');

  const menuData = useMemo(() => {
    try {
      const savedMenu = localStorage.getItem('wc_mega_menu_config');
      return savedMenu ? JSON.parse(savedMenu) : staticMenuData;
    } catch(e) {
      return staticMenuData;
    }
  }, []);

  const [articles, setArticles] = useState([]);

  useEffect(() => {
    const handleSync = () => {
      setArticles(db.getArticles() || []);
    };
    handleSync();
    window.addEventListener('supabase-db-synced', handleSync);
    return () => window.removeEventListener('supabase-db-synced', handleSync);
  }, []);

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
      "Sleep": "sleep"
    };
    return mapping[categoryName] || categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  };

  const categories = [
    { label: 'Home & Garden', key: 'Home & Garden', path: '/category/home-garden' },
    { label: 'Kitchen', key: 'Kitchen', path: '/category/kitchen' },
    { label: 'Health & Lifestyle', key: 'Health & Lifestyle', path: '/category/health-fitness' },
    { label: 'Tech', key: 'Tech', path: '/category/electronics' },
    { label: 'Baby & Kid', key: 'Baby & Kid', path: '/category/baby-kid' },
    { label: 'Style', key: 'Style', path: '/category/style' },
    { label: 'Gifts', key: 'Gifts', path: '/category/gifts' }
  ];

  const handleMouseEnterCategory = (catKey) => {
    const data = menuData[catKey];
    if (data && data.length > 0) {
      setHoveredCategory(catKey);
      setActiveSubCategory(data[0].subCategory);
    } else {
      setHoveredCategory(null);
      setActiveSubCategory('');
    }
  };

  const currentSubCats = hoveredCategory ? menuData[hoveredCategory] : [];
  const activeSubData = currentSubCats.find(s => s.subCategory === activeSubCategory);

  return (
    <nav 
      className="bg-white border-t border-reviewsmart-border hidden sm:block relative text-left font-sans"
      onMouseLeave={() => setHoveredCategory(null)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ul className="flex items-center justify-between py-3 text-[13px] font-bold text-black w-full tracking-wide">
          {categories.map(cat => {
            const isHovered = hoveredCategory === cat.key;
            return (
              <li 
                key={cat.key} 
                className={`transition-all duration-150 relative py-1 hover:text-reviewsmart-brand cursor-pointer select-none border-b-2 ${
                  isHovered ? 'text-reviewsmart-brand border-black' : 'border-transparent'
                }`}
                onMouseEnter={() => handleMouseEnterCategory(cat.key)}
              >
                <Link 
                  to={cat.path} 
                  className="flex items-center py-0.5 select-none hover:text-reviewsmart-brand transition duration-150"
                  onClick={() => setHoveredCategory(null)}
                >
                  {cat.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Floating Subcategories Mega Menu Dropdown */}
      {hoveredCategory && currentSubCats.length > 0 && (
        <div 
          className="absolute top-full left-0 w-full bg-white border-b border-reviewsmart-border shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150 py-6 text-left"
          onMouseEnter={() => setHoveredCategory(hoveredCategory)}
          onMouseLeave={() => setHoveredCategory(null)}
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {currentSubCats.map(sub => {
                const catId = mapCategoryToId(hoveredCategory);
                
                // Try to find matching review article in cache
                let matchArt = articles.find(a => 
                  a.categoryId === catId && 
                  a.subCategory && 
                  a.subCategory.toLowerCase() === sub.subCategory.toLowerCase()
                );
                
                const targetUrl = matchArt 
                  ? `/reviews/${matchArt.slug}` 
                  : `/reviews/best-${sub.subCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

                return (
                  <Link
                    key={sub.subCategory}
                    to={targetUrl}
                    onClick={() => setHoveredCategory(null)}
                    className="flex flex-col p-3.5 rounded-lg hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition duration-150 group select-none shadow-sm"
                  >
                    <span className="text-[12px] font-extrabold text-slate-800 group-hover:text-reviewsmart-brand transition duration-150 leading-tight">
                      {sub.subCategory}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 group-hover:text-slate-600 transition">
                      View Reviews →
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
