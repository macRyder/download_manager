const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const FileUtils = require('../utils/fileUtils');

class DownloadManager {
  constructor(baseDir, wsService, config) {
    this.baseDir = baseDir;
    this.wsService = wsService;
    this.config = config;
    this.downloads = new Map();
  }

  createDownload(url, folder, connections, name = '') {
    const downloadId = uuidv4();
    const fs = require('fs');
    
    // Create a folder with the name if provided
    let downloadPath = path.join(this.baseDir, folder || '');
    let folderWasCreated = false;
    
    if (name) {
      downloadPath = path.join(downloadPath, name);
      
      // Check if folder already exists
      if (!fs.existsSync(downloadPath)) {
        FileUtils.ensureDirectory(downloadPath);
        folderWasCreated = true;
      }
    } else {
      FileUtils.ensureDirectory(downloadPath);
    }
    
    // Save URL to file to handle long URLs
    const urlFilePath = path.join('/tmp', `${downloadId}.url`);
    fs.writeFileSync(urlFilePath, url);
    
    const filename = FileUtils.extractFilename(url);
    
    const downloadInfo = {
      id: downloadId,
      url,
      urlFilePath,
      folder,
      foldername: name,
      filename,
      name: name || filename, // Use custom name if provided, otherwise use filename
      status: 'starting',
      progress: 0,
      speed: '0 KB/s',
      downloaded: '0 B',
      total: 'Unknown',
      eta: 'Calculating...',
      startTime: Date.now(),
      method: 'aria2c',
      downloadPath, // Store the actual download path
      folderWasCreated // Track if folder was newly created
    };
    
    this.downloads.set(downloadId, downloadInfo);
    this.startAria2cDownload(downloadInfo, downloadPath, connections);
    
    return { downloadId, message: 'Download started' };
  }

  startAria2cDownload(downloadInfo, downloadPath, connections) {
    const numConnections = connections || this.config.DEFAULT_CONNECTIONS;
    
    // aria2c command with options
    const aria2cArgs = [
      '-x', numConnections.toString(),
      '-s', numConnections.toString(),
      '-d', downloadPath,
      '-o', downloadInfo.filename,
      '--console-log-level=notice',
      '--summary-interval=1',
      '-i', downloadInfo.urlFilePath  // Read URL from file to handle long URLs
    ];
    
    const downloadProcess = spawn('aria2c', aria2cArgs);
    
    downloadInfo.status = 'downloading';
    downloadInfo.process = downloadProcess;
    
    this.wsService.broadcastDownloadStarted(downloadInfo);
    
    // Parse aria2c output
    downloadProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);
      
      this.parseAria2cOutput(output, downloadInfo);
    });
    
    downloadProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.error(output);
      
      // aria2c outputs progress to stderr
      this.parseAria2cOutput(output, downloadInfo);
    });
    
    downloadProcess.on('close', (code) => {
      // Clean up temp URL file
      const fs = require('fs');
      if (fs.existsSync(downloadInfo.urlFilePath)) {
        fs.unlinkSync(downloadInfo.urlFilePath);
      }
      
      if (code === 0) {
        downloadInfo.status = 'completed';
        downloadInfo.progress = 100;
      } else {
        downloadInfo.status = 'failed';
        downloadInfo.error = `Process exited with code ${code}`;
      }
      
      this.wsService.broadcastDownloadComplete(
        downloadInfo.id,
        downloadInfo.status,
        downloadInfo.error
      );
    });
  }

  parseAria2cOutput(output, downloadInfo) {
    // aria2c format: [#03aa2e 1.2MiB/5.6MiB(21%) CN:4 DL:156KiB ETA:30s]
    
    // Extract progress percentage
    const progressMatch = output.match(/\((\d+)%\)/);
    if (progressMatch) {
      downloadInfo.progress = parseInt(progressMatch[1]);
    }
    
    // Extract download speed
    const speedMatch = output.match(/DL:([\d.]+[KMG]iB)/);
    if (speedMatch) {
      downloadInfo.speed = speedMatch[1] + '/s';
    }
    
    // Extract ETA
    const etaMatch = output.match(/ETA:([\dsmh]+)/);
    if (etaMatch) {
      downloadInfo.eta = etaMatch[1];
    }
    
    // Extract downloaded and total size
    const sizeMatch = output.match(/([\d.]+[KMG]iB)\/([\d.]+[KMG]iB)/);
    if (sizeMatch) {
      downloadInfo.downloaded = sizeMatch[1];
      downloadInfo.total = sizeMatch[2];
    }
    
    // Broadcast progress update
    this.wsService.broadcastDownloadProgress(
      downloadInfo.id,
      downloadInfo.progress,
      downloadInfo.speed,
      downloadInfo.eta
    );
  }

  getDownloads() {
    return Array.from(this.downloads.values()).map(d => ({
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
      method: d.method
    }));
  }

  cancelDownload(id) {
    const download = this.downloads.get(id);
    
    if (!download) {
      throw new Error('Download not found');
    }
    
    if (download.process) {
      download.process.kill();
    }
    
    const fs = require('fs');
    
    // Clean up temp URL file
    if (fs.existsSync(download.urlFilePath)) {
      try {
        fs.unlinkSync(download.urlFilePath);
      } catch (error) {
        console.error(`Error deleting URL file: ${error.message}`);
      }
    }
    
    // Delete the folder only if it was created by this download
    if (download.foldername && download.downloadPath && download.folderWasCreated) {
      try {
        if (fs.existsSync(download.downloadPath)) {
          // Remove directory recursively (only if we created it)
          fs.rmSync(download.downloadPath, { recursive: true, force: true });
          console.log(`Deleted folder: ${download.downloadPath}`);
        }
      } catch (error) {
        console.error(`Error deleting download folder: ${error.message}`);
      }
    } else if (download.foldername && download.downloadPath) {
      // If folder already existed, only delete the downloaded file
      try {
        const filePath = path.join(download.downloadPath, download.filename);
        const aria2Path = filePath + '.aria2';
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted file: ${filePath}`);
        }
        if (fs.existsSync(aria2Path)) {
          fs.unlinkSync(aria2Path);
          console.log(`Deleted file: ${aria2Path}`);
        }
      } catch (error) {
        console.error(`Error deleting download files: ${error.message}`);
      }
    } else {
      // If no folder name, just delete the individual files
      try {
        const downloadPath = path.join(this.baseDir, download.folder || '', download.filename);
        const aria2Path = downloadPath + '.aria2';
        
        if (fs.existsSync(downloadPath)) {
          fs.unlinkSync(downloadPath);
          console.log(`Deleted file: ${downloadPath}`);
        }
        if (fs.existsSync(aria2Path)) {
          fs.unlinkSync(aria2Path);
          console.log(`Deleted file: ${aria2Path}`);
        }
      } catch (error) {
        console.error(`Error deleting download files: ${error.message}`);
      }
    }
    
    download.status = 'cancelled';
    this.wsService.broadcastDownloadCancelled(id);
    
    return { success: true };
  }

  getDownloadCount() {
    return this.downloads.size;
  }
}

module.exports = DownloadManager;
