const fs = require('fs');
const path = require('path');

class Logger {
  constructor(logDir) {
    this.logDir = logDir;
    fs.mkdirSync(logDir, { recursive: true });
    this._streams = {};
  }

  _getStream(file) {
    if (!this._streams[file]) {
      this._streams[file] = fs.createWriteStream(
        path.join(this.logDir, file),
        { flags: 'a' }
      );
    }
    return this._streams[file];
  }

  _write(file, level, message, meta = {}) {
    const entry = JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta
    }) + '\n';
    this._getStream(file).write(entry);
  }

  info(message, meta) {
    this._write('app.log', 'INFO', message, meta);
  }

  warn(message, meta) {
    this._write('app.log', 'WARN', message, meta);
  }

  error(message, meta) {
    this._write('app.log', 'ERROR', message, meta);
  }

  // Download-specific logging — separate file for easy tailing
  download(event, meta) {
    this._write('downloads.log', 'INFO', event, meta);
  }

  downloadError(event, meta) {
    this._write('downloads.log', 'ERROR', event, meta);
  }

  close() {
    for (const stream of Object.values(this._streams)) {
      stream.end();
    }
  }
}

module.exports = Logger;
