const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const config = require('./config/config.js');
const Logger = require('./services/logger.js');
const DatabaseService = require('./services/database.js');
const SSEService = require('./services/sseService.js');
const QueueService = require('./services/queueService.js');
const DownloadManager = require('./services/downloadManager.js');
const createFolderRoutes = require('./routes/folderRoutes.js');
const createDownloadRoutes = require('./routes/downloadRoutes.js');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize services
const logDir = path.join(__dirname, 'logs');
const logger = new Logger(logDir);

const dbPath = path.join(__dirname, 'data', 'downloads.db');
fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
const databaseService = new DatabaseService(dbPath);

const sseService = new SSEService();
const downloadManager = new DownloadManager(
  config.BASE_DOWNLOAD_DIR,
  sseService,
  config,
  databaseService,
  logger
);

// Initialize queue — worker calls downloadManager.processDownload()
const queueService = new QueueService(
  config,
  (job) => downloadManager.processDownload(job),
  (job, err) => downloadManager.onDownloadFailed(job, err),
  logger
);
downloadManager.setQueueService(queueService);

// SSE endpoint — clients connect here for real-time updates
app.get('/api/events', (req, res) => {
  sseService.addClient(req, res);
});

// Routes
app.use('/api/folders', createFolderRoutes(config.BASE_DOWNLOAD_DIR));
app.use('/api/download', createDownloadRoutes(downloadManager));

// Health check
app.get('/api/health', async (req, res) => {
  const queueStatus = await downloadManager.getQueueStatus();
  res.json({
    status: 'ok',
    activeDownloads: downloadManager.getDownloadCount(),
    connectedClients: sseService.getClientCount(),
    database: databaseService.getStats(),
    queue: queueStatus,
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Server shutting down');
  await queueService.close();
  logger.close();
  databaseService.close();
  process.exit(0);
});

// Start server
app.listen(config.PORT, '0.0.0.0', () => {
  logger.info('Server started', { port: config.PORT, downloadDir: config.BASE_DOWNLOAD_DIR });
  console.log(`Download Manager running on port ${config.PORT}`);
  console.log(`SSE endpoint: /api/events`);
  console.log(`Database: ${dbPath}`);
  console.log(`Logs: ${logDir}`);
  console.log(`Queue: concurrency=${config.queue.concurrency}, retries=${config.queue.retries}`);
  console.log(`Base download directory: ${config.BASE_DOWNLOAD_DIR}`);
});
