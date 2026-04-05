class SSEService {
  constructor() {
    this.clients = new Set();
  }

  addClient(req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    // Send a heartbeat immediately so the client knows the connection is alive
    res.write(':\n\n');

    this.clients.add(res);

    req.on('close', () => {
      this.clients.delete(res);
    });
  }

  broadcast(data) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients) {
      client.write(payload);
    }
  }

  broadcastDownloadStarted(download) {
    this.broadcast({ type: 'download_started', download });
  }

  broadcastDownloadProgress(id, progress, speed, eta) {
    this.broadcast({ type: 'download_progress', id, progress, speed, eta });
  }

  broadcastDownloadComplete(id, status, error = null) {
    this.broadcast({ type: 'download_complete', id, status, error });
  }

  broadcastDownloadCancelled(id) {
    this.broadcast({ type: 'download_cancelled', id });
  }

  getClientCount() {
    return this.clients.size;
  }
}

module.exports = SSEService;
