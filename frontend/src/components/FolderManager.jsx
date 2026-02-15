import React, { useState } from 'react';

function FolderManager({ folders, currentFolder, onFolderChange, onCreateFolder }) {
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateFolder = (e) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName, currentFolder);
      setNewFolderName('');
      setShowCreateForm(false);
    }
  };

  const navigateUp = () => {
    const parts = currentFolder.split('/').filter(Boolean);
    parts.pop();
    onFolderChange(parts.join('/'));
  };

  return (
    <div className="folder-manager">
      <h2>Folders</h2>
      
      <div className="current-path">
        <strong>Current:</strong> /{currentFolder}
      </div>
      
      {currentFolder && (
        <button 
          className="btn-secondary btn-block"
          onClick={navigateUp}
        >
          ⬆️ Go Up
        </button>
      )}
      
      <button 
        className="btn-secondary btn-block"
        onClick={() => onFolderChange('')}
      >
        🏠 Root
      </button>
      
      <div className="folder-list">
        {folders.map(folder => (
          <div 
            key={folder.path}
            className="folder-item"
            onClick={() => onFolderChange(folder.path)}
          >
            📁 {folder.name}
          </div>
        ))}
      </div>
      
      {!showCreateForm ? (
        <button 
          className="btn-primary btn-block"
          onClick={() => setShowCreateForm(true)}
        >
          ➕ New Folder
        </button>
      ) : (
        <form onSubmit={handleCreateFolder} className="create-folder-form">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            autoFocus
          />
          <div className="button-group">
            <button type="submit" className="btn-primary">
              Create
            </button>
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => {
                setShowCreateForm(false);
                setNewFolderName('');
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default FolderManager;
