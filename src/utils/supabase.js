import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment or LocalStorage configuration
export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const localUrl = localStorage.getItem('supabase_url');
  const localKey = localStorage.getItem('supabase_anon_key');
  
  const url = (envUrl || localUrl || '').trim();
  const key = (envKey || localKey || '').trim();
  
  return { url, key, isConfigured: !!(url && key) };
};

let supabaseClient = null;

export const getSupabaseClient = () => {
  const { url, key, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;
  
  if (!supabaseClient) {
    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: false
      }
    });
  }
  return supabaseClient;
};

// Define exact allowed schemas to prevent Postgres "column does not exist" errors
const SCHEMAS = {
  wc_categories: ['id', 'name', 'active', 'subcategories'],
  wc_articles: ['id', 'title', 'slug', 'category', 'subCategory', 'categoryId', 'status', 'author', 'authorRole', 'image', 'intro', 'date', 'isSpotlight', 'contentHtml', 'blocks', 'picks', 'clicks', 'createdAt', 'updatedAt', 'verifiedPick'],
  wc_products: ['id', 'articleId', 'badge', 'badgeColor', 'name', 'tagline', 'shortDescription', 'basePrice', 'merchant', 'buyUrl', 'imageUrl', 'rating', 'reviewsCount', 'pieces', 'caseType', 'pros', 'cons', 'isEditorPick', 'affiliateLinks'],
  wc_deals: ['id', 'title', 'dealPrice', 'originalPrice', 'discount', 'merchant', 'link', 'imageUrl', 'categoryId', 'isEditorPick', 'active'],
  wc_registered_users: ['username', 'password', 'role']
};

export const sanitizeItem = (item, table) => {
  const allowedFields = SCHEMAS[table];
  if (!allowedFields) return item;
  
  const itemCopy = { ...item };
  if (table === 'wc_products') {
    if (itemCopy.image !== undefined && itemCopy.imageUrl === undefined) {
      itemCopy.imageUrl = itemCopy.image;
    }
    if (itemCopy.price !== undefined && itemCopy.basePrice === undefined) {
      itemCopy.basePrice = itemCopy.price;
    }
  }
  
  const sanitized = {};
  allowedFields.forEach(field => {
    if (itemCopy[field] !== undefined) {
      sanitized[field] = itemCopy[field];
    }
  });
  return sanitized;
};

const restoreCompactedFields = (local, db) => {
  if (local === '[LARGE_IMAGE_STORED_IN_SUPABASE]') {
    return db || local;
  }
  if (Array.isArray(local) && Array.isArray(db)) {
    return local.map((item, idx) => restoreCompactedFields(item, db[idx]));
  }
  if (local && typeof local === 'object' && db && typeof db === 'object') {
    const restored = { ...local };
    for (const key in local) {
      restored[key] = restoreCompactedFields(local[key], db[key]);
    }
    return restored;
  }
  return local;
};

const restoreCompactedListIfNeeded = async (table, items, supabase) => {
  const serialized = JSON.stringify(items);
  if (!serialized.includes('[LARGE_IMAGE_STORED_IN_SUPABASE]')) return items;
  
  try {
    const ids = items.map(x => x.id).filter(Boolean);
    if (ids.length > 0) {
      const { data: dbItems } = await supabase.from(table).select('*').in('id', ids);
      if (dbItems && dbItems.length > 0) {
        const dbMap = new Map(dbItems.map(x => [x.id, x]));
        return items.map(localItem => {
          const dbItem = dbMap.get(localItem.id);
          return dbItem ? restoreCompactedFields(localItem, dbItem) : localItem;
        });
      }
    }
  } catch (err) {
    console.error(`[Restore Compacted List Error] Table ${table}:`, err);
  }
  return items;
};

