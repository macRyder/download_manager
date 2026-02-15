import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import DownloadForm from './components/DownloadForm';
import DownloadList from './components/DownloadList';
import FolderManager from './components/FolderManager';

const API_BASE = 'http://192.168.1.10:5000/api'; // Replace with your server IP
const WS_URL = 'ws://192.168.1.10:5001'; // Replace with your server IP

function App() {
  const [downloads, setDownloads] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState('');
  const [ws, setWs] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Connect to WebSocket
  useEffect(() => {
    const websocket = new WebSocket(WS_URL);
    
    websocket.onopen = () => {
      console.log('WebSocket connected');
    };
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'download_started') {
        setDownloads(prev => {
          const updated = [...prev, data.download];
          localStorage.setItem('downloads', JSON.stringify(updated));
          return updated;
        });
      } else if (data.type === 'download_progress') {
        setDownloads(prev => {
          const updated = prev.map(d => 
            d.id === data.id 
              ? { ...d, progress: data.progress, speed: data.speed, eta: data.eta }
              : d
          );
          localStorage.setItem('downloads', JSON.stringify(updated));
          return updated;
        });
      } else if (data.type === 'download_complete') {
        setDownloads(prev => {
          const updated = prev.map(d => 
            d.id === data.id 
              ? { ...d, status: data.status, progress: 100, error: data.error }
              : d
          );
          localStorage.setItem('downloads', JSON.stringify(updated));
          return updated;
        });
      } else if (data.type === 'download_cancelled') {
        setDownloads(prev => {
          const updated = prev.map(d => 
            d.id === data.id 
              ? { ...d, status: 'cancelled' }
              : d
          );
          localStorage.setItem('downloads', JSON.stringify(updated));
          return updated;
        });
      }
    };
    
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    websocket.onclose = () => {
      console.log('WebSocket disconnected, reconnecting...');
      setTimeout(() => setWs(null), 3000);
    };
    
    setWs(websocket);
    
    return () => websocket.close();
  }, []);

  // Fetch folders
  useEffect(() => {
    fetchFolders(currentFolder);
  }, [currentFolder]);

  // Fetch initial downloads and restore from storage
  useEffect(() => {
    const loadDownloads = async () => {
      setIsLoading(true);
      try {
        // First, restore from localStorage if available
        const savedDownloads = localStorage.getItem('downloads');
        if (savedDownloads) {
          setDownloads(JSON.parse(savedDownloads));
        }
        
        // Then fetch fresh data from server
        const response = await axios.get(`${API_BASE}/downloads`);
        setDownloads(response.data);
        localStorage.setItem('downloads', JSON.stringify(response.data));
      } catch (error) {
        console.error('Error fetching downloads:', error);
        // Keep the localStorage data even if fetch fails
        const savedDownloads = localStorage.getItem('downloads');
        if (savedDownloads) {
          setDownloads(JSON.parse(savedDownloads));
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDownloads();
  }, []);

  const fetchFolders = async (path = '') => {
    try {
      const response = await axios.get(`${API_BASE}/folders`, {
        params: { path }
      });
      setFolders(response.data.folders);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const fetchDownloads = async () => {
    try {
      const response = await axios.get(`${API_BASE}/downloads`);
      setDownloads(response.data);
      localStorage.setItem('downloads', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error fetching downloads:', error);
    }
  };

  // Auto-refresh downloads every 5 seconds as a backup to WebSocket
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDownloads();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const startDownload = async (url, folder, connections, name = '') => {
    try {
      await axios.post(`${API_BASE}/download`, {
        url,
        folder,
        connections,
        name
      });
    } catch (error) {
      console.error('Error starting download:', error);
      const errorMsg = error.response?.data?.error || error.message;
      alert('Failed to start download: ' + errorMsg);
    }
  };

  const createFolder = async (folderName, parentPath) => {
    try {
      await axios.post(`${API_BASE}/folders`, {
        folderName,
        parentPath
      });
      fetchFolders(currentFolder);
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('Failed to create folder: ' + error.response?.data?.error || error.message);
    }
  };

  const cancelDownload = async (id) => {
    try {
      await axios.delete(`${API_BASE}/download/${id}`);
    } catch (error) {
      console.error('Error cancelling download:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>📥 Download Manager</h1>
        <p>Server-side downloader with real-time progress</p>
      </header>
      
      <div className="container">
        <div className="left-panel">
          <FolderManager
            folders={folders}
            currentFolder={currentFolder}
            onFolderChange={setCurrentFolder}
            onCreateFolder={createFolder}
          />
        </div>
        
        <div className="right-panel">
          <DownloadForm
            onSubmit={startDownload}
            currentFolder={currentFolder}
          />
          
          <DownloadList
            downloads={downloads}
            onCancel={cancelDownload}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
