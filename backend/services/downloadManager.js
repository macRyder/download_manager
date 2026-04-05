const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const FileUtils = require('../utils/fileUtils');

class DownloadManager {
  constructor(baseDir, sseService, config, databaseService, logger) {
    this.baseDir = baseDir;
    this.sse = sseService;
    this.config = config;
    this.db = databaseService;
    this.logger = logger;
    this.downloads = new Map(); // active + queued downloads in memory
    this.queueService = null;   // set via setQueueService after init
  }

  setQueueService(queueService) {
    this.queueService = queueService;
  }

  /**
   * Enqueue a download. Creates the download info, stores it as 'queued',
   * and adds a job to BullMQ. The worker will call processDownload().
   */
  createDownload(url, folder, connections, name = '') {
    const downloadId = uuidv4();
    const filename = FileUtils.extractFilename(url);

    const downloadInfo = {
      id: downloadId,
      url,
      folder,
      foldername: name,
      filename,
      name: name || filename,
      status: 'queued',
      progress: 0,
      speed: '0 KB/s',
      downloaded: '0 B',
      total: 'Unknown',
      eta: '-',
      startTime: Date.now(),
      method: 'aria2c',
      connections: connections || this.config.DEFAULT_CONNECTIONS,
    };

    this.downloads.set(downloadId, downloadInfo);
    this.logger.download('download_queued', {
      id: downloadId, url, folder, name: downloadInfo.name, connections
    });

    // Broadcast queued state to frontend
    this.sse.broadcast({
      type: 'download_queued',
      download: this._serializeDownload(downloadInfo),
    });

    // Enqueue into BullMQ
    this.queueService.addDownload({
      downloadId,
      url,
      folder,
      connections: downloadInfo.connections,
      name,
    }).then((jobId) => {
      downloadInfo.jobId = jobId;
    }).catch((err) => {
      this.logger.error('Failed to enqueue download', { id: downloadId, error: err.message });
      downloadInfo.status = 'failed';
      downloadInfo.error = 'Failed to enqueue: ' + err.message;
      this.sse.broadcastDownloadComplete(downloadId, 'failed', downloadInfo.error);
    });

    return { downloadId, message: 'Download queued' };
  }