// Sync arrays (articles, products, deals, categories)
export const syncArrayToSupabase = async (table, localArray) => {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    if (!Array.isArray(localArray)) return;

    // 1. Bulk Upsert the current array items
    if (localArray.length > 0) {
      let itemsToUpsert = localArray.map(item => {
        if (!item.id) return null;
        return sanitizeItem(item, table);
      }).filter(Boolean);

      itemsToUpsert = await restoreCompactedListIfNeeded(table, itemsToUpsert, supabase);

      if (itemsToUpsert.length > 0) {
        const { error: upsertErr } = await supabase.from(table).upsert(itemsToUpsert);
        if (upsertErr) throw upsertErr;
      }
    }

    // 2. Delete items in Supabase that are not in the local array
    const localIds = localArray.map(item => item.id).filter(Boolean);
    if (localIds.length > 0) {
      // Build safe query for Postgres NOT IN
      const { error: deleteErr } = await supabase
        .from(table)
        .delete()
        .not('id', 'in', `(${localIds.map(id => `"${id}"`).join(',')})`);
      if (deleteErr) throw deleteErr;
    } else {
      // If local array is empty, delete everything
      const { error: deleteErr } = await supabase
        .from(table)
        .delete()
        .neq('id', 'placeholder-value-that-does-not-exist');
      if (deleteErr) throw deleteErr;
    }

    console.log(`[Supabase Sync] Successfully synchronized table "${table}"`);
  } catch (e) {
    console.error(`[Supabase Sync Error] Failed to sync table "${table}":`, e);
  }
};

// Sync configuration objects (menu, layout)
export const syncConfigToSupabase = async (table, configData) => {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const { error } = await supabase.from(table).upsert({ id: 'default', config: configData });
    if (error) throw error;
    console.log(`[Supabase Sync] Successfully synchronized config "${table}"`);
  } catch (e) {
    console.error(`[Supabase Sync Error] Failed to sync config "${table}":`, e);
  }
};

// Perform initial migration of existing LocalStorage data to Supabase
export const syncAllLocalToSupabase = async (secureStorage) => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  // Fetch local data
  const cats = secureStorage.getItem('wc_categories') || [];
  const arts = secureStorage.getItem('wc_articles') || secureStorage.getItem('review_articles') || [];
  const prods = secureStorage.getItem('wc_products') || secureStorage.getItem('review_products') || [];
  const deals = secureStorage.getItem('wc_deals') || [];
  const menu = secureStorage.getItem('wc_mega_menu_config');
  const layout = secureStorage.getItem('wc_homepage_layout_config');

  console.log("[Supabase Migration] Starting data sync...");

  // 1. Sync Categories
  if (cats.length > 0) {
    let sanitizedCats = cats.map(c => sanitizeItem(c, 'wc_categories'));
    sanitizedCats = await restoreCompactedListIfNeeded('wc_categories', sanitizedCats, supabase);
    const { error } = await supabase.from('wc_categories').upsert(sanitizedCats);
    if (error) throw new Error("Sync Categories failed: " + error.message);
  }

  // 2. Sync Articles
  if (arts.length > 0) {
    let sanitizedArts = arts.map(a => sanitizeItem(a, 'wc_articles'));
    sanitizedArts = await restoreCompactedListIfNeeded('wc_articles', sanitizedArts, supabase);
    const { error } = await supabase.from('wc_articles').upsert(sanitizedArts);
    if (error) throw new Error("Sync Articles failed: " + error.message);
  }

  // 3. Sync Products
  if (prods.length > 0) {
    let sanitizedProds = prods.map(p => sanitizeItem(p, 'wc_products'));
    sanitizedProds = await restoreCompactedListIfNeeded('wc_products', sanitizedProds, supabase);
    const { error } = await supabase.from('wc_products').upsert(sanitizedProds);
    if (error) throw new Error("Sync Products failed: " + error.message);
  }

  // 4. Sync Deals
  if (deals.length > 0) {
    let sanitizedDeals = deals.map(d => sanitizeItem(d, 'wc_deals'));
    sanitizedDeals = await restoreCompactedListIfNeeded('wc_deals', sanitizedDeals, supabase);
    const { error } = await supabase.from('wc_deals').upsert(sanitizedDeals);
    if (error) throw new Error("Sync Deals failed: " + error.message);
  }

  // 5. Sync Menu Config
  if (menu) {
    const { error } = await supabase.from('wc_mega_menu_config').upsert({ id: 'default', config: menu });
    if (error) throw new Error("Sync Menu failed: " + error.message);
  }

  // 6. Sync Homepage Config
  if (layout) {
    const { error } = await supabase.from('wc_homepage_layout_config').upsert({ id: 'default', config: layout });
    if (error) throw new Error("Sync Layout failed: " + error.message);
  }

  // 7. Sync Registered Users
  let users = [];
  try {
    const localUsersStr = window.localStorage.getItem('wc_registered_users');
    users = localUsersStr ? JSON.parse(localUsersStr) : [];
  } catch (e) {
    users = [];
  }
  if (users.length > 0) {
    let sanitizedUsers = users.map(u => sanitizeItem(u, 'wc_registered_users'));
    const { error } = await supabase.from('wc_registered_users').upsert(sanitizedUsers);
    if (error) throw new Error("Sync Users failed: " + error.message);
  }

  console.log("[Supabase Migration] All data synchronized successfully!");
  return true;
};

