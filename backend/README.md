# Download Manager - Backend

Node.js/Express server for the Download Manager application. Handles file downloads, folder management, and real-time progress updates via WebSocket.

## Overview

The backend provides REST APIs for download management and file operations, with WebSocket support for real-time progress tracking. It manages actual file downloads and file system operations.

## Features

### Download Management
- ✅ Support for multiple concurrent downloads
- ✅ Multi-connection download support
- ✅ Real-time progress tracking
- ✅ Download cancellation
- ✅ Error handling and retry logic
- ✅ Download metadata storage
- ✅ Bandwidth monitoring

### File Management
- ✅ Create folders
- ✅ List directory contents
- ✅ Rename files and folders
- ✅ Delete files and folders
- ✅ Move files and folders
- ✅ Directory traversal with validation
- ✅ Path security checks

### Real-time Updates
- ✅ WebSocket server for live progress
- ✅ Event broadcasting to clients
- ✅ Download state synchronization

## Project Structure

```
backend/
├── README.md                 # This file
├── package.json              # Dependencies
├── server.js                 # Main server file
├── config/
│   └── config.js            # Configuration settings
├── routes/
│   ├── downloadRoutes.js     # Download API endpoints
│   └── folderRoutes.js       # Folder management endpoints
├── services/
│   ├── downloadManager.js    # Download logic
│   └── websocketService.js   # WebSocket management
└── utils/
    └── fileUtils.js         # File system utilities
```

## Installation

### Prerequisites
- **Node.js** v14 or higher
- **npm** v6 or higher
- **Disk space** for downloaded files

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure settings**
   
   Edit `config/config.js`:
   ```javascript
   module.exports = {
     baseDir: '/path/to/downloads',  // Base download directory
     port: 5000,                      // HTTP server port
     wsPort: 5001,                    // WebSocket server port
     maxConnections: 32,              // Max concurrent connections per download
     timeout: 300000                  // Download timeout (ms)
   };
   ```

3. **Create download directory**
   ```bash
   mkdir -p /path/to/downloads
   chmod 755 /path/to/downloads
   ```

## Running the Server

### Development
```bash
npm start
```

Server will start on:
- HTTP: http://localhost:5000
- WebSocket: ws://localhost:5001

### Production
```bash
npm start
```

For production, use a process manager like PM2:
```bash
npm install -g pm2
pm2 start server.js --name "download-manager"
pm2 save
pm2 startup
```

## API Endpoints

### Download Management

#### POST /api/download
Start a new download

**Request:**
```json
{
  "url": "https://example.com/file.zip",
  "folder": "downloads/archive",
  "connections": 4,
  "name": "Optional custom name"
}
```

**Response:**
```json
{
  "success": true,
  "id": "unique-download-id",
  "filename": "file.zip",
  "download": {
    "id": "unique-download-id",
    "filename": "file.zip",
    "url": "https://example.com/file.zip",
    "status": "pending",
    "progress": 0,
    "speed": 0,
    "eta": 0,
    "folder": "downloads/archive"
  }
}
```

#### GET /api/downloads
Get all downloads

**Response:**
```json
[
  {
    "id": "unique-download-id",
    "filename": "file.zip",
    "url": "https://example.com/file.zip",
    "status": "downloading|completed|cancelled|error",
    "progress": 0-100,
    "speed": "bytes/sec",
    "eta": "seconds",
    "folder": "path/to/folder",
    "error": "Error message if status is error"
  }
]
```

#### DELETE /api/download/:id
Cancel a download

**Response:**
```json
{
  "success": true,
  "message": "Download cancelled"
}
```

### Folder Management

#### GET /api/folders?path=folder/path
Get folder structure (only folders)

**Response:**
```json
{
  "folders": [
    {
      "name": "folder-name",
      "path": "relative/path"
    }
  ],
  "currentPath": "relative/path"
}
```

#### GET /api/folders/list?path=folder/path
List directory contents (files and folders)

**Response:**
```json
{
  "items": [
    {
      "name": "filename.txt",
      "path": "relative/path/filename.txt",
      "isDirectory": false
    },
    {
      "name": "folder-name",
      "path": "relative/path/folder-name",
      "isDirectory": true
    }
  ],
  "currentPath": "relative/path"
}
```

#### POST /api/folders
Create a new folder

**Request:**
```json
{
  "folderName": "new-folder",
  "parentPath": "parent/path"
}
```

**Response:**
```json
{
  "success": true,
  "path": "parent/path/new-folder"
}
```

#### DELETE /api/folders/item
Delete a file or folder

**Request:**
```json
{
  "itemPath": "path/to/item"
}
```

**Response:**
```json
{
  "success": true
}
```

#### POST /api/folders/rename
Rename a file or folder

**Request:**
```json
{
  "itemPath": "path/to/item",
  "newName": "new-name"
}
```

**Response:**
```json
{
  "success": true,
  "newPath": "path/to/new-name"
}
```

#### POST /api/folders/move
Move a file or folder

**Request:**
```json
{
  "sourcePath": "path/to/source",
  "destinationPath": "path/to/destination"
}
```

**Response:**
```json
{
  "success": true,
  "newPath": "path/to/destination/source-name"
}
```

## WebSocket Events

### Client → Server
No outgoing messages. Server broadcasts to all connected clients.

