import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'vision_platform.db');
export const db = new Database(DB_PATH);

// Enable WAL mode & foreign keys for high concurrent performance & integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vision_scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    domain TEXT NOT NULL,
    image_url TEXT NOT NULL,
    status TEXT DEFAULT 'completed',
    summary TEXT,
    raw_analysis TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_vision_scans_user_id ON vision_scans(user_id);
  CREATE INDEX IF NOT EXISTS idx_vision_scans_domain ON vision_scans(domain);
  CREATE INDEX IF NOT EXISTS idx_vision_scans_created_at ON vision_scans(created_at);
`);

// Seed default demo user if empty
(function seedDefaultUser() {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('operator@visionpulse.ai');
  if (!existing) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('Password123!', salt);
    db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)')
      .run('lead_inspector', 'operator@visionpulse.ai', hash);
  }
})();

export interface DBUser {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface DBScan {
  id: number;
  user_id: number;
  domain: string;
  image_url: string;
  status: string;
  summary: string;
  raw_analysis: string;
  created_at: string;
}

export const dbService = {
  createUser(username: string, email: string, passwordHash: string): DBUser {
    const stmt = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)');
    const result = stmt.run(username, email, passwordHash);
    return db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?').get(result.lastInsertRowid) as DBUser;
  },

  findUserByEmail(email: string): DBUser | undefined {
    return db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email) as DBUser | undefined;
  },

  findUserByUsername(username: string): DBUser | undefined {
    return db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)').get(username) as DBUser | undefined;
  },

  findUserById(id: number): DBUser | undefined {
    return db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?').get(id) as DBUser | undefined;
  },

  createScan(params: {
    userId: number;
    domain: string;
    imageUrl: string;
    summary: string;
    rawAnalysis: object;
    status?: string;
  }): DBScan {
    const stmt = db.prepare(`
      INSERT INTO vision_scans (user_id, domain, image_url, summary, raw_analysis, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      params.userId,
      params.domain,
      params.imageUrl,
      params.summary,
      JSON.stringify(params.rawAnalysis),
      params.status || 'completed'
    );
    return db.prepare('SELECT * FROM vision_scans WHERE id = ?').get(result.lastInsertRowid) as DBScan;
  },

  getScans(params: {
    userId: number;
    domain?: string;
    search?: string;
    anomalyFilter?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 12));
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE user_id = ?';
    const args: any[] = [params.userId];

    if (params.domain && params.domain !== 'all') {
      whereClause += ' AND domain = ?';
      args.push(params.domain);
    }

    if (params.search && params.search.trim()) {
      whereClause += ' AND (summary LIKE ? OR raw_analysis LIKE ?)';
      const term = `%${params.search.trim()}%`;
      args.push(term, term);
    }

    if (params.anomalyFilter === 'anomalies') {
      whereClause += ` AND raw_analysis LIKE '%"anomaliesDetected":true%'`;
    } else if (params.anomalyFilter === 'clean') {
      whereClause += ` AND raw_analysis LIKE '%"anomaliesDetected":false%'`;
    }

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM vision_scans ${whereClause}`).get(...args) as { total: number };
    const total = countRow ? countRow.total : 0;

    const rows = db.prepare(`
      SELECT * FROM vision_scans
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...args, limit, offset) as DBScan[];

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      scans: rows.map(r => ({
        ...r,
        raw_analysis: JSON.parse(r.raw_analysis)
      }))
    };
  },

  getScanById(id: number, userId: number) {
    const row = db.prepare('SELECT * FROM vision_scans WHERE id = ? AND user_id = ?').get(id, userId) as DBScan | undefined;
    if (!row) return null;
    return {
      ...row,
      raw_analysis: JSON.parse(row.raw_analysis)
    };
  },

  deleteScan(id: number, userId: number): boolean {
    const result = db.prepare('DELETE FROM vision_scans WHERE id = ? AND user_id = ?').run(id, userId);
    return result.changes > 0;
  },

  getStats(userId: number) {
    const rows = db.prepare('SELECT domain, summary, raw_analysis, created_at FROM vision_scans WHERE user_id = ?').all(userId) as {
      domain: string;
      summary: string;
      raw_analysis: string;
      created_at: string;
    }[];

    const totalScans = rows.length;
    let anomaliesCount = 0;
    let confidenceSum = 0;
    const domainBreakdown: Record<string, number> = {
      industrial: 0,
      medical: 0,
      document: 0,
      general: 0
    };

    rows.forEach(r => {
      if (domainBreakdown[r.domain] !== undefined) {
        domainBreakdown[r.domain]++;
      } else {
        domainBreakdown[r.domain] = 1;
      }

      try {
        const analysis = JSON.parse(r.raw_analysis);
        if (analysis.anomaliesDetected) {
          anomaliesCount++;
        }
        if (typeof analysis.confidenceScore === 'number') {
          confidenceSum += analysis.confidenceScore;
        }
      } catch (e) {
        // ignore malformed
      }
    });

    const avgConfidence = totalScans > 0 ? Number((confidenceSum / totalScans).toFixed(3)) : 0;
    const cleanCount = totalScans - anomaliesCount;

    return {
      totalScans,
      anomaliesCount,
      cleanCount,
      anomalyRate: totalScans > 0 ? Number(((anomaliesCount / totalScans) * 100).toFixed(1)) : 0,
      avgConfidence,
      domainBreakdown,
    };
  }
};