  /**
   * Called by the BullMQ worker. Spawns aria2c and returns a promise
   * that resolves on success or rejects on failure (triggering retry).
   */
  processDownload(job) {
    const { downloadId, url, folder, connections, name } = job.data;

    return new Promise((resolve, reject) => {
      let downloadInfo = this.downloads.get(downloadId);

      // On retries, the download may already exist in memory
      if (!downloadInfo) {
        const filename = FileUtils.extractFilename(url);
        downloadInfo = {
          id: downloadId,
          url,
          folder,
          foldername: name,
          filename,
          name: name || filename,
          status: 'downloading',
          progress: 0,
          speed: '0 KB/s',
          downloaded: '0 B',
          total: 'Unknown',
          eta: '-',
          startTime: Date.now(),
          method: 'aria2c',
          connections,
        };
        this.downloads.set(downloadId, downloadInfo);
      }

      // Prepare download path and folder
      let downloadPath = path.join(this.baseDir, folder || '');
      let folderWasCreated = false;

      if (name) {
        downloadPath = path.join(downloadPath, name);
        if (!fs.existsSync(downloadPath)) {
          FileUtils.ensureDirectory(downloadPath);
          folderWasCreated = true;
        }
      } else {
        FileUtils.ensureDirectory(downloadPath);
      }

      downloadInfo.downloadPath = downloadPath;
      downloadInfo.folderWasCreated = folderWasCreated;

      // Save URL to file for aria2c
      const urlFilePath = path.join('/tmp', `${downloadId}.url`);
      fs.writeFileSync(urlFilePath, url);
      downloadInfo.urlFilePath = urlFilePath;

      // Update status
      downloadInfo.status = 'downloading';
      downloadInfo.progress = 0;
      downloadInfo.error = null;

      if (job.attemptsMade > 0) {
        this.logger.download('download_retrying', {
          id: downloadId, attempt: job.attemptsMade + 1, name: downloadInfo.name,
        });
        this.sse.broadcast({
          type: 'download_retrying',
          id: downloadId,
          attempt: job.attemptsMade + 1,
          maxAttempts: job.opts.attempts,
        });
      }

      this.sse.broadcastDownloadStarted(this._serializeDownload(downloadInfo));

      const numConnections = connections || this.config.DEFAULT_CONNECTIONS;
      const aria2cArgs = [
        '-x', numConnections.toString(),
        '-s', numConnections.toString(),
        '-d', downloadPath,
        '-o', downloadInfo.filename,
        '--console-log-level=notice',
        '--summary-interval=1',
        '-i', urlFilePath,
      ];

      const downloadProcess = spawn('aria2c', aria2cArgs);
      downloadInfo.process = downloadProcess;

      downloadProcess.stdout.on('data', (data) => {
        this.parseAria2cOutput(data.toString(), downloadInfo);
      });

      downloadProcess.stderr.on('data', (data) => {
        this.parseAria2cOutput(data.toString(), downloadInfo);
      });

      downloadProcess.on('close', (code) => {
        // Clean up temp URL file
        if (fs.existsSync(urlFilePath)) {
          fs.unlinkSync(urlFilePath);
        }

        if (code === 0) {
          downloadInfo.status = 'completed';
          downloadInfo.progress = 100;
          this.logger.download('download_completed', {
            id: downloadInfo.id, name: downloadInfo.name, total: downloadInfo.total
          });
          this._persistDownload(downloadInfo);
          this.sse.broadcastDownloadComplete(downloadInfo.id, 'completed', null);
          resolve();
        } else {
          const error = `Process exited with code ${code}`;
          downloadInfo.status = 'failed';
          downloadInfo.error = error;
          this.logger.downloadError('download_failed', {
            id: downloadInfo.id, name: downloadInfo.name,
            url: downloadInfo.url, error, exitCode: code
          });
          // Don't persist or broadcast yet — BullMQ may retry
          reject(new Error(error));
        }
      });
    });
  }

  /**
   * Called when all BullMQ retries are exhausted.
   */
  onDownloadFailed(job, err) {
    const { downloadId } = job.data;
    const downloadInfo = this.downloads.get(downloadId);
    if (downloadInfo) {
      downloadInfo.status = 'failed';
      downloadInfo.error = err.message;
      this._persistDownload(downloadInfo);
      this.sse.broadcastDownloadComplete(downloadId, 'failed', err.message);
    }
  }

  /**
   * Retry a failed download by re-enqueuing it.
   */
  async retryDownload(id) {
    const downloadInfo = this.downloads.get(id);
    if (!downloadInfo) {
      throw new Error('Download not found');
    }
    if (downloadInfo.status !== 'failed') {
      throw new Error('Only failed downloads can be retried');
    }

    downloadInfo.status = 'queued';
    downloadInfo.progress = 0;
    downloadInfo.error = null;
    downloadInfo.speed = '0 KB/s';
    downloadInfo.eta = '-';

    this.sse.broadcast({
      type: 'download_queued',
      download: this._serializeDownload(downloadInfo),
    });

    await this.queueService.addDownload({
      downloadId: id,
      url: downloadInfo.url,
      folder: downloadInfo.folder,
      connections: downloadInfo.connections,
      name: downloadInfo.foldername,
    });

    this.logger.download('download_retry_manual', { id, name: downloadInfo.name });
    return { success: true };
  }

