const express = require('express');
const FileUtils = require('../utils/fileUtils');

function createFolderRoutes(baseDir) {
  const router = express.Router();

  // Get folder structure
  router.get('/', (req, res) => {
    const basePath = req.query.path || '';
    
    try {
      const result = FileUtils.getFolderStructure(baseDir, basePath);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create new folder
  router.post('/', (req, res) => {
    const { folderName, parentPath } = req.body;
    
    if (!folderName) {
      return res.status(400).json({ error: 'Folder name is required' });
    }
    
    try {
      const newPath = FileUtils.createFolder(baseDir, folderName, parentPath);
      res.json({ success: true, path: newPath });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createFolderRoutes;
