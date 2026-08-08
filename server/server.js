const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

// 1. Logger System (Error Tracking & Audit Logs)
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const writeLog = (level, message) => {
  const today = new Date().toISOString().split('T')[0];
  const logFile = path.join(logDir, `server_${today}.log`);
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
  console.log(logMessage.trim());
};

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting (DDoS & Spam protection)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});

// Enable wide body size limit for base64 images upload
app.use(cors());
app.use('/api/', apiLimiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 2. Auth & Permissions Token Security Middleware
const API_SECURITY_TOKEN = 'reviewsmart_secure_sys_token_2026_xyz';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token || token !== API_SECURITY_TOKEN) {
    writeLog('warning', `Unauthorized API access attempt from IP: ${req.ip} to endpoint: ${req.originalUrl}`);
    return res.status(403).json({ error: 'Forbidden: Invalid API Security Token' });
  }
  next();
};

// 3. Availability & Recovery: Automated Backup Manager & Self-Healing Auto-Restore
const backupDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Database Initialization with Self-Healing Backup Auto-Restore
const dbPath = path.join(__dirname, 'database.sqlite');

// Auto-heal: If main database is missing or corrupted/empty (<100KB), restore from latest valid backup
if (!fs.existsSync(dbPath) || fs.statSync(dbPath).size < 100000) {
  try {
    if (fs.existsSync(backupDir)) {
      const validBackups = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('db_backup_') && f.endsWith('.sqlite'))
        .map(f => ({ name: f, path: path.join(backupDir, f), size: fs.statSync(path.join(backupDir, f)).size }))
        .filter(f => f.size > 100000)
        .sort((a, b) => b.name.localeCompare(a.name));
        
      if (validBackups.length > 0) {
        const latestBackup = validBackups[0];
        fs.copyFileSync(latestBackup.path, dbPath);
        writeLog('info', `[Self-Healing System] Auto-restored database from latest backup: ${latestBackup.name} (${latestBackup.size} bytes)`);
      }
    }
  } catch (healErr) {
    writeLog('error', `[Self-Healing System] Auto-restore error: ${healErr.message}`);
  }
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    writeLog('error', `Error connecting to SQLite database: ${err.message}`);
  } else {
    writeLog('info', `Connected to SQLite database at: ${dbPath}`);
    createTables();
  }
});

const runDatabaseBackup = () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const backupPath = path.join(backupDir, `db_backup_${today}.sqlite`);
    
    if (fs.existsSync(dbPath) && fs.statSync(dbPath).size > 100000) {
      fs.copyFileSync(dbPath, backupPath);
      writeLog('info', `Database backup successfully saved to: ${backupPath}`);
      
      // Retain only last 7 daily backups
      const files = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('db_backup_') && f.endsWith('.sqlite'))
        .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time);
        
      if (files.length > 7) {
        const filesToDelete = files.slice(7);
        filesToDelete.forEach(f => {
          fs.unlinkSync(path.join(backupDir, f.name));
          writeLog('info', `Deleted old database backup: ${f.name}`);
        });
      }
    }
  } catch (err) {
    writeLog('error', `Automated database backup failed: ${err.message}`);
  }
};

// Run database backup once immediately on start, and every 24 hours
runDatabaseBackup();
setInterval(runDatabaseBackup, 24 * 60 * 60 * 1000);

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
      verifiedPick INTEGER DEFAULT 1,
      scheduledAt TEXT
    )`);
    db.run("ALTER TABLE wc_articles ADD COLUMN scheduledAt TEXT", () => {});

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
    )`, (err) => {
      if (!err) {
        db.get("SELECT COUNT(*) as count FROM wc_registered_users", [], (err, row) => {
          if (!err && row && row.count === 0) {
            db.run("INSERT INTO wc_registered_users (username, password, role) VALUES ('admin', 'admin', 'admin')");
            writeLog('info', 'Seeded default admin user into database.');
          }
        });
      }
    });
  });
}

createTables();

