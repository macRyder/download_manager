import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const client = axios.create({ baseURL: API_BASE });

export const downloadApi = {
  getAll: () => client.get('/download').then(r => r.data),
  start: (url, folder, connections, name) =>
    client.post('/download', { url, folder, connections, name }),
  cancel: (id) => client.delete(`/download/${id}`),
  retry: (id) => client.post(`/download/${id}/retry`),
  removeFromHistory: (id) => client.delete(`/download/history/${id}`),
  clearHistory: () => client.delete('/download/history'),
};

export const folderApi = {
  getTree: (folderPath) =>
    client.get('/folders', { params: { path: folderPath } }).then(r => r.data),
  list: (folderPath) =>
    client.get('/folders/list', { params: { path: folderPath } }).then(r => r.data),
  create: (folderName, parentPath) =>
    client.post('/folders', { folderName, parentPath }),
  deleteItem: (itemPath) =>
    client.delete('/folders/item', { data: { itemPath } }),
  rename: (itemPath, newName) =>
    client.post('/folders/rename', { itemPath, newName }),
  move: (sourcePath, destinationPath) =>
    client.post('/folders/move', { sourcePath, destinationPath }),
};

export const getEventsUrl = () => `${API_BASE}/events`;
