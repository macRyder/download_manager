import React, { useState } from 'react';
import axios from 'axios';
import FolderPickerModal from './FolderPickerModal';

const API_BASE = 'http://192.168.1.10:5000/api';

function DownloadForm({ onSubmit, currentFolder, onFolderChange, onCreateFolder }) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [connections, setConnections] = useState(4);
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url, currentFolder, connections, name);
      setUrl('');
      setName('');
    }
  };

  return (
    <>
      <div className="download-form">
        <h2>Add Download</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Download URL:</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/file.zip"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Display Name (Optional):</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Important File"
            />
            <small>Leave empty to use filename from URL</small>
          </div>
          
          <div className="form-group">
            <label>Connections:</label>
            <input
              type="number"
              value={connections}
              onChange={(e) => setConnections(parseInt(e.target.value))}
              min="1"
              max="32"
            />
            <small>More connections = faster download (if supported by server)</small>
          </div>
          
          <div className="form-group">
            <label>Save to:</label>
            <div className="save-to-section">
              <div className="current-folder-path">
                <span className="folder-icon">📁</span>
                <span className="folder-path">{currentFolder || '(Root)'}</span>
              </div>
              <button 
                type="button"
                className="btn-secondary btn-change-folder"
                onClick={() => setIsFolderPickerOpen(true)}
              >
                Browse...
              </button>
            </div>
          </div>
          
          <button type="submit" className="btn-primary btn-submit">
            Start Download
          </button>
        </form>
      </div>

      <FolderPickerModal
        isOpen={isFolderPickerOpen}
        onClose={() => setIsFolderPickerOpen(false)}
        onSelectFolder={onFolderChange}
        currentFolder={currentFolder}
        onCreateFolder={onCreateFolder}
      />
    </>
  );
}

export default DownloadForm;
