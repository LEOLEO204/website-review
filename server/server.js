const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable wide body size limit for base64 images upload
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database Initialization
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    createTables();
  }
});

function createTables() {
  db.serialize(() => {
    // 1. Categories Table
    db.run(`CREATE TABLE IF NOT EXISTS wc_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      subcategories TEXT DEFAULT '[]'
    )`);

    // 2. Articles Table
    db.run(`CREATE TABLE IF NOT EXISTS wc_articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      category TEXT,
      subCategory TEXT,
      categoryId TEXT,
      status TEXT DEFAULT 'Published',
      author TEXT,
      authorRole TEXT,
      image TEXT,
      intro TEXT,
      date TEXT,
      isSpotlight INTEGER DEFAULT 0,
      contentHtml TEXT,
      blocks TEXT DEFAULT '[]',
      picks TEXT DEFAULT '[]',
      clicks INTEGER DEFAULT 0,
      createdAt INTEGER,
      updatedAt TEXT,
      verifiedPick INTEGER DEFAULT 1
    )`);

    // 3. Products Table
    db.run(`CREATE TABLE IF NOT EXISTS wc_products (
      id TEXT PRIMARY KEY,
      articleId TEXT,
      badge TEXT,
      badgeColor TEXT,
      name TEXT NOT NULL,
      tagline TEXT,
      shortDescription TEXT,
      basePrice TEXT,
      merchant TEXT,
      buyUrl TEXT,
      imageUrl TEXT,
      rating REAL,
      reviewsCount INTEGER,
      pieces INTEGER,
      caseType TEXT,
      pros TEXT DEFAULT '[]',
      cons TEXT DEFAULT '[]',
      isEditorPick INTEGER DEFAULT 0,
      affiliateLinks TEXT DEFAULT '[]'
    )`);

    // 4. Deals Table
    db.run(`CREATE TABLE IF NOT EXISTS wc_deals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      dealPrice TEXT,
      originalPrice TEXT,
      discount TEXT,
      merchant TEXT,
      link TEXT,
      imageUrl TEXT,
      categoryId TEXT,
      isEditorPick INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    )`);

    // 5. Mega Menu Config Table
    db.run(`CREATE TABLE IF NOT EXISTS wc_mega_menu_config (
      id TEXT PRIMARY KEY DEFAULT 'default',
      config TEXT DEFAULT '{}'
    )`);

    // 6. Homepage Layout Config Table
    db.run(`CREATE TABLE IF NOT EXISTS wc_homepage_layout_config (
      id TEXT PRIMARY KEY DEFAULT 'default',
      config TEXT DEFAULT '{}'
    )`);

    // 7. Registered Users Table
    db.run(`CREATE TABLE IF NOT EXISTS wc_registered_users (
      username TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin'
    )`);
  });
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Sync Down from Server Database
app.get('/api/sync-down', (req, res) => {
  const data = {};
  
  db.serialize(() => {
    db.all("SELECT * FROM wc_categories", [], (err, cats) => {
      if (err) return res.status(500).json({ error: err.message });
      data.categories = cats.map(c => ({ ...c, active: !!c.active, subcategories: JSON.parse(c.subcategories || '[]') }));
      
      db.all("SELECT * FROM wc_articles", [], (err, arts) => {
        if (err) return res.status(500).json({ error: err.message });
        data.articles = arts.map(a => ({
          ...a,
          isSpotlight: !!a.isSpotlight,
          verifiedPick: !!a.verifiedPick,
          blocks: JSON.parse(a.blocks || '[]'),
          picks: JSON.parse(a.picks || '[]')
        }));
        
        db.all("SELECT * FROM wc_products", [], (err, prods) => {
          if (err) return res.status(500).json({ error: err.message });
          data.products = prods.map(p => ({
            ...p,
            isEditorPick: !!p.isEditorPick,
            pros: JSON.parse(p.pros || '[]'),
            cons: JSON.parse(p.cons || '[]'),
            affiliateLinks: JSON.parse(p.affiliateLinks || '[]')
          }));
          
          db.all("SELECT * FROM wc_deals", [], (err, deals) => {
            if (err) return res.status(500).json({ error: err.message });
            data.deals = deals.map(d => ({ ...d, isEditorPick: !!d.isEditorPick, active: !!d.active }));
            
            db.get("SELECT * FROM wc_mega_menu_config WHERE id = 'default'", [], (err, menu) => {
              data.menu = menu ? JSON.parse(menu.config || '{}') : null;
              
              db.get("SELECT * FROM wc_homepage_layout_config WHERE id = 'default'", [], (err, layout) => {
                data.layout = layout ? JSON.parse(layout.config || '{}') : null;
                
                db.all("SELECT * FROM wc_registered_users", [], (err, users) => {
                  if (err) return res.status(500).json({ error: err.message });
                  data.users = users;
                  
                  return res.json(data);
                });
              });
            });
          });
        });
      });
    });
  });
});

// Simple queue to serialize database operations
let dbQueue = Promise.resolve();

const queueDbOperation = (opFn) => {
  return new Promise((resolve, reject) => {
    dbQueue = dbQueue
      .then(() => new Promise((res, rej) => {
        opFn(res, rej);
      }))
      .then(resolve)
      .catch(reject);
  });
};

// 2. Sync Array (Bulk Upsert/Replace table data)
app.post('/api/sync-array', (req, res) => {
  const { table, data } = req.body;
  if (!table || !Array.isArray(data)) {
    return res.status(400).json({ error: 'Invalid parameters. Need table and data array.' });
  }

  // Define column maps and serializers
  const serializers = {
    wc_categories: (c) => [c.id, c.name, c.active ? 1 : 0, JSON.stringify(c.subcategories || [])],
    wc_articles: (a) => [
      a.id, a.title, a.slug, a.category, a.subCategory, a.categoryId,
      a.status || 'Published', a.author, a.authorRole, a.image, a.intro, a.date,
      a.isSpotlight ? 1 : 0, a.contentHtml, JSON.stringify(a.blocks || []),
      JSON.stringify(a.picks || []), a.clicks || 0, a.createdAt, a.updatedAt,
      a.verifiedPick ? 1 : 0
    ],
    wc_products: (p) => [
      p.id, p.articleId, p.badge, p.badgeColor, p.name, p.tagline, p.shortDescription,
      p.basePrice || p.price, p.merchant, p.buyUrl, p.imageUrl || p.image, p.rating, p.reviewsCount,
      p.pieces, p.caseType, JSON.stringify(p.pros || []), JSON.stringify(p.cons || []),
      p.isEditorPick ? 1 : 0, JSON.stringify(p.affiliateLinks || [])
    ],
    wc_deals: (d) => [
      d.id, d.title, d.dealPrice, d.originalPrice, d.discount, d.merchant,
      d.link, d.imageUrl, d.categoryId, d.isEditorPick ? 1 : 0, d.active ? 1 : 0
    ],
    wc_registered_users: (u) => [u.username, u.password, u.role || 'admin']
  };

  const queries = {
    wc_categories: `INSERT INTO wc_categories (id, name, active, subcategories) VALUES (?, ?, ?, ?)`,
    wc_articles: `INSERT INTO wc_articles (id, title, slug, category, subCategory, categoryId, status, author, authorRole, image, intro, date, isSpotlight, contentHtml, blocks, picks, clicks, createdAt, updatedAt, verifiedPick) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    wc_products: `INSERT INTO wc_products (id, articleId, badge, badgeColor, name, tagline, shortDescription, basePrice, merchant, buyUrl, imageUrl, rating, reviewsCount, pieces, caseType, pros, cons, isEditorPick, affiliateLinks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    wc_deals: `INSERT INTO wc_deals (id, title, dealPrice, originalPrice, discount, merchant, link, imageUrl, categoryId, isEditorPick, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    wc_registered_users: `INSERT INTO wc_registered_users (username, password, role) VALUES (?, ?, ?)`
  };

  const serializeRow = serializers[table];
  const query = queries[table];

  if (!query || !serializeRow) {
    return res.status(400).json({ error: `Table '${table}' not supported for array sync.` });
  }

  queueDbOperation((resolveQueue, rejectQueue) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION", (txErr) => {
        if (txErr) {
          console.error("Failed to begin transaction:", txErr.message);
          rejectQueue(txErr);
          return res.status(500).json({ error: txErr.message });
        }

        db.run(`DELETE FROM ${table}`, [], (delErr) => {
          if (delErr) {
            console.error(`Failed to delete from ${table}:`, delErr.message);
            db.run("ROLLBACK", () => {
              rejectQueue(delErr);
            });
            return res.status(500).json({ error: delErr.message });
          }

          const stmt = db.prepare(query);
          let hasError = false;
          
          for (const item of data) {
            try {
              const params = serializeRow(item);
              stmt.run(params, (runErr) => {
                if (runErr) {
                  console.error(`Error inserting into ${table}:`, runErr.message);
                  hasError = true;
                }
              });
            } catch (serializeErr) {
              console.error(`Serialization error for ${table}:`, serializeErr);
              hasError = true;
            }
          }

          stmt.finalize((finalErr) => {
            if (hasError || finalErr) {
              console.error("Finalizing statement failed or row errors occurred. Rolling back...");
              db.run("ROLLBACK", () => {
                rejectQueue(finalErr || new Error("Row insertion error"));
              });
              return res.status(500).json({ error: 'Transaction failed during insertion.' });
            } else {
              db.run("COMMIT", (commitErr) => {
                if (commitErr) {
                  console.error("Failed to commit transaction:", commitErr.message);
                  db.run("ROLLBACK", () => {
                    rejectQueue(commitErr);
                  });
                  return res.status(500).json({ error: commitErr.message });
                } else {
                  console.log(`[Local API Sync] Successfully transaction committed for ${table}. Count: ${data.length}`);
                  resolveQueue();
                  return res.json({ success: true, count: data.length });
                }
              });
            }
          });
        });
      });
    });
  }).catch((err) => {
    console.error("Queue operation caught error:", err);
  });
});

// 3. Sync Config (Mega Menu or Homepage Layout)
app.post('/api/sync-config', (req, res) => {
  const { table, data } = req.body;
  if (!table || !data) {
    return res.status(400).json({ error: 'Invalid parameters. Need table and config data.' });
  }

  if (table !== 'wc_mega_menu_config' && table !== 'wc_homepage_layout_config') {
    return res.status(400).json({ error: `Table '${table}' is not a config table.` });
  }

  const query = `INSERT OR REPLACE INTO ${table} (id, config) VALUES ('default', ?)`;
  db.run(query, [JSON.stringify(data)], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    return res.json({ success: true });
  });
});

// 4. Local Image Upload (stores base64 to VPS disk)
app.post('/api/upload', (req, res) => {
  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'No image data provided' });
  }

  try {
    const parts = image.split(';base64,');
    if (parts.length < 2) {
      return res.status(400).json({ error: 'Invalid image format. Must be base64 data URL.' });
    }
    
    const mimeType = parts[0].split(':')[1];
    const base64Data = parts[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    const fileExt = mimeType.split('/')[1] || 'jpg';
    const fileName = `review_image_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    
    // Save to the static uploads folder on the VPS
    // (Nginx root is /var/www/review_tot_system_com, we want to write to /var/www/review_tot_system_com/uploads)
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(uploadDir, fileName), buffer);
    
    // Return relative URL
    return res.json({ url: `/uploads/${fileName}` });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Failed to save image: ' + err.message });
  }
});

// Start Server
app.listen(PORT, '127.0.0.1', () => {
  console.log(`ReviewSmart backend running on http://127.0.0.1:${PORT}`);
});
