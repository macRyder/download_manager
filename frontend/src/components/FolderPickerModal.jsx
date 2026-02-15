import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/FolderPickerModal.css';

const API_BASE = 'http://192.168.1.10:5000/api';

function FolderPickerModal({ isOpen, onClose, onSelectFolder, currentFolder, onCreateFolder }) {
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

  const navigateIntoFolder = (folderPath) => {
    onSelectFolder(folderPath);
  };

  const navigateUp = () => {
    const parts = currentFolder.split('/').filter(Boolean);
    parts.pop();
    onSelectFolder(parts.join('/'));
  };

  const handleSelectCurrentFolder = (e) => {
    e.preventDefault();
    onClose();
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

  const getBreadcrumbs = () => {
    const parts = currentFolder.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Root', path: '' }];
    let fullPath = '';
    parts.forEach(part => {
      fullPath = fullPath ? `${fullPath}/${part}` : part;
      breadcrumbs.push({ name: part, path: fullPath });
    });
    return breadcrumbs;
  };

  const getIcon = (item) => {
    return item.isDirectory ? '📁' : '📄';
  };

  if (!isOpen) return null;

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="folder-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="picker-header">
          <h2>Manage & Select Folder</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="breadcrumb-section">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="breadcrumb-sep">/</span>}
              <button
                className={`breadcrumb-btn ${idx === breadcrumbs.length - 1 ? 'active' : ''}`}
                onClick={() => onSelectFolder(crumb.path)}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {moveMode && selectedForMove && (
          <div className="move-mode-banner">
            <p>📍 Moving: <strong>{selectedForMove.name}</strong></p>
            <button className="btn-action btn-move-dest" onClick={handleMoveHere}>
              📥 Move to Current Folder
            </button>
            <button className="btn-action btn-cancel" onClick={() => { setMoveMode(false); setSelectedForMove(null); }}>
              Cancel
            </button>
          </div>
        )}

        <div className="picker-body">
          {loading ? (
            <p className="loading">Loading...</p>
          ) : (
            <>
              {items.length === 0 ? (
                <p className="no-folders">This folder is empty</p>
              ) : (
                <div className="item-list">
                  {items.map(item => (
                    <div
                      key={item.path}
                      className={`item-card ${item.isDirectory ? 'folder-item' : 'file-item'}`}
                      onClick={() => item.isDirectory && !renaming && navigateIntoFolder(item.path)}
                    >
                      <div className="item-info">
                        <span className="item-icon">{getIcon(item)}</span>
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
                          <span className="item-name">{item.name}</span>
                        )}
                      </div>

                      <div className="item-actions" onClick={(e) => e.stopPropagation()}>
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
                              title="Rename"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn-action btn-move"
                              onClick={() => startMove(item)}
                              disabled={moveMode}
                              title="Move"
                            >
                              ↗️
                            </button>
                            <button
                              className="btn-action btn-delete"
                              onClick={() => deleteItem(item.path)}
                              disabled={moveMode}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="picker-section">
          {!showCreateForm ? (
            <button
              className="btn-secondary"
              onClick={() => setShowCreateForm(true)}
            >
              ➕ New Folder
            </button>
          ) : (
            <form onSubmit={handleCreateFolder} className="create-form">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                autoFocus
              />
              <button type="submit" className="btn-primary">Create</button>
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
            </form>
          )}
        </div>

        <div className="picker-footer">
          <button className="btn-secondary" onClick={onClose}>
            ✕ Cancel
          </button>
          <button className="btn-primary" onClick={handleSelectCurrentFolder}>
            ✓ Save to "{currentFolder || 'Root'}"
          </button>
        </div>
      </div>
    </div>
  );
}

export default FolderPickerModal;
