const express = require('express');
const FileUtils = require('../utils/fileUtils');

function createFolderRoutes(baseDir) {
  const router = express.Router();

  // Get folder structure (only folders)
  router.get('/', (req, res) => {
    const basePath = req.query.path || '';
    
    try {
      const result = FileUtils.getFolderStructure(baseDir, basePath);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // List directory contents (files and folders)
  router.get('/list', (req, res) => {
    const basePath = req.query.path || '';
    
    try {
      const result = FileUtils.listDirectory(baseDir, basePath);
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

  // Delete file or folder
  router.delete('/item', (req, res) => {
    const { itemPath } = req.body;
    
    if (!itemPath) {
      return res.status(400).json({ error: 'Item path is required' });
    }
    
    try {
      FileUtils.deleteItem(baseDir, itemPath);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Rename file or folder
  router.post('/rename', (req, res) => {
    const { itemPath, newName } = req.body;
    
    if (!itemPath || !newName) {
      return res.status(400).json({ error: 'Item path and new name are required' });
    }
    
    try {
      const newPath = FileUtils.renameItem(baseDir, itemPath, newName);
      res.json({ success: true, newPath });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Move file or folder
  router.post('/move', (req, res) => {
    const { sourcePath, destinationPath } = req.body;
    
    if (!sourcePath || destinationPath === undefined) {
      return res.status(400).json({ error: 'Source and destination paths are required' });
    }
    
    try {
      const newPath = FileUtils.moveItem(baseDir, sourcePath, destinationPath || '');
      res.json({ success: true, newPath });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createFolderRoutes;