  parseAria2cOutput(output, downloadInfo) {
    const progressMatch = output.match(/\((\d+)%\)/);
    if (progressMatch) {
      downloadInfo.progress = parseInt(progressMatch[1]);
    }

    const speedMatch = output.match(/DL:([\d.]+[KMG]iB)/);
    if (speedMatch) {
      downloadInfo.speed = speedMatch[1] + '/s';
    }

    const etaMatch = output.match(/ETA:([\dsmh]+)/);
    if (etaMatch) {
      downloadInfo.eta = etaMatch[1];
    }

    const sizeMatch = output.match(/([\d.]+[KMG]iB)\/([\d.]+[KMG]iB)/);
    if (sizeMatch) {
      downloadInfo.downloaded = sizeMatch[1];
      downloadInfo.total = sizeMatch[2];
    }

    this.sse.broadcastDownloadProgress(
      downloadInfo.id, downloadInfo.progress, downloadInfo.speed, downloadInfo.eta
    );
  }

  getDownloads() {
    const merged = new Map();

    // History from DB (lower priority)
    for (const row of this.db.getHistory()) {
      merged.set(row.id, {
        id: row.id,
        url: row.url,
        folder: row.folder,
        filename: row.filename,
        name: row.name,
        status: row.status,
        progress: row.status === 'completed' ? 100 : 0,
        speed: '0 B/s',
        eta: '-',
        downloaded: row.downloaded,
        total: row.total,
        method: row.method,
        startTime: row.started_at,
        finishedAt: row.finished_at,
        error: row.error
      });
    }

    // Active in-memory downloads (higher priority)
    for (const d of this.downloads.values()) {
      merged.set(d.id, this._serializeDownload(d));
    }

    return Array.from(merged.values());
  }

  _serializeDownload(d) {
    return {
      id: d.id,
      url: d.url,
      folder: d.folder,
      filename: d.filename,
      name: d.name,
      status: d.status,
      progress: d.progress,
      speed: d.speed,
      eta: d.eta,
      downloaded: d.downloaded,
      total: d.total,
      method: d.method,
      startTime: d.startTime,
      error: d.error,
    };
  }

  getHistory(limit = 100, offset = 0) {
    return this.db.getHistory(limit, offset);
  }

  removeFromHistory(id) {
    this.downloads.delete(id);
    return this.db.deleteDownload(id);
  }

  clearHistory() {
    this.db.clearHistory();
  }

  _persistDownload(downloadInfo) {
    try {
      this.db.saveDownload(downloadInfo);
    } catch (err) {
      this.logger.error('Failed to persist download', { id: downloadInfo.id, error: err.message });
    }
  }

  cancelDownload(id) {
    const download = this.downloads.get(id);
    if (!download) {
      throw new Error('Download not found');
    }

    if (download.process) {
      download.process.kill();
    }

    this._cleanupFiles(download);

    download.status = 'cancelled';
    this._persistDownload(download);
    this.sse.broadcastDownloadCancelled(id);
    this.logger.download('download_cancelled', { id, name: download.name });

    return { success: true };
  }

  _cleanupFiles(download) {
    if (download.urlFilePath && fs.existsSync(download.urlFilePath)) {
      try { fs.unlinkSync(download.urlFilePath); } catch (e) {
        this.logger.error('Failed to delete URL file', { error: e.message });
      }
    }

    if (download.foldername && download.downloadPath && download.folderWasCreated) {
      try {
        if (fs.existsSync(download.downloadPath)) {
          fs.rmSync(download.downloadPath, { recursive: true, force: true });
        }
      } catch (e) {
        this.logger.error('Failed to delete download folder', { path: download.downloadPath, error: e.message });
      }
    } else {
      const basePath = download.foldername && download.downloadPath
        ? download.downloadPath
        : path.join(this.baseDir, download.folder || '');
      const filePath = path.join(basePath, download.filename);
      const aria2Path = filePath + '.aria2';

      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        if (fs.existsSync(aria2Path)) fs.unlinkSync(aria2Path);
      } catch (e) {
        this.logger.error('Failed to delete download files', { path: filePath, error: e.message });
      }
    }
  }

  getDownloadCount() {
    return this.downloads.size;
  }

  async getQueueStatus() {
    if (!this.queueService) return null;
    return this.queueService.getQueueStatus();
  }
}

module.exports = DownloadManager;
