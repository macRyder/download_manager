const fs = require('fs');
const path = require('path');

class FileUtils {
  static getFolderStructure(basePath, relativePath = '') {
    const fullPath = path.join(basePath, relativePath);
    
    try {
      const items = fs.readdirSync(fullPath, { withFileTypes: true })
        .filter(item => item.isDirectory())
        .map(item => ({
          name: item.name,
          path: path.join(relativePath, item.name)
        }));
      
      return { folders: items, currentPath: relativePath };
    } catch (error) {
      throw new Error(`Failed to read directory: ${error.message}`);
    }
  }

  static createFolder(basePath, folderName, parentPath = '') {
    const fullPath = path.join(basePath, parentPath, folderName);
    
    if (fs.existsSync(fullPath)) {
      throw new Error('Folder already exists');
    }
    
    fs.mkdirSync(fullPath, { recursive: true });
    return path.join(parentPath, folderName);
  }

  static ensureDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  static extractFilename(url) {
    return url.split('/').pop().split('?')[0] || `download_${Date.now()}`;
  }
}

module.exports = FileUtils;
