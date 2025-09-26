const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database file path
const dbPath = path.join(__dirname, '../sqlite.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening SQLite database:', err.message);
    process.exit(1);
  } else {
    console.log('📊 Connected to SQLite database');
  }
});

// Initialize database tables
const initializeDatabase = async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          subscription_status TEXT DEFAULT 'free',
          is_verified INTEGER DEFAULT 0,
          verification_token TEXT,
          reset_token TEXT,
          reset_token_expires TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Chats table
      db.run(`
        CREATE TABLE IF NOT EXISTS chats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          message TEXT NOT NULL,
          response TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Interview sessions table
      db.run(`
        CREATE TABLE IF NOT EXISTS interview_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          resume_url TEXT,
          resume_text TEXT,
          jd_text TEXT NOT NULL,
          focus_areas TEXT,
          difficulty TEXT,
          role_type TEXT,
          feedback TEXT,
          score INTEGER,
          questions_asked TEXT,
          answers_given TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          completed_at DATETIME,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Subscriptions table
      db.run(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          plan TEXT NOT NULL,
          status TEXT NOT NULL,
          stripe_subscription_id TEXT,
          stripe_customer_id TEXT,
          start_date DATETIME NOT NULL,
          end_date DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Image generations table (for premium users)
      db.run(`
        CREATE TABLE IF NOT EXISTS image_generations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          prompt TEXT NOT NULL,
          image_url TEXT,
          model TEXT DEFAULT 'dall-e-3',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Create indexes for better performance
      db.run(`CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_chats_timestamp ON chats(timestamp)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON interview_sessions(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_image_generations_user_id ON image_generations(user_id)`);

      console.log('✅ SQLite database tables initialized successfully');
      resolve();
    });
  });
};

// Database will be initialized by the main server file

// Helper function to run queries with promises
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    // Convert PostgreSQL-style placeholders ($1, $2, etc.) to SQLite placeholders (?)
    let sqliteSql = sql.replace(/\$(\d+)/g, '?');
    
    // Handle RETURNING clause for SQLite
    const hasReturning = sqliteSql.includes('RETURNING');
    if (hasReturning) {
      // For SQLite, we need to do INSERT then SELECT
      const insertMatch = sqliteSql.match(/INSERT INTO (\w+) \((.*?)\) VALUES \((.*?)\) RETURNING (.*)/i);
      if (insertMatch) {
        const [, table, columns, values, returning] = insertMatch;
        const insertSql = `INSERT INTO ${table} (${columns}) VALUES (${values})`;
        const selectSql = `SELECT ${returning} FROM ${table} WHERE id = last_insert_rowid()`;
        
        db.run(insertSql, params, function(err) {
          if (err) {
            reject(err);
            return;
          }
          
          db.all(selectSql, [], (selectErr, rows) => {
            if (selectErr) {
              reject(selectErr);
            } else {
              resolve({ rows: rows });
            }
          });
        });
        return;
      }
    }
    
    if (sqliteSql.trim().toLowerCase().startsWith('select')) {
      db.all(sqliteSql, params, (err, rows) => {
        if (err) reject(err);
        else resolve({ rows: rows });
      });
    } else {
      db.run(sqliteSql, params, function(err) {
        if (err) reject(err);
        else resolve({ 
          rows: [{ id: this.lastID }], 
          id: this.lastID, 
          changes: this.changes 
        });
      });
    }
  });
};

// Create a pool-like object for compatibility
const pool = {
  query: query
};

module.exports = { db, query, pool, initializeDatabase };