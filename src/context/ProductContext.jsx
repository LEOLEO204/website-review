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

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState(() => {
    try {
      return db.getProducts() || [];
    } catch (e) {
      console.error("Error loading products from DB:", e);
      return [];
    }
  });

  useEffect(() => {
    const handleSync = () => {
      try {
        const dbProducts = db.getProducts() || [];
        setProducts(dbProducts);
      } catch (e) {
        console.error("Sync reload error in ProductContext:", e);
      }
    };
    window.addEventListener('supabase-db-synced', handleSync);
    return () => window.removeEventListener('supabase-db-synced', handleSync);
  }, []);

  useEffect(() => {
    localStorage.setItem('review_products', JSON.stringify(products));
    localStorage.setItem('wc_products', JSON.stringify(products));
    db.invalidateCache();
    
    // Synchronize to VPS database
    syncArrayToSupabase('wc_products', products);
  }, [products]);

  const addProduct = (product) => {
    setProducts(prev => [...prev, product]);
  };

  const updateProduct = (updatedProduct) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <ProductContext.Provider value={{ products, addProduct, updateProduct, deleteProduct, setProducts }}>
      {children}
    </ProductContext.Provider>
  );
};
