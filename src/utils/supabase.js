// Get credentials mock
export const getSupabaseConfig = () => {
  return { url: 'local', key: 'local', isConfigured: true };
};

// Client mock
export const getSupabaseClient = () => {
  return { local: true };
};

// SQL setup script mock
export const SUPABASE_SQL_SCRIPT = `-- SQL Setup not required for SQLite. It is created automatically.`;

// Sync arrays (articles, products, deals, categories)
export const syncArrayToSupabase = async (table, localArray) => {
  try {
    if (!Array.isArray(localArray)) return;

    const res = await fetch('/api/sync-array', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ table, data: localArray })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to sync table');
    }

    console.log(`[Local API Sync] Successfully synchronized table "${table}"`);
  } catch (e) {
    console.error(`[Local API Sync Error] Failed to sync table "${table}":`, e);
  }
};

// Sync configuration objects (menu, layout)
export const syncConfigToSupabase = async (table, configData) => {
  try {
    const res = await fetch('/api/sync-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ table, data: configData })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to sync config');
    }

    console.log(`[Local API Sync] Successfully synchronized config "${table}"`);
  } catch (e) {
    console.error(`[Local API Sync Error] Failed to sync config "${table}":`, e);
  }
};

// Perform initial migration of existing LocalStorage data to the local database
export const syncAllLocalToSupabase = async (secureStorage) => {
  console.log("[Local API Sync] Syncing local data to VPS SQLite...");

  // Fetch local data
  const cats = secureStorage.getItem('wc_categories') || [];
  const arts = secureStorage.getItem('wc_articles') || secureStorage.getItem('review_articles') || [];
  const prods = secureStorage.getItem('wc_products') || secureStorage.getItem('review_products') || [];
  const deals = secureStorage.getItem('wc_deals') || [];
  const menu = secureStorage.getItem('wc_mega_menu_config');
  const layout = secureStorage.getItem('wc_homepage_layout_config');

  if (cats.length > 0) await syncArrayToSupabase('wc_categories', cats);
  if (arts.length > 0) await syncArrayToSupabase('wc_articles', arts);
  if (prods.length > 0) await syncArrayToSupabase('wc_products', prods);
  if (deals.length > 0) await syncArrayToSupabase('wc_deals', deals);
  if (menu) await syncConfigToSupabase('wc_mega_menu_config', menu);
  if (layout) await syncConfigToSupabase('wc_homepage_layout_config', layout);

  let users = [];
  try {
    const localUsersStr = window.localStorage.getItem('wc_registered_users');
    users = localUsersStr ? JSON.parse(localUsersStr) : [];
  } catch (e) {
    users = [];
  }
  if (users.length > 0) {
    await syncArrayToSupabase('wc_registered_users', users);
  }

  console.log("[Local API Sync] All data successfully sent to VPS SQLite!");
  return true;
};

// Upload image file to local server backend
export const uploadImageToSupabase = async (fileOrBase64) => {
  let base64String = '';
  
  if (typeof fileOrBase64 === 'string') {
    if (!fileOrBase64.startsWith('data:image/')) {
      throw new Error('Invalid image string format. Must be base64 data URL.');
    }
    base64String = fileOrBase64;
  } else if (fileOrBase64 instanceof File) {
    base64String = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrBase64);
    });
  } else {
    throw new Error('Unsupported image format. Must be base64 string or File.');
  }

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ image: base64String })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to upload image to local server.');
  }

  return data.url; // Returns relative path like /uploads/review_image_12345.jpg
};

