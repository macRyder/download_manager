const express = require('express');

function createDownloadRoutes(downloadManager) {
  const router = express.Router();

  // Start download
  router.post('/', (req, res) => {
    const { url, folder, connections, name } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    try {
      const result = downloadManager.createDownload(url, folder, connections, name);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all downloads
  router.get('/', (req, res) => {
    const downloadList = downloadManager.getDownloads();
    res.json(downloadList);
  });

  // Cancel download
  router.delete('/:id', (req, res) => {
    const { id } = req.params;
    
    try {
      const result = downloadManager.cancelDownload(id);
      res.json(result);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createDownloadRoutes;
