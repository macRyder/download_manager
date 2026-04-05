const express = require('express');

function createDownloadRoutes(downloadManager) {
  const router = express.Router();

  // Start download (enqueues into BullMQ)
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

  // Get all downloads (active + history merged)
  router.get('/', (req, res) => {
    const downloadList = downloadManager.getDownloads();
    res.json(downloadList);
  });

  // Get download history from DB
  router.get('/history', (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    res.json(downloadManager.getHistory(limit, offset));
  });

  // Clear all history — must be before /:id to avoid matching "history" as an id
  router.delete('/history', (req, res) => {
    downloadManager.clearHistory();
    res.json({ success: true });
  });

  // Remove a single entry from history
  router.delete('/history/:id', (req, res) => {
    const { id } = req.params;
    downloadManager.removeFromHistory(id);
    res.json({ success: true });
  });

  // Retry a failed download
  router.post('/:id/retry', async (req, res) => {
    try {
      const result = await downloadManager.retryDownload(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
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