// Automated Publisher Background Runner: Checks every 60 seconds
setInterval(() => {
  db.all("SELECT id, status, scheduledAt, date FROM wc_articles WHERE status = 'Scheduled'", [], (err, rows) => {
    if (err || !rows || rows.length === 0) return;
    const now = Date.now();
    const idsToPublish = [];
    for (const art of rows) {
      let schedTime = null;
      if (art.scheduledAt) {
        schedTime = new Date(art.scheduledAt).getTime();
      } else if (art.date) {
        schedTime = new Date(art.date).getTime();
      }
      if (schedTime && !isNaN(schedTime) && now >= schedTime) {
        idsToPublish.push(art.id);
      }
    }
    if (idsToPublish.length > 0) {
      const placeholders = idsToPublish.map(() => '?').join(',');
      db.run(
        `UPDATE wc_articles 
         SET status = 'Published',
             date = CASE 
               WHEN scheduledAt IS NOT NULL AND scheduledAt != '' THEN substr(scheduledAt, 1, 10) 
               ELSE date 
             END 
         WHERE id IN (${placeholders})`,
        idsToPublish,
        function(updateErr) {
          if (!updateErr && this.changes > 0) {
            writeLog('info', `[Auto-Publisher] Automatically published ${this.changes} scheduled articles!`);
          }
        }
      );
    }
  });
}, 60000);

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
                  
                  // Security protection: Only return credentials list if client sends the valid authorization token
                  const authHeader = req.headers['authorization'];
                  const token = authHeader && authHeader.split(' ')[1];
                  if (token === API_SECURITY_TOKEN) {
                    data.users = users;
                  } else {
                    data.users = [];
                  }
                  
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
app.post('/api/sync-array', authenticateToken, (req, res) => {
  const { table, data } = req.body;
  if (!table || !Array.isArray(data)) {
    return res.status(400).json({ error: 'Invalid parameters. Need table and data array.' });
  }

  if ((table === 'wc_articles' || table === 'wc_products') && data.length === 0) {
    writeLog('warning', `Blocked empty sync-up wipe request for table "${table}" to prevent data loss.`);
    return res.json({ success: true, message: 'Wipe blocked to protect data.' });
  }

  // Define column maps and serializers
  const serializers = {
    wc_categories: (c) => [c.id, c.name, c.active ? 1 : 0, JSON.stringify(c.subcategories || [])],
    wc_articles: (a) => [
      a.id, a.title, a.slug, a.category, a.subCategory, a.categoryId,
      a.status || 'Published', a.author, a.authorRole, a.image, a.intro, a.date,
      a.isSpotlight ? 1 : 0, a.contentHtml, JSON.stringify(a.blocks || []),
      JSON.stringify(a.picks || []), a.clicks || 0, a.createdAt, a.updatedAt,
      a.verifiedPick ? 1 : 0, a.scheduledAt || ''
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
    wc_categories: `INSERT OR REPLACE INTO wc_categories (id, name, active, subcategories) VALUES (?, ?, ?, ?)`,
    wc_articles: `INSERT OR REPLACE INTO wc_articles (id, title, slug, category, subCategory, categoryId, status, author, authorRole, image, intro, date, isSpotlight, contentHtml, blocks, picks, clicks, createdAt, updatedAt, verifiedPick, scheduledAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    wc_products: `INSERT OR REPLACE INTO wc_products (id, articleId, badge, badgeColor, name, tagline, shortDescription, basePrice, merchant, buyUrl, imageUrl, rating, reviewsCount, pieces, caseType, pros, cons, isEditorPick, affiliateLinks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    wc_deals: `INSERT OR REPLACE INTO wc_deals (id, title, dealPrice, originalPrice, discount, merchant, link, imageUrl, categoryId, isEditorPick, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    wc_registered_users: `INSERT OR REPLACE INTO wc_registered_users (username, password, role) VALUES (?, ?, ?)`
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
    }).catch((err) => {
      console.error("Queue operation caught error:", err);
    });
  });

// 3. Delete Row Endpoint
app.post('/api/delete-row', authenticateToken, (req, res) => {
  const { table, id } = req.body;
  const allowedTables = ['wc_articles', 'wc_products', 'wc_categories', 'wc_deals', 'wc_registered_users'];
  if (!allowedTables.includes(table) || !id) {
    return res.status(400).json({ error: 'Invalid table or missing id' });
  }

  queueDbOperation((resolveQueue, rejectQueue) => {
    db.run(`DELETE FROM ${table} WHERE id = ?`, [id], function(err) {
      if (err) {
        console.error(`Failed to delete row from ${table}:`, err.message);
        rejectQueue(err);
        return res.status(500).json({ error: err.message });
      }
      console.log(`[Local API Delete] Successfully deleted row "${id}" from ${table}`);
      resolveQueue();
      res.json({ success: true, deletedId: id });
    });
  }).catch((err) => {
    console.error("Queue operation caught delete error:", err);
  });
});

// 4. Sync Config (Mega Menu or Homepage Layout)
app.post('/api/sync-config', authenticateToken, (req, res) => {
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
app.post('/api/upload', authenticateToken, (req, res) => {
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

// 5. Secure Authentication Endpoints
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  
  db.get("SELECT * FROM wc_registered_users WHERE username = ? AND password = ?", [username.trim().toLowerCase(), password], (err, user) => {
    if (err) {
      writeLog('error', `Login query error: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
    
    if (user) {
      const session = {
        username: user.username,
        role: user.role || 'admin',
        token: `JWT-SECURE-${Math.random().toString(36).substring(2, 15)}`,
        loginTime: Date.now()
      };
      writeLog('info', `Successful admin login: ${user.username}`);
      return res.json({ success: true, session });
    } else {
      writeLog('warning', `Failed login attempt for username: ${username}`);
      return res.status(401).json({ error: 'Invalid username or password.' });
    }
  });
});

app.post('/api/register', (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  
  const trimmedUser = username.trim().toLowerCase();
  
  db.get("SELECT * FROM wc_registered_users WHERE username = ?", [trimmedUser], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) return res.status(400).json({ error: 'Username is already taken.' });
    
    db.run("INSERT INTO wc_registered_users (username, password, role) VALUES (?, ?, ?)", [trimmedUser, password, role || 'admin'], (insertErr) => {
      if (insertErr) {
        writeLog('error', `Failed to register user: ${insertErr.message}`);
        return res.status(500).json({ error: insertErr.message });
      }
      writeLog('info', `Registered new manager user: ${trimmedUser}`);
      return res.json({ success: true });
    });
  });
});