// SQL setup script for user to copy-paste into Supabase SQL editor
export const SUPABASE_SQL_SCRIPT = `-- SUPABASE DATABASE SCHEMA SETUP FOR REVIEWSMART
-- Copy and paste this script into your Supabase SQL Editor, then click "Run"

-- 1. Create table for Categories
CREATE TABLE IF NOT EXISTS wc_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  subcategories JSONB DEFAULT '[]'::jsonb
);

ALTER TABLE wc_categories ADD COLUMN IF NOT EXISTS subcategories JSONB DEFAULT '[]'::jsonb;

-- 2. Create table for Articles
CREATE TABLE IF NOT EXISTS wc_articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  category TEXT,
  "subCategory" TEXT,
  "categoryId" TEXT,
  status TEXT DEFAULT 'Published',
  author TEXT,
  "authorRole" TEXT,
  image TEXT,
  intro TEXT,
  date TEXT,
  "isSpotlight" BOOLEAN DEFAULT FALSE,
  "contentHtml" TEXT,
  blocks JSONB DEFAULT '[]'::jsonb,
  picks JSONB DEFAULT '[]'::jsonb,
  clicks INTEGER DEFAULT 0,
  "createdAt" BIGINT,
  "updatedAt" TEXT,
  "verifiedPick" BOOLEAN DEFAULT TRUE
);

ALTER TABLE wc_articles ADD COLUMN IF NOT EXISTS "authorRole" TEXT;
ALTER TABLE wc_articles ADD COLUMN IF NOT EXISTS "updatedAt" TEXT;
ALTER TABLE wc_articles ADD COLUMN IF NOT EXISTS "verifiedPick" BOOLEAN DEFAULT TRUE;

-- 3. Create table for Products
CREATE TABLE IF NOT EXISTS wc_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT,
  "basePrice" TEXT,
  "dealPrice" TEXT,
  discount TEXT,
  merchant TEXT,
  "buyUrl" TEXT,
  "imageUrl" TEXT,
  "isEditorPick" BOOLEAN DEFAULT FALSE,
  "affiliateLinks" JSONB DEFAULT '[]'::jsonb,
  "articleId" TEXT,
  badge TEXT,
  "badgeColor" TEXT,
  tagline TEXT,
  "shortDescription" TEXT,
  rating NUMERIC,
  "reviewsCount" INTEGER,
  pieces INTEGER,
  "caseType" TEXT,
  pros JSONB DEFAULT '[]'::jsonb,
  cons JSONB DEFAULT '[]'::jsonb
);

ALTER TABLE wc_products ADD COLUMN IF NOT EXISTS "articleId" TEXT;
ALTER TABLE wc_products ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE wc_products ADD COLUMN IF NOT EXISTS "badgeColor" TEXT;
ALTER TABLE wc_products ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE wc_products ADD COLUMN IF NOT EXISTS "shortDescription" TEXT;
ALTER TABLE wc_products ADD COLUMN IF NOT EXISTS rating NUMERIC;
ALTER TABLE wc_products ADD COLUMN IF NOT EXISTS "reviewsCount" INTEGER;
ALTER TABLE wc_products ADD COLUMN IF NOT EXISTS pieces INTEGER;
ALTER TABLE wc_products ADD COLUMN IF NOT EXISTS "caseType" TEXT;
ALTER TABLE wc_products ADD COLUMN IF NOT EXISTS pros JSONB DEFAULT '[]'::jsonb;
ALTER TABLE wc_products ADD COLUMN IF NOT EXISTS cons JSONB DEFAULT '[]'::jsonb;

-- 4. Create table for Deals
CREATE TABLE IF NOT EXISTS wc_deals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  "dealPrice" TEXT,
  "originalPrice" TEXT,
  discount TEXT,
  merchant TEXT,
  link TEXT,
  "imageUrl" TEXT,
  "categoryId" TEXT,
  "isEditorPick" BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE
);

-- 5. Create table for Mega Menu configuration
CREATE TABLE IF NOT EXISTS wc_mega_menu_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  config JSONB DEFAULT '{}'::jsonb
);

-- 6. Create table for Homepage Layout configuration
CREATE TABLE IF NOT EXISTS wc_homepage_layout_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  config JSONB DEFAULT '{}'::jsonb
);

-- Enable Row Level Security (RLS)
ALTER TABLE wc_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE wc_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wc_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE wc_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE wc_mega_menu_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE wc_homepage_layout_config ENABLE ROW LEVEL SECURITY;

-- Create Policies to allow public read access
CREATE POLICY "Allow public read categories" ON wc_categories FOR SELECT USING (true);
CREATE POLICY "Allow public read articles" ON wc_articles FOR SELECT USING (true);
CREATE POLICY "Allow public read products" ON wc_products FOR SELECT USING (true);
CREATE POLICY "Allow public read deals" ON wc_deals FOR SELECT USING (true);
CREATE POLICY "Allow public read menu" ON wc_mega_menu_config FOR SELECT USING (true);
CREATE POLICY "Allow public read layout" ON wc_homepage_layout_config FOR SELECT USING (true);

-- Create Policies to allow public write access for admin (using the Anon Key)
CREATE POLICY "Allow public insert categories" ON wc_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update categories" ON wc_categories FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete categories" ON wc_categories FOR DELETE USING (true);

CREATE POLICY "Allow public insert articles" ON wc_articles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update articles" ON wc_articles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete articles" ON wc_articles FOR DELETE USING (true);

CREATE POLICY "Allow public insert products" ON wc_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update products" ON wc_products FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete products" ON wc_products FOR DELETE USING (true);

CREATE POLICY "Allow public insert deals" ON wc_deals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update deals" ON wc_deals FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete deals" ON wc_deals FOR DELETE USING (true);

CREATE POLICY "Allow public insert menu" ON wc_mega_menu_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update menu" ON wc_mega_menu_config FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public insert layout" ON wc_homepage_layout_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update layout" ON wc_homepage_layout_config FOR UPDATE USING (true) WITH CHECK (true);

-- 7. Create table for Registered Users
CREATE TABLE IF NOT EXISTS wc_registered_users (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'admin'
);

ALTER TABLE wc_registered_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read users" ON wc_registered_users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON wc_registered_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON wc_registered_users FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete users" ON wc_registered_users FOR DELETE USING (true);

-- 8. Setup Storage Bucket for Images (Ensure the public bucket is created)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true) 
ON CONFLICT (id) DO NOTHING;

-- Allow public access to read/write/delete objects in the images bucket
CREATE POLICY "Allow public read objects" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "Allow public insert objects" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images');
CREATE POLICY "Allow public update objects" ON storage.objects FOR UPDATE USING (bucket_id = 'images') WITH CHECK (bucket_id = 'images');
CREATE POLICY "Allow public delete objects" ON storage.objects FOR DELETE USING (bucket_id = 'images');
`;

