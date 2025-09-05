const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

class Database {
  constructor() {
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/database.sqlite');
    this.db = new sqlite3.Database(dbPath);
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Users table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            email TEXT UNIQUE,
            role TEXT DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Agents table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS agents (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            hostname TEXT NOT NULL,
            platform TEXT NOT NULL,
            version TEXT NOT NULL,
            status TEXT DEFAULT 'offline',
            last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
            ip_address TEXT,
            network_id TEXT,
            store_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // File operations history
        this.db.run(`
          CREATE TABLE IF NOT EXISTS file_operations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agent_id TEXT NOT NULL,
            operation_type TEXT NOT NULL,
            file_path TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            error_message TEXT,
            user_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME,
            FOREIGN KEY (agent_id) REFERENCES agents (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
          )
        `);

        // Networks table (optional feature)
        this.db.run(`
          CREATE TABLE IF NOT EXISTS networks (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Stores table (optional feature)
        this.db.run(`
          CREATE TABLE IF NOT EXISTS stores (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            network_id TEXT,
            address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (network_id) REFERENCES networks (id)
          )
        `);

        // Create default admin user
        this.createDefaultAdmin()
          .then(() => resolve())
          .catch(reject);
      });
    });
  }

  async createDefaultAdmin() {
    return new Promise((resolve, reject) => {
      // Use environment variable for default password, or generate one
      let defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD;
      
      if (!defaultPassword) {
        if (process.env.NODE_ENV === 'production') {
          reject(new Error('DEFAULT_ADMIN_PASSWORD must be set in production environment'));
          return;
        }
        // Generate random password for development
        defaultPassword = require('crypto').randomBytes(8).toString('hex');
        console.log(`⚠️  Generated admin password: ${defaultPassword}`);
      }

      const hashedPassword = bcrypt.hashSync(defaultPassword, 12);

      this.db.run(
        `INSERT OR IGNORE INTO users (username, password_hash, email, role) 
         VALUES (?, ?, ?, ?)`,
        ['admin', hashedPassword, 'admin@vr.com.br', 'admin'],
        function(err) {
          if (err) {
            reject(err);
          } else {
            if (this.changes > 0) {
              console.log('✅ Default admin user created');
              console.log(`📧 Email: admin@vr.com.br`);
              if (process.env.NODE_ENV !== 'production') {
                console.log(`🔑 Password: ${defaultPassword}`);
              }
            }
            resolve();
          }
        }
      );
    });
  }

  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  close() {
    return new Promise((resolve) => {
      this.db.close((err) => {
        if (err) console.error('Error closing database:', err);
        else console.log('Database connection closed');
        resolve();
      });
    });
  }
}

module.exports = Database;