import React, { useState } from 'react';

function DownloadForm({ onSubmit, currentFolder }) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [connections, setConnections] = useState(4);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url, currentFolder, connections, name);
      setUrl('');
      setName('');
    }
  };

  return (
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
          <input
            type="text"
            value={currentFolder || '/'}
            readOnly
            style={{ backgroundColor: '#f0f0f0' }}
          />
        </div>
        
        <button type="submit" className="btn-primary">
          Start Download
        </button>
      </form>
    </div>
  );
}

export default DownloadForm;
