# Download Manager

A full-stack web application for managing file downloads with real-time progress tracking, folder management, and file operations. Built with React (frontend) and Node.js/Express (backend).

## Features

### Download Management
- 🌐 **Download URLs** - Support for multiple concurrent downloads
- ⚡ **Multi-connection Downloads** - Configurable parallel connections for faster downloads
- 📊 **Real-time Progress** - WebSocket-based live progress updates
- 🎯 **Custom Display Names** - Set custom names for downloads
- 📁 **Folder Selection** - Organize downloads into folders
- ⏸️ **Cancel Downloads** - Stop downloads at any time
- 💾 **Persistent Storage** - Downloads saved to localStorage for session recovery

### File & Folder Management
- 📂 **Folder Navigation** - Easy folder structure navigation
- ➕ **Create Folders** - Create new folders anywhere in the directory
- ✏️ **Rename** - Rename both files and folders
- 🗑️ **Delete** - Delete files and folders
- ↗️ **Move** - Move files and folders between locations
- 🔄 **Move Mode** - Visual indicator for items being moved

### User Interface
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🎨 **Clean UI** - Intuitive and user-friendly interface
- 📍 **Breadcrumb Navigation** - Visual path tracking
- 🔄 **Real-time Updates** - Live progress without page refresh
- ⌨️ **Keyboard Friendly** - Tab navigation support

## Project Structure

```
download_manager/
├── README.md                 # This file
├── frontend/                # React frontend application
│   ├── README.md
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── components/        # React components
│   │   ├── styles/            # Component-specific styles
│   │   └── assets/
│   └── public/
├── backend/                 # Node.js/Express backend
│   ├── README.md
│   ├── package.json
│   ├── server.js            # Main server file
│   ├── config/
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   └── utils/               # Utility functions
```

## Quick Start

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** (v6 or higher)

### Installation

1. **Clone the repository**
   ```bash
   cd download_manager
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Configuration

Before running, update the API and WebSocket URLs in the frontend:

**File:** `frontend/src/components/DownloadForm.jsx` and `frontend/src/App.jsx`

```javascript
const API_BASE = 'http://YOUR_SERVER_IP:5000/api';
const WS_URL = 'ws://YOUR_SERVER_IP:5001';
```

**File:** `backend/config/config.js`

```javascript
const config = {
  baseDir: '/path/to/downloads',
  port: 5000,
  wsPort: 5001
};
```

### Running the Application

**Terminal 1 - Start Backend Server:**
```bash
cd backend
npm start
```
The server will run on `http://localhost:5000`

**Terminal 2 - Start Frontend Development Server:**
```bash
cd frontend
npm run dev
```
The frontend will be available at `http://localhost:5173`

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

**Backend:**
```bash
cd backend
npm run build
npm start
```

## API Endpoints

### Downloads
- `POST /api/download` - Start a new download
- `GET /api/downloads` - Get all downloads
- `DELETE /api/download/:id` - Cancel a download

### Folders
- `GET /api/folders` - Get folder structure
- `GET /api/folders/list` - List directory contents (files + folders)
- `POST /api/folders` - Create new folder
- `DELETE /api/folders/item` - Delete file or folder
- `POST /api/folders/rename` - Rename file or folder
- `POST /api/folders/move` - Move file or folder

## WebSocket Events

### Download Progress
- `download_started` - New download initiated
- `download_progress` - Download progress update
- `download_complete` - Download finished
- `download_cancelled` - Download cancelled

## Technology Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool
- **Axios** - HTTP client
- **WebSocket API** - Real-time communication
- **CSS3** - Styling

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **WebSocket** - Real-time updates
- **File System API** - File operations

## Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Known Limitations

- Maximum file size depends on server configuration
- Download speed limited by network bandwidth
- Some servers may not support multi-connection downloads
- Reverse proxies may require additional configuration for WebSocket

## Common Issues

### WebSocket Connection Failed
- Check firewall settings
- Verify WebSocket URL is correct
- Ensure backend server is running
- Check CORS configuration if using proxy

### Download Not Starting
- Verify the URL is accessible
- Check download folder permissions
- Ensure sufficient disk space
- Review browser console for errors

### Files Not Appearing
- Refresh the folder picker modal
- Check file permissions
- Verify base download directory exists
- Check backend logs for errors

## Performance Tips

1. **Use multiple connections** - Increase connections for faster downloads (if supported)
2. **Organize downloads** - Create folders to keep downloads organized
3. **Regular cleanup** - Delete old downloads to save space
4. **Monitor resources** - Check system resources during large downloads

## Security Considerations

- Validate all URLs before downloading
- Run backend in isolated environment
- Use HTTPS in production
- Implement authentication if needed
- Restrict download directory access

## Development

### Frontend Development
```bash
cd frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend Development
```bash
cd backend
npm start            # Start server
npm run dev          # Start with nodemon
npm test            # Run tests (if available)
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues, questions, or suggestions:
1. Check existing documentation
2. Review the FAQ section
3. Open an issue on GitHub
4. Contact the development team

## Changelog

### Latest Version
- Integrated file/folder management into folder picker
- Added rename, delete, move functionality for all items
- Improved responsive design
- Enhanced UX with breadcrumb navigation

## Future Enhancements

- [ ] User authentication
- [ ] Download history
- [ ] Scheduled downloads
- [ ] Bandwidth limiting
- [ ] Pause/Resume functionality
- [ ] Torrent support
- [ ] Cloud storage integration
- [ ] Download statistics

---

**Made with ❤️ by the Download Manager Team**