// Helper to convert base64 image data to a Blob for binary upload
const base64ToBlob = (base64Str) => {
  const parts = base64Str.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
};

// Upload file (File object or base64 data URL) to Supabase Storage bucket and return public URL
export const uploadImageToSupabase = async (fileOrBase64) => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  let fileBody = fileOrBase64;
  let fileExt = 'jpg';
  
  if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('data:image/')) {
    fileBody = base64ToBlob(fileOrBase64);
    const mimeType = fileOrBase64.split(';base64,')[0].split(':')[1];
    fileExt = mimeType.split('/')[1] || 'jpg';
  } else if (fileOrBase64 instanceof File) {
    fileExt = fileOrBase64.name ? fileOrBase64.name.split('.').pop() : 'jpg';
  }

  const fileName = `review_image_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  // Try uploading
  const { data, error } = await supabase.storage
    .from('images')
    .upload(fileName, fileBody, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    // Attempt bucket creation if not exists
    if (error.message && (error.message.includes('bucket') || error.message.includes('not found') || error.statusCode === '404' || error.statusCode === 404)) {
      try {
        await supabase.storage.createBucket('images', { public: true });
        const { data: retryData, error: retryErr } = await supabase.storage
          .from('images')
          .upload(fileName, fileBody, {
            cacheControl: '3600',
            upsert: false
          });
        if (retryErr) throw retryErr;
        
        const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
        return urlData.publicUrl;
      } catch (err2) {
        throw new Error("Vui lòng tạo bucket tên 'images' trong Supabase Storage của bạn. Lỗi: " + err2.message);
      }
    }
    throw error;
  }

  const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
  return urlData.publicUrl;
};
