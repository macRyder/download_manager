import React, { useState } from 'react';

function DownloadList({ downloads, onCancel, onRetry, onRemove, isLoading, isModalOpen }) {
  const [copiedId, setCopiedId] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4caf50';
      case 'downloading': return '#2196f3';
      case 'failed': return '#f44336';
      case 'cancelled': return '#ff9800';
      case 'queued': return '#9c27b0';
      case 'retrying': return '#ff5722';
      case 'starting': return '#607d8b';
      default: return '#9e9e9e';
    }
  };

  const getStatusLabel = (download) => {
    if (download.status === 'retrying' && download.attempt) {
      return `retrying (${download.attempt}/${download.maxAttempts})`;
    }
    return download.status;
  };

  const copyToClipboard = (text, downloadId) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(downloadId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const truncateUrl = (url, maxLength = 40) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  return (
    <div className="download-list" data-disabled={isModalOpen}>
      <h2>Downloads ({downloads.length})</h2>

      {isLoading && downloads.length === 0 && (
        <p className="loading-downloads">Loading downloads...</p>
      )}

      {!isLoading && downloads.length === 0 ? (
        <p className="no-downloads">No active downloads</p>
      ) : (
        <div className="downloads">
          {downloads.map(download => (
            <div key={download.id} className="download-item">
              <div className="download-header">
                <div className="download-filename">
                  <strong>{download.name || download.filename}</strong>
                  <span className="download-method">{download.method}</span>
                </div>
                <span
                  className="download-status"
                  style={{ color: getStatusColor(download.status) }}
                >
                  {getStatusLabel(download)}
                </span>
              </div>

              <div className="download-url" title={download.url}>
                <span className="url-text">{truncateUrl(download.url)}</span>
                <button
                  className="btn-copy"
                  onClick={() => copyToClipboard(download.url, download.id)}
                  title="Copy full URL"
                  disabled={isModalOpen}
                >
                  {copiedId === download.id ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="download-folder">
                {download.folder || '/'}
              </div>

              {(download.status === 'downloading' || download.status === 'retrying') && (
                <>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${download.progress}%` }}
                    >
                      {download.progress}%
                    </div>
                  </div>

                  <div className="download-stats">
                    <span>{download.speed}</span>
                    <span>ETA: {download.eta}</span>
                  </div>
                </>
              )}

              {download.status === 'queued' && (
                <div className="download-queued-msg">Waiting in queue...</div>
              )}

              {download.error && (
                <div className="download-error">
                  {download.error}
                </div>
              )}

              <div className="download-actions">
                {(download.status === 'downloading' || download.status === 'queued') && (
                  <button
                    className="btn-cancel"
                    onClick={() => onCancel(download.id)}
                    disabled={isModalOpen}
                  >
                    Cancel
                  </button>
                )}

                {download.status === 'failed' && (
                  <button
                    className="btn-retry"
                    onClick={() => onRetry(download.id)}
                    disabled={isModalOpen}
                  >
                    Retry
                  </button>
                )}

                {['completed', 'failed', 'cancelled'].includes(download.status) && (
                  <button
                    className="btn-remove"
                    onClick={() => onRemove(download.id)}
                    disabled={isModalOpen}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DownloadList;
