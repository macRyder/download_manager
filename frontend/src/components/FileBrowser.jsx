import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://192.168.1.9:5000/api';

function FileBrowser({ currentFolder }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [renaming, setRenaming] = useState(null);
  const [newName, setNewName] = useState('');
  const [selectedForMove, setSelectedForMove] = useState(null);
  const [moveMode, setMoveMode] = useState(false);

  useEffect(() => {
    loadContents();
  }, [currentFolder]);

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
        destinationPath: destinationPath || currentFolder || '.'
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
    
    // If moving to current folder, need to construct proper path
    const destPath = currentFolder || '';
    confirmMove(destPath);
  };

  const getIcon = (item) => {
    return item.isDirectory ? '📁' : '📄';
  };

  if (loading) {
    return <div className="file-browser"><p>Loading...</p></div>;
  }

  return (
    <div className="file-browser">
      <h2>📂 File Browser</h2>
      
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
      
      {items.length === 0 ? (
        <p className="no-items">This folder is empty</p>
      ) : (
        <div className="file-list">
          {items.map(item => (
            <div key={item.path} className={`file-item ${item.isDirectory ? 'folder' : 'file'}`}>
              <div className="file-info">
                <span className="file-icon">{getIcon(item)}</span>
                {renaming === item.path ? (
                  <div className="rename-input">
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
              
              <div className="file-actions">
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
                    {item.isDirectory && (
                      <button
                        className="btn-action btn-move"
                        onClick={() => startMove(item)}
                        disabled={moveMode}
                      >
                        ↗️ Move
                      </button>
                    )}
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
  );
}

export default FileBrowser;
