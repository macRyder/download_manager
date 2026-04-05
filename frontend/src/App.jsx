import React, { useState } from 'react';
import './App.css';
import DownloadForm from './components/DownloadForm';
import DownloadList from './components/DownloadList';
import { useDownloads } from './hooks/useDownloads';
import { folderApi } from './services/api';

function App() {
  const { downloads, isLoading, startDownload, cancelDownload, retryDownload, removeDownload } = useDownloads();
  const [currentFolder, setCurrentFolder] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const createFolder = async (folderName, parentPath) => {
    try {
      await folderApi.create(folderName, parentPath);
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('Failed to create folder: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="App">
      <header className="App-header" data-modal-open={isModalOpen}>
        <h1>Download Manager</h1>
        <p>Server-side downloader with real-time progress</p>
      </header>

      <div className="container" data-modal-open={isModalOpen}>
        <DownloadForm
          onSubmit={startDownload}
          currentFolder={currentFolder}
          onFolderChange={setCurrentFolder}
          onCreateFolder={createFolder}
          isModalOpen={isModalOpen}
          onModalOpen={setIsModalOpen}
        />

        <DownloadList
          downloads={downloads}
          onCancel={cancelDownload}
          onRetry={retryDownload}
          onRemove={removeDownload}
          isLoading={isLoading}
          isModalOpen={isModalOpen}
        />
      </div>
    </div>
  );
}

export default App;