app.get('/api/check-username/:username', (req, res) => {
  const username = req.params.username.trim().toLowerCase();
  db.get("SELECT * FROM wc_registered_users WHERE username = ?", [username], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    return res.json({ taken: !!row });
  });
});

// 6. Technical SEO & Audit Endpoints (Sitemap XML động, LLMs.txt & Log Analysis)

// Dynamic XML Sitemap Generator (Criterion 2)
app.get(['/sitemap.xml', '/api/sitemap.xml'], (req, res) => {
  const domain = 'https://review.totsystem.com';
  const todayStr = new Date().toISOString().split('T')[0];

  const staticPages = [
    { url: `${domain}/`, priority: '1.0', changefreq: 'daily', lastmod: todayStr },
    { url: `${domain}/deals`, priority: '0.8', changefreq: 'daily', lastmod: todayStr },
    { url: `${domain}/about`, priority: '0.5', changefreq: 'monthly', lastmod: '2026-01-01' },
    { url: `${domain}/our-team`, priority: '0.5', changefreq: 'monthly', lastmod: '2026-01-01' },
    { url: `${domain}/staff-demographics`, priority: '0.5', changefreq: 'monthly', lastmod: '2026-01-01' },
    { url: `${domain}/how-to-pitch`, priority: '0.5', changefreq: 'monthly', lastmod: '2026-01-01' },
    { url: `${domain}/contact`, priority: '0.5', changefreq: 'monthly', lastmod: '2026-01-01' }
  ];

  db.all("SELECT id, name FROM wc_categories WHERE active = 1", [], (catErr, categories) => {
    const categoryUrls = (categories || []).map(c => ({
      url: `${domain}/category/${c.id}`,
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: todayStr
    }));

    db.all("SELECT id, slug, status, date, createdAt FROM wc_articles WHERE status = 'Published'", [], (artErr, articles) => {
      const articleUrls = (articles || []).map(a => {
        let lastmod = todayStr;
        if (a.date) {
          try { lastmod = new Date(a.date).toISOString().split('T')[0]; } catch(e) {}
        }
        return {
          url: `${domain}/reviews/${a.slug || a.id}`,
          priority: '0.9',
          changefreq: 'daily',
          lastmod
        };
      });

      const allUrls = [...staticPages, ...categoryUrls, ...articleUrls];

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      allUrls.forEach(item => {
        xml += `  <url>\n`;
        xml += `    <loc>${item.url}</loc>\n`;
        xml += `    <lastmod>${item.lastmod}</lastmod>\n`;
        xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
        xml += `    <priority>${item.priority}</priority>\n`;
        xml += `  </url>\n`;
      });
      xml += `</urlset>\n`;

      res.header('Content-Type', 'application/xml');
      return res.send(xml);
    });
  });
});

// Serve llms.txt (Criterion 41)
app.get('/llms.txt', (req, res) => {
  const llmsPath = path.join(__dirname, '../public/llms.txt');
  if (fs.existsSync(llmsPath)) {
    res.header('Content-Type', 'text/plain; charset=utf-8');
    return res.sendFile(llmsPath);
  }
  return res.status(404).send('# llms.txt not found');
});

// Crawler Bot Log File Analysis Endpoint (Criterion 39)
app.get('/api/log-analysis', (req, res) => {
  try {
    const files = fs.readdirSync(logDir).filter(f => f.startsWith('server_') && f.endsWith('.log'));
    let totalRequests = 0;
    let googlebotHits = 0;
    let bingbotHits = 0;
    let otherBotHits = 0;

    files.forEach(file => {
      const content = fs.readFileSync(path.join(logDir, file), 'utf-8');
      const lines = content.split('\n');
      totalRequests += lines.length;
      lines.forEach(line => {
        const lower = line.toLowerCase();
        if (lower.includes('googlebot')) googlebotHits++;
        else if (lower.includes('bingbot')) bingbotHits++;
        else if (lower.includes('bot') || lower.includes('crawler') || lower.includes('slurp')) otherBotHits++;
      });
    });

    return res.json({
      success: true,
      logFilesCount: files.length,
      totalLogEntries: totalRequests,
      crawlerStats: {
        googlebotHits,
        bingbotHits,
        otherBotHits,
        lastAnalyzedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Log analysis failed: ' + err.message });
  }
});

// Start Server
app.listen(PORT, '127.0.0.1', () => {
  writeLog('info', `ReviewSmart backend running on http://127.0.0.1:${PORT}`);
});

