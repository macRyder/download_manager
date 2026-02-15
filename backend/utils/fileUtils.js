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

  static listDirectory(basePath, relativePath = '') {
    const fullPath = path.join(basePath, relativePath);
    
    try {
      const items = fs.readdirSync(fullPath, { withFileTypes: true })
        .map(item => ({
          name: item.name,
          path: path.join(relativePath, item.name),
          isDirectory: item.isDirectory()
        }));
      
      return { items, currentPath: relativePath };
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

  static deleteItem(basePath, itemPath) {
    const fullPath = path.join(basePath, itemPath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error('Item does not exist');
    }

    if (fs.statSync(fullPath).isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(fullPath);
    }
  }

  static renameItem(basePath, itemPath, newName) {
    const fullPath = path.join(basePath, itemPath);
    const parentPath = path.dirname(fullPath);
    const newFullPath = path.join(parentPath, newName);

    if (!fs.existsSync(fullPath)) {
      throw new Error('Item does not exist');
    }

    if (fs.existsSync(newFullPath)) {
      throw new Error('An item with this name already exists');
    }

    fs.renameSync(fullPath, newFullPath);
    
    const relativeItemPath = path.relative(basePath, itemPath.includes('/') ? path.join(basePath, itemPath) : itemPath);
    const newRelativePath = path.join(path.dirname(relativeItemPath || '.'), newName);
    
    return newRelativePath;
  }

  static moveItem(basePath, sourcePath, destinationPath) {
    const fullSourcePath = path.join(basePath, sourcePath);
    const fullDestPath = path.join(basePath, destinationPath);
    const itemName = path.basename(sourcePath);
    const finalDestPath = path.join(fullDestPath, itemName);

    if (!fs.existsSync(fullSourcePath)) {
      throw new Error('Source item does not exist');
    }

    if (!fs.existsSync(fullDestPath) || !fs.statSync(fullDestPath).isDirectory()) {
      throw new Error('Destination folder does not exist');
    }

    if (fs.existsSync(finalDestPath)) {
      throw new Error('An item with this name already exists in destination');
    }

    fs.renameSync(fullSourcePath, finalDestPath);
    
    const newRelativePath = path.join(destinationPath, itemName);
    return newRelativePath;
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
