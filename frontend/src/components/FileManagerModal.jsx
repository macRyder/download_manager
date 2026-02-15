import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/FileManagerModal.css';

const API_BASE = 'http://192.168.1.10:5000/api';

function FileManagerModal({ isOpen, onClose, currentFolder, onFolderChange, onCreateFolder }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [renaming, setRenaming] = useState(null);
  const [newName, setNewName] = useState('');
  const [selectedForMove, setSelectedForMove] = useState(null);
  const [moveMode, setMoveMode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadContents();
    }
  }, [currentFolder, isOpen]);

  const loadContents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/folders/list`, {
        params: { path: currentFolder }
      });
      setItems(response.data.items);
    } catch (error) {
      console.error('Error loading contents:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (itemPath) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/folders/item`, {
        data: { itemPath }
      });
      loadContents();
    } catch (error) {
      alert('Error deleting item: ' + (error.response?.data?.error || error.message));
    }
  };

  const startRename = (item) => {
    setRenaming(item.path);
    setNewName(item.name);
  };

  const confirmRename = async () => {
    if (!newName.trim() || newName === '') {
      alert('Please enter a valid name');
      return;
    }

    try {
      await axios.post(`${API_BASE}/folders/rename`, {
        itemPath: renaming,
        newName: newName
      });
      setRenaming(null);
      loadContents();
    } catch (error) {
      alert('Error renaming item: ' + (error.response?.data?.error || error.message));
    }
  };

  const startMove = (item) => {
    setSelectedForMove(item);
    setMoveMode(true);
  };

  const confirmMove = async (destinationPath) => {
    if (!selectedForMove) return;

    try {
      await axios.post(`${API_BASE}/folders/move`, {
        sourcePath: selectedForMove.path,
        destinationPath: destinationPath || ''
      });
      setSelectedForMove(null);
      setMoveMode(false);
      loadContents();
    } catch (error) {
      alert('Error moving item: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleMoveHere = () => {
    if (!selectedForMove) return;
    confirmMove(currentFolder || '');
  };

  const handleCreateFolder = (e) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName, currentFolder);
      setNewFolderName('');
      setShowCreateForm(false);
      loadContents();
    }
  };

  const navigateUp = () => {
    const parts = currentFolder.split('/').filter(Boolean);
    parts.pop();
    onFolderChange(parts.join('/'));
  };

  const navigateIntoFolder = (folderPath) => {
    onFolderChange(folderPath);
  };

  const getIcon = (item) => {
    return item.isDirectory ? '📁' : '📄';
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📂 File Manager</h2>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="path-section">
            <div className="current-path">
              <strong>Current:</strong> /{currentFolder}
            </div>
            
            <div className="path-buttons">
              {currentFolder && (
                <button 
                  className="btn-secondary"
                  onClick={navigateUp}
                >
                  ⬆️ Go Up
                </button>
              )}
              
              <button 
                className="btn-secondary"
                onClick={() => onFolderChange('')}
              >
                🏠 Root
              </button>
            </div>
          </div>

          {moveMode && selectedForMove && (
            <div className="move-mode-banner">
              <p>📍 Moving: <strong>{selectedForMove.name}</strong></p>
              <button className="btn-action btn-move-dest" onClick={handleMoveHere}>
                📥 Move to Current Folder
              </button>
              <button className="btn-cancel" onClick={() => { setMoveMode(false); setSelectedForMove(null); }}>
                Cancel Move
              </button>
            </div>
          )}

          <div className="create-folder-section">
            {!showCreateForm ? (
              <button 
                className="btn-primary"
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

          {loading ? (
            <p className="loading">Loading...</p>
          ) : items.length === 0 ? (
            <p className="no-items">This folder is empty</p>
          ) : (
            <div className="file-list">
              {items.map(item => (
                <div 
                  key={item.path} 
                  className={`file-item ${item.isDirectory ? 'folder' : 'file'}`}
                  onClick={() => item.isDirectory && !renaming && navigateIntoFolder(item.path)}
                >
                  <div className="file-info">
                    <span className="file-icon">{getIcon(item)}</span>
                    {renaming === item.path ? (
                      <div className="rename-input" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          autoFocus
                        />
                        <button className="btn-confirm" onClick={confirmRename}>✓</button>
                        <button className="btn-cancel" onClick={() => setRenaming(null)}>✕</button>
                      </div>
                    ) : (
                      <span className="file-name">{item.name}</span>
                    )}
                  </div>
                  
                  <div className="file-actions" onClick={(e) => e.stopPropagation()}>
                    {moveMode && selectedForMove?.path !== item.path && item.isDirectory ? (
                      <button
                        className="btn-action btn-move-dest"
                        onClick={() => confirmMove(item.path)}
                      >
                        📥 Move Here
                      </button>
                    ) : (
                      <>
                        <button
                          className="btn-action btn-rename"
                          onClick={() => startRename(item)}
                          disabled={moveMode}
                        >
                          ✏️ Rename
                        </button>
                        <button
                          className="btn-action btn-move"
                          onClick={() => startMove(item)}
                          disabled={moveMode}
                        >
                          ↗️ Move
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => deleteItem(item.path)}
                          disabled={moveMode}
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FileManagerModal;
