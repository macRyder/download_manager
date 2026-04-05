const Database = require('better-sqlite3');
const path = require('path');

class DatabaseService {
  constructor(dbPath) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this._initSchema();
  }

  _initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS downloads (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        name TEXT,
        filename TEXT,
        folder TEXT,
        status TEXT NOT NULL,
        total TEXT,
        downloaded TEXT,
        method TEXT DEFAULT 'aria2c',
        error TEXT,
        started_at INTEGER,
        finished_at INTEGER
      )
    `);
  }

  saveDownload(download) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO downloads (id, url, name, filename, folder, status, total, downloaded, method, error, started_at, finished_at)
      VALUES (@id, @url, @name, @filename, @folder, @status, @total, @downloaded, @method, @error, @startedAt, @finishedAt)
    `);
    stmt.run({
      id: download.id,
      url: download.url,
      name: download.name || null,
      filename: download.filename || null,
      folder: download.folder || '',
      status: download.status,
      total: download.total || null,
      downloaded: download.downloaded || null,
      method: download.method || 'aria2c',
      error: download.error || null,
      startedAt: download.startTime || null,
      finishedAt: Date.now()
    });
  }

  getHistory(limit = 100, offset = 0) {
    const stmt = this.db.prepare(
      'SELECT * FROM downloads ORDER BY finished_at DESC LIMIT ? OFFSET ?'
    );
    return stmt.all(limit, offset);
  }

  getDownloadById(id) {
    const stmt = this.db.prepare('SELECT * FROM downloads WHERE id = ?');
    return stmt.get(id);
  }

  deleteDownload(id) {
    const stmt = this.db.prepare('DELETE FROM downloads WHERE id = ?');
    return stmt.run(id);
  }

  clearHistory() {
    this.db.exec('DELETE FROM downloads');
  }

  getStats() {
    const stmt = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM downloads
    `);
    return stmt.get();
  }

  close() {
    this.db.close();
  }
}

module.exports = DatabaseService;
