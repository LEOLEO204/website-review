import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArticleContext } from '../../context/ArticleContext';
import { menuData as staticMenuData } from './menuData';

const removeAccents = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

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
  return mapping[categoryName] || (categoryName || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
};

const renderHighlightedText = (text, query) => {
  if (!query) return <span>{text}</span>;
  
  const normalizedText = removeAccents(text.toLowerCase());
  const normalizedQuery = removeAccents(query.toLowerCase());
  
  const idx = normalizedText.indexOf(normalizedQuery);
  if (idx === -1) return <span>{text}</span>;
  
  const before = text.substring(0, idx);
  const match = text.substring(idx, idx + query.length);
  const after = text.substring(idx + query.length);
  
  return (
    <span>
      {before}
      <strong className="font-extrabold text-black">{match}</strong>
      {after}
    </span>
  );
};

export default function SearchWidget({ searchQuery, setSearchQuery }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { articles } = useContext(ArticleContext) || { articles: [] };
  
  const [isFocused, setIsFocused] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchQuery);
  
  const widgetRef = useRef(null);
  const inputRef = useRef(null);

  // Sync local query if global query is modified externally
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Reset search widget state on any page navigation
  useEffect(() => {
    setIsFocused(false);
    setLocalQuery('');
    setSearchQuery('');
  }, [location.pathname, setSearchQuery]);

  // Detect clicks outside to close suggestion panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchChange = (e) => {
    setLocalQuery(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setIsFocused(false);
      e.target.blur();
      setSearchQuery(localQuery);
      const isAdminPath = location.pathname.startsWith('/admin');
      const targetHome = isAdminPath ? '/admin' : '/';
      if (location.pathname !== targetHome) {
        navigate(targetHome);
      }
    } else if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(e.key)) {
      // Prevent browser default scrolling behavior
      e.preventDefault();
      e.stopPropagation();
    } else if ([' ', 'Home', 'End'].includes(e.key)) {
      // Stop bubbling to prevent parent components from detecting a keypress that triggers scrolling
      e.stopPropagation();
    }
  };

  const handleClear = () => {
    setLocalQuery('');
    setSearchQuery('');
    setIsFocused(false);
  };

  const handleSuggestionClick = (suggestion) => {
    setIsFocused(false);
    setLocalQuery(suggestion.text);
    setSearchQuery(suggestion.text);
  };

  // Generate suggestions using localQuery instead of global searchQuery
  const normalizedQuery = removeAccents(localQuery.toLowerCase().trim());
  const suggestions = [];

  const pathPrefix = location.pathname.startsWith('/admin') ? '/admin' : '';

  if (normalizedQuery.length >= 2) {
    const rawSuggestions = [];

    // 1. Match subcategories from menu configuration
    const savedMenu = localStorage.getItem('wc_mega_menu_config');
    const menuData = savedMenu ? JSON.parse(savedMenu) : staticMenuData;
    
    const matchedSubs = new Set();
    Object.keys(menuData).forEach(catName => {
      const subList = menuData[catName] || [];
      subList.forEach(item => {
        const subName = item.subCategory;
        if (subName && removeAccents(subName.toLowerCase()).includes(normalizedQuery)) {
          matchedSubs.add(JSON.stringify({
            text: subName,
            category: catName
          }));
        }
      });
    });

    Array.from(matchedSubs).forEach(itemStr => {
      const item = JSON.parse(itemStr);
      const categoryId = mapCategoryToId(item.category);
      rawSuggestions.push({
        type: 'subcategory',
        text: item.text,
        url: `${pathPrefix}/category/${categoryId}?sub=${encodeURIComponent(item.text)}`
      });
    });

    // 2. Match article titles from context
    articles.forEach(art => {
      if (removeAccents(art.title.toLowerCase()).includes(normalizedQuery)) {
        rawSuggestions.push({
          type: 'article',
          text: art.title,
          url: `${pathPrefix}/reviews/${art.slug}`
        });
      }
    });

    // Sort by relevance
    const getRelevanceScore = (text) => {
      const normalizedText = removeAccents(text.toLowerCase());
      const index = normalizedText.indexOf(normalizedQuery);
      if (index === 0) return 1000 - text.length;
      if (index > 0) return 500 - index - text.length;
      return 0;
    };

    rawSuggestions.sort((a, b) => getRelevanceScore(b.text) - getRelevanceScore(a.text));
    suggestions.push(...rawSuggestions.slice(0, 5));
  }

  return (
    <div ref={widgetRef} className="relative w-full z-50">
      
      {/* Search Input field */}
      <div className="relative z-50">
        <input
          ref={inputRef}
          type="text"
          value={localQuery}
          onChange={handleSearchChange}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search articles..."
          className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#da3723] focus:border-[#da3723] transition font-sans bg-white relative z-50"
        />
        <span className="absolute left-3 top-3 text-gray-400 z-50">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        {localQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 font-semibold text-sm cursor-pointer z-50"
          >
            ✕
          </button>
        )}
      </div>

      {/* Live Autocomplete Suggestions Dropdown (Compact floating card aligning exactly below input) */}
      {isFocused && normalizedQuery.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-2 max-h-[350px] overflow-y-auto">
          <div className="px-3 divide-y divide-slate-100">
            {suggestions.length > 0 ? (
              suggestions.map((suggestion, idx) => (
                <Link
                  key={idx}
                  to={suggestion.url}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="block py-2 hover:bg-slate-50 transition duration-150 text-slate-800 text-[13px] font-normal border-b border-slate-100/60 last:border-b-0"
                >
                  <div className="truncate text-left">
                    {renderHighlightedText(suggestion.text, localQuery)}
                  </div>
                </Link>
              ))
            ) : (
              <div className="py-3 text-center text-slate-400 text-xs">
                No suggestions found for "{localQuery}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
