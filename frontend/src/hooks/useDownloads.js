import { useState, useEffect, useCallback, useRef } from 'react';
import { downloadApi } from '../services/api';
import { useSSE } from './useSSE';

const STORAGE_KEY = 'dm_downloads';

function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveToStorage(downloads) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(downloads));
  } catch {
    // storage full or unavailable — ignore
  }
}

export function useDownloads() {
  const [downloads, setDownloads] = useState(() => loadFromStorage());
  const [isLoading, setIsLoading] = useState(true);
  const downloadsRef = useRef(downloads);

  // Keep ref in sync and persist to localStorage on every change
  useEffect(() => {
    downloadsRef.current = downloads;
    saveToStorage(downloads);
  }, [downloads]);

  // Fetch initial data from backend, merge with localStorage
  useEffect(() => {
    setIsLoading(true);
    downloadApi.getAll()
      .then((serverDownloads) => {
        // Server is source of truth — merge: server wins for known IDs,
        // keep local-only entries that are still active (queued/downloading)
        const serverMap = new Map(serverDownloads.map(d => [d.id, d]));
        const localOnly = downloadsRef.current.filter(
          d => !serverMap.has(d.id) && ['queued', 'downloading'].includes(d.status)
        );
        setDownloads([...serverDownloads, ...localOnly]);
      })
      .catch(err => console.error('Error fetching downloads:', err))
      .finally(() => setIsLoading(false));
  }, []);

  // Handle real-time SSE events
  useSSE((data) => {
    switch (data.type) {
      case 'download_queued':
        setDownloads(prev => {
          const exists = prev.some(d => d.id === data.download.id);
          return exists
            ? prev.map(d => d.id === data.download.id ? { ...d, ...data.download } : d)
            : [...prev, data.download];
        });
        break;
      case 'download_started':
        setDownloads(prev => {
          const exists = prev.some(d => d.id === data.download.id);
          return exists
            ? prev.map(d => d.id === data.download.id ? { ...d, ...data.download, status: 'downloading' } : d)
            : [...prev, { ...data.download, status: 'downloading' }];
        });
        break;
      case 'download_progress':
        setDownloads(prev =>
          prev.map(d =>
            d.id === data.id
              ? { ...d, status: 'downloading', progress: data.progress, speed: data.speed, eta: data.eta }
              : d
          )
        );
        break;
      case 'download_complete':
        setDownloads(prev =>
          prev.map(d =>
            d.id === data.id
              ? { ...d, status: data.status, progress: data.status === 'completed' ? 100 : d.progress, error: data.error }
              : d
          )
        );
        break;
      case 'download_cancelled':
        setDownloads(prev =>
          prev.map(d =>
            d.id === data.id ? { ...d, status: 'cancelled' } : d
          )
        );
        break;
      case 'download_retrying':
        setDownloads(prev =>
          prev.map(d =>
            d.id === data.id
              ? { ...d, status: 'retrying', progress: 0, error: null, attempt: data.attempt, maxAttempts: data.maxAttempts }
              : d
          )
        );
        break;
    }
  });

  const startDownload = useCallback(async (url, folder, connections, name = '') => {
    await downloadApi.start(url, folder, connections, name);
  }, []);

  const cancelDownload = useCallback(async (id) => {
    await downloadApi.cancel(id);
  }, []);

  const retryDownload = useCallback(async (id) => {
    await downloadApi.retry(id);
  }, []);

  const removeDownload = useCallback(async (id) => {
    await downloadApi.removeFromHistory(id);
    setDownloads(prev => prev.filter(d => d.id !== id));
  }, []);

  return { downloads, isLoading, startDownload, cancelDownload, retryDownload, removeDownload };
}
