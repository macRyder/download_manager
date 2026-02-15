const WebSocket = require('ws');

class WebSocketService {
  constructor(port) {
    this.wss = new WebSocket.Server({ port });
    this.setupConnectionHandlers();
  }

  setupConnectionHandlers() {
    this.wss.on('connection', (ws) => {
      console.log('New WebSocket client connected');
      
      ws.on('close', () => {
        console.log('WebSocket client disconnected');
      });
    });
  }

  broadcast(data) {
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  broadcastDownloadStarted(download) {
    this.broadcast({ type: 'download_started', download });
  }

  broadcastDownloadProgress(id, progress, speed, eta) {
    this.broadcast({ 
      type: 'download_progress', 
      id,
      progress,
      speed,
      eta
    });
  }

  broadcastDownloadComplete(id, status, error = null) {
    this.broadcast({ 
      type: 'download_complete', 
      id,
      status,
      error
    });
  }

  broadcastDownloadCancelled(id) {
    this.broadcast({ type: 'download_cancelled', id });
  }
}

module.exports = WebSocketService;
