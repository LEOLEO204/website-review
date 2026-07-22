import CryptoJS from 'crypto-js';
import { syncArrayToSupabase, syncConfigToSupabase } from './supabase';

const SECRET_KEY = 'ReviewSmartSystemCISOKey2026_BankGrade';

// In-memory cache to store decrypted values, preventing redundant AES-256 cycles.
const decryptionCache = {};

// Helper to remove heavy base64 images from LocalStorage when quota is exceeded
const compactStorageValue = (value) => {
  if (!value) return value;
  try {
    const serialized = JSON.stringify(value);
    if (serialized.length < 50000) return value;

    const deepCompact = (obj) => {
      if (typeof obj === 'string') {
        if (obj.startsWith('data:image/') && obj.length > 500000) {
          return '[LARGE_IMAGE_STORED_IN_SUPABASE]';
        }
        return obj;
      }
      if (Array.isArray(obj)) {
        return obj.map(deepCompact);
      }
      if (obj && typeof obj === 'object') {
        const newObj = {};
        for (const k in obj) {
          newObj[k] = deepCompact(obj[k]);
        }
        return newObj;
      }
      return obj;
    };
    return deepCompact(value);
  } catch (err) {
    console.debug && console.debug(err);
    return value;
  }
};

// Run one-time migration to free up space from old redundant duplicate keys
try {
  const migrateKey = (oldKey, newKey, redirectVal) => {
    const oldCipher = window.localStorage.getItem(oldKey);
    const newCipher = window.localStorage.getItem(newKey);
    
    if (oldCipher) {
      try {
        const bytes = CryptoJS.AES.decrypt(oldCipher, SECRET_KEY);
        const plaintext = bytes.toString(CryptoJS.enc.Utf8);
        if (plaintext) {
          const parsed = JSON.parse(plaintext);
          if (parsed !== redirectVal && Array.isArray(parsed)) {
            if (!newCipher) {
              window.localStorage.setItem(newKey, oldCipher);
            }
            const redirectCipher = CryptoJS.AES.encrypt(JSON.stringify(redirectVal), SECRET_KEY).toString();
            window.localStorage.setItem(oldKey, redirectCipher);
          }
        }
      } catch (err) {
        console.debug && console.debug(err);
      }
    }
  };
  migrateKey('wc_articles', 'review_articles', '->review_articles');
  migrateKey('wc_products', 'review_products', '->review_products');
} catch (err) {
  console.debug && console.debug(err);
}