### Server → Client
The server sends JSON events to all connected clients:

```javascript
{
  "type": "download_started",
  "download": { /* download object */ }
}

{
  "type": "download_progress",
  "id": "download-id",
  "progress": 45,
  "speed": "2.5MB/s",
  "eta": 120
}

{
  "type": "download_complete",
  "id": "download-id",
  "status": "completed",
  "error": null
}

{
  "type": "download_cancelled",
  "id": "download-id"
}
```

## Core Modules

### server.js
Main entry point that:
- Initializes Express server
- Sets up WebSocket server
- Configures CORS
- Mounts routes
- Handles errors

### config/config.js
Configuration settings:
- Base download directory
- Server ports
- Connection limits
- Timeouts
- Other preferences

### services/downloadManager.js
Download logic:
- Create downloads
- Manage progress
- Handle cancellation
- Store metadata
- Broadcast updates

### services/websocketService.js
WebSocket management:
- Client connections
- Event broadcasting
- Connection handling
- Cleanup

### routes/downloadRoutes.js
Download API endpoints:
- Start download
- Get downloads
- Cancel download

### routes/folderRoutes.js
Folder API endpoints:
- List folders
- Create folder
- Delete item
- Rename item
- Move item

### utils/fileUtils.js
File system utilities:
- Get folder structure
- List directory
- Create folder
- Delete safely
- Rename safely
- Move safely

## Error Handling

### HTTP Status Codes
- `200` - Success
- `400` - Bad request (validation error)
- `404` - Not found
- `500` - Server error

### Error Response Format
```json
{
  "error": "Descriptive error message"
}
```

### Logging
Errors are logged to:
- Console (development)
- Log files (production - if configured)

## Security Considerations

### Path Validation
- All file paths validated against base directory
- Prevents directory traversal attacks
- Validates file ownership

### Input Validation
- URL format validation
- File/folder name validation
- Path traversal prevention
- Size limits

### File Operations
- Safe delete operations
- Atomic move/rename
- Permission checks

## Performance

### Optimization
- Streaming file downloads
- Efficient progress calculation
- Connection pooling
- Memory-efficient operations

### Scaling
- Support for concurrent downloads
- Configurable connection limits
- Bandwidth management ready
- Load balancer compatible

## Dependencies

### Main Dependencies
- **express** (^4.x) - Web framework
- **ws** (^8.x) - WebSocket server
- **axios** (^1.x) - HTTP client for downloads

### Dev Dependencies
- Nodemon (for auto-restart during development)

## Scripts

```bash
npm start        # Start server
npm run dev      # Start with nodemon
npm test         # Run tests (if available)
```

## Environment Variables

Create `.env` file (optional):
```
PORT=5000
WS_PORT=5001
BASE_DIR=/path/to/downloads
NODE_ENV=production
```

Load with:
```bash
npm install dotenv
```

Use in code:
```javascript
require('dotenv').config();
const port = process.env.PORT || 5000;
```

## Database Integration (Future)

If adding database:
1. Install driver (MongoDB, PostgreSQL, etc.)
2. Create models for downloads
3. Add persistence layer
4. Update services to use database

## Authentication (Future)

When implementing authentication:
1. Add JWT middleware
2. Verify user ownership of downloads
3. Restrict folder access per user
4. Add rate limiting

## Deployment

### Docker
Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000 5001
CMD ["npm", "start"]
```

### Systemd Service
Create `/etc/systemd/system/download-manager.service`:
```ini
[Unit]
Description=Download Manager Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/download-manager/backend
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Nginx Reverse Proxy
```nginx
upstream download_api {
  server localhost:5000;
}

upstream download_ws {
  server localhost:5001;
}

server {
  listen 80;
  server_name downloads.example.com;

  # API routes
  location /api/ {
    proxy_pass http://download_api;
    proxy_set_header Host $host;
  }

  # WebSocket
  location /ws {
    proxy_pass http://download_ws;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000
# Kill process
kill -9 <PID>
```

### Permission Denied on Download Directory
```bash
chmod 755 /path/to/downloads
chown -R www-data:www-data /path/to/downloads
```

### WebSocket Connection Refused
- Check firewall allows port 5001
- Verify server is running
- Check client URL configuration
- Review logs for errors

### Downloads Not Saving
- Check disk space
- Verify directory permissions
- Check path in config
- Review error logs

### Memory Leak on Large Downloads
- Monitor process memory
- Check for event listener cleanup
- Review connection handling
- Update Node.js version

## Monitoring

### Health Check Endpoint (Future)
```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});
```

### Metrics (Future)
- Active downloads count
- Total downloaded bytes
- Average download speed
- Server uptime

## Logging

### Current
- Console output in development
- Error messages to clients

### Future
- File-based logging
- Log rotation
- Structured logging (JSON)
- Sentry integration

## Testing

### Unit Tests (Future)
```bash
npm test
```

### Integration Tests
Test API endpoints with:
- Sample URLs
- Invalid inputs
- Edge cases

## Contributing

1. Follow code style
2. Test changes thoroughly
3. Update documentation
4. Handle errors properly
5. Create pull requests

## License

MIT License - See main README.md

## Related Documentation

- [Frontend README](../frontend/README.md)
- [Main README](../README.md)

---

**Made with ❤️ by the Download Manager Team**
