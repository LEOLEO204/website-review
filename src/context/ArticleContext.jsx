import React, { createContext, useState, useEffect } from 'react';
import { secureStorage } from '../utils/security';
import { db } from '../db';
import { syncArrayToSupabase } from '../utils/supabase';

const localStorage = {
  getItem(key) {
    const val = secureStorage.getItem(key);
    return val ? JSON.stringify(val) : null;
  },
  setItem(key, value) {
    try {
      const parsed = JSON.parse(value);
      secureStorage.setItem(key, parsed);
    } catch(e) {
      secureStorage.setItem(key, value);
    }
  },
  removeItem(key) {
    secureStorage.removeItem(key);
  }
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

export const ArticleContext = createContext();

export const ArticleProvider = ({ children }) => {
  const [articles, setArticles] = useState(() => {
    try {
      const dbArticles = db.getArticles() || [];
      return dbArticles.map(art => {
        if (!art.categoryId && art.category) {
          return { ...art, categoryId: mapCategoryToId(art.category) };
        }
        return art;
      });
    } catch (e) {
      console.error("Error loading articles from DB:", e);
      return [];
    }
  });

  useEffect(() => {
    const handleSync = (e) => {
      if (e?.detail?.isLocalUpdate) return;
      try {
        const dbArticles = db.getArticles() || [];
        setArticles(dbArticles.map(art => {
          if (!art.categoryId && art.category) {
            return { ...art, categoryId: mapCategoryToId(art.category) };
          }
          return art;
        }));
      } catch (e) {
        console.error("Sync reload error in ArticleContext:", e);
      }
    };
    window.addEventListener('supabase-db-synced', handleSync);
    return () => window.removeEventListener('supabase-db-synced', handleSync);
  }, []);

  useEffect(() => {
    localStorage.setItem('review_articles', JSON.stringify(articles));
    localStorage.setItem('wc_articles', JSON.stringify(articles));
    db.invalidateCache(); // Ensure db caches are cleared when articles update
    
    // Synchronize to VPS database
    syncArrayToSupabase('wc_articles', articles);
    
    // Dispatch sync event with local update flag so other components reload,
    // but ArticleContext's listener ignores it to prevent loops.
    window.dispatchEvent(new CustomEvent('supabase-db-synced', { detail: { isLocalUpdate: true } }));
  }, [articles]);

  const generateSlug = (title) => {
    return (title || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const addArticle = (article) => {
    setArticles(prev => {
      const categoryId = mapCategoryToId(article.category);
      const slug = generateSlug(article.title);
      let next = [...prev];
      if (article.isSpotlight) {
        next = next.map(a => ({ ...a, isSpotlight: false }));
      }
      next.push({ ...article, categoryId, slug, createdAt: article.createdAt || Date.now() });
      next.sort((a, b) => {
        const dateCompare = (b.date || '').localeCompare(a.date || '');
        if (dateCompare !== 0) return dateCompare;
        return (a.createdAt || 0) - (b.createdAt || 0);
      });
      const filtered = next.filter(art => (art.title || '').trim().toLowerCase() !== 'website');
      
      // Sync writes to storage and db
      localStorage.setItem('review_articles', JSON.stringify(filtered));
      localStorage.setItem('wc_articles', JSON.stringify(filtered));
      db.invalidateCache();
      
      return filtered;
    });
  };

  const updateArticle = (updatedArticle) => {
    setArticles(prev => {
      const categoryId = mapCategoryToId(updatedArticle.category);
      const slug = generateSlug(updatedArticle.title);
      let next = [...prev];
      if (updatedArticle.isSpotlight) {
        next = next.map(a => a.id === updatedArticle.id ? a : { ...a, isSpotlight: false });
      }
      next = next.map(a => a.id === updatedArticle.id ? { ...updatedArticle, categoryId, slug } : a);
      next.sort((a, b) => {
        const dateCompare = (b.date || '').localeCompare(a.date || '');
        if (dateCompare !== 0) return dateCompare;
        return (a.createdAt || 0) - (b.createdAt || 0);
      });
      const filtered = next.filter(art => (art.title || '').trim().toLowerCase() !== 'website');

      // Sync writes to storage and db
      localStorage.setItem('review_articles', JSON.stringify(filtered));
      localStorage.setItem('wc_articles', JSON.stringify(filtered));
      db.invalidateCache();

      return filtered;
    });
  };

  const deleteArticle = (id) => {
    setArticles(prev => {
      const filtered = prev.filter(a => a.id !== id);
      
      // Sync writes to storage and db
      localStorage.setItem('review_articles', JSON.stringify(filtered));
      localStorage.setItem('wc_articles', JSON.stringify(filtered));
      db.invalidateCache();
      
      return filtered;
    });
  };

  const incrementArticleClicks = (id) => {
    setArticles(prev => {
      return prev.map(art => {
        if (art.id === id) {
          return { ...art, clicks: (art.clicks || 0) + 1 };
        }
        return art;
      });
    });
  };

  return (
    <ArticleContext.Provider value={{ articles, addArticle, updateArticle, deleteArticle, incrementArticleClicks, setArticles }}>
      {children}
    </ArticleContext.Provider>
  );
};
