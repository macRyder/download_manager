const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const config = require('./config/config.js');
const WebSocketService = require('./services/websocketService.js');
const DownloadManager = require('./services/downloadManager.js');
const createFolderRoutes = require('./routes/folderRoutes.js');
const createDownloadRoutes = require('./routes/downloadRoutes.js');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize services
const wsService = new WebSocketService(config.WS_PORT);
const downloadManager = new DownloadManager(
  config.BASE_DOWNLOAD_DIR,
  wsService,
  config
);

// Routes
app.use('/api/folders', createFolderRoutes(config.BASE_DOWNLOAD_DIR));
app.use('/api/download', createDownloadRoutes(downloadManager));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    activeDownloads: downloadManager.getDownloadCount() 
  });
});

// Start server
app.listen(config.PORT, '0.0.0.0', () => {
  console.log(`Download Manager Backend running on port ${config.PORT}`);
  console.log(`WebSocket server running on port ${config.WS_PORT}`);
  console.log(`Base download directory: ${config.BASE_DOWNLOAD_DIR}`);
});