// 1. MÃ HÓA DỮ LIỆU TẠI CHỖ (Local Storage AES-256 Symmetric Encryption & Tamper Detection)
export const secureStorage = {
  setItem(key, value) {
    try {
      // 1. Redirect duplicate keys to save 50% storage space immediately
      if (key === 'wc_articles') {
        this.setItem('review_articles', value);
        decryptionCache['wc_articles'] = value;
        const ciphertext = CryptoJS.AES.encrypt(JSON.stringify('->review_articles'), SECRET_KEY).toString();
        localStorage.setItem('wc_articles', ciphertext);
        return;
      }
      if (key === 'wc_products') {
        this.setItem('review_products', value);
        decryptionCache['wc_products'] = value;
        const ciphertext = CryptoJS.AES.encrypt(JSON.stringify('->review_products'), SECRET_KEY).toString();
        localStorage.setItem('wc_products', ciphertext);
        return;
      }

      decryptionCache[key] = value;

      // 2. Background Sync to Supabase if configured (Run this BEFORE localStorage write)
      try {
        if (key === 'review_articles' || key === 'wc_articles') {
          syncArrayToSupabase('wc_articles', value);
        } else if (key === 'review_products' || key === 'wc_products') {
          syncArrayToSupabase('wc_products', value);
        } else if (key === 'wc_deals') {
          syncArrayToSupabase('wc_deals', value);
        } else if (key === 'wc_categories') {
          syncArrayToSupabase('wc_categories', value);
        } else if (key === 'wc_mega_menu_config') {
          syncConfigToSupabase('wc_mega_menu_config', value);
        } else if (key === 'wc_homepage_layout_config') {
          syncConfigToSupabase('wc_homepage_layout_config', value);
        }
      } catch (syncErr) {
        console.error("Background sync error:", syncErr);
      }

      // 3. Write to LocalStorage
      const plaintext = JSON.stringify(value);
      const ciphertext = CryptoJS.AES.encrypt(plaintext, SECRET_KEY).toString();
      localStorage.setItem(key, ciphertext);
    } catch (e) {
      console.error("Encryption/Storage error:", e);
      if (e.name === 'QuotaExceededError' || e.message?.toLowerCase().includes('quota') || e.code === 22) {
        try {
          // Attempt to store compacted version (excluding heavy base64 images) in LocalStorage
          const compacted = compactStorageValue(value);
          const compactedPlaintext = JSON.stringify(compacted);
          const compactedCiphertext = CryptoJS.AES.encrypt(compactedPlaintext, SECRET_KEY).toString();
          localStorage.setItem(key, compactedCiphertext);
          console.log(`[Storage Quota Managed] Successfully stored compacted version of "${key}" to LocalStorage.`);
        } catch (compactErr) {
          console.error("Failed to store compacted version to LocalStorage:", compactErr);
        }
      } else {
        console.error("Storage write error:", e.message);
      }
    }
  },

  getItem(key, defaultValue = null) {
    if (decryptionCache[key] !== undefined) {
      if (decryptionCache[key] === '->review_articles') {
        return this.getItem('review_articles', defaultValue);
      }
      if (decryptionCache[key] === '->review_products') {
        return this.getItem('review_products', defaultValue);
      }
      return decryptionCache[key];
    }
    const ciphertext = localStorage.getItem(key);
    if (!ciphertext) return defaultValue;
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
      const plaintext = bytes.toString(CryptoJS.enc.Utf8);
      if (!plaintext) {
        throw new Error("Invalid decryption plaintext");
      }
      const parsed = JSON.parse(plaintext);
      if (parsed === '->review_articles') {
        decryptionCache[key] = parsed;
        return this.getItem('review_articles', defaultValue);
      }
      if (parsed === '->review_products') {
        decryptionCache[key] = parsed;
        return this.getItem('review_products', defaultValue);
      }
      decryptionCache[key] = parsed;
      return parsed;
    } catch (e) {
      console.warn(`[Storage Decryption Error] Local Storage key "${key}" could not be decrypted.`);
      return defaultValue;
    }
  },

  removeItem(key) {
    delete decryptionCache[key];
    localStorage.removeItem(key);
    if (key === 'review_articles') {
      delete decryptionCache['wc_articles'];
      localStorage.removeItem('wc_articles');
    }
    if (key === 'review_products') {
      delete decryptionCache['wc_products'];
      localStorage.removeItem('wc_products');
    }
  }
};

// 2. CHỐNG TIÊM MÃ ĐỘC (Strict Input Sanitization)
export const sanitizeInput = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '[REDACTED]') // Block script URI
    .replace(/expression\(/gi, '[REDACTED]') // Block CSS expression
    .replace(/\son[a-z]+\s*=\s*(['"])(.*?)\1/gi, '') // Remove inline event handlers
    .trim();
};

// 3. CHE GIẤU LINK GỐC (Link Cloaking & Anti-Affiliate Scraping)
// Base64 encoding/decoding for links
export const cloakUrl = (url) => {
  if (!url) return '#';
  try {
    return btoa(url);
  } catch (e) {
    return url;
  }
};

export const uncloakUrl = (cloaked) => {
  if (!cloaked || cloaked === '#') return '#';
  try {
    return atob(cloaked);
  } catch (e) {
    return cloaked;
  }
};
