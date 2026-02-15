# Download Manager - Frontend

React-based frontend for the Download Manager application. Provides a user-friendly interface for managing downloads and file operations.

## Overview

The frontend is built with React 19 using Vite for fast development and optimized production builds. It communicates with the backend via HTTP (REST API) for data operations and WebSocket for real-time progress updates.

## Features

### Download Management
- ✅ Add new downloads with URL
- ✅ Real-time progress tracking via WebSocket
- ✅ Display name customization
- ✅ Multi-connection download support
- ✅ Cancel downloads
- ✅ Download speed and ETA display
- ✅ Error handling and status display
- ✅ Download history (localStorage)

### File Manager
- ✅ Navigate through directories
- ✅ View files and folders
- ✅ Create new folders
- ✅ Rename files and folders
- ✅ Delete files and folders
- ✅ Move files and folders
- ✅ Breadcrumb navigation
- ✅ Visual move mode indicator

### UI/UX
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Real-time updates without refresh
- ✅ Intuitive navigation
- ✅ Accessible form controls
- ✅ Clean and modern design
- ✅ Error messages and confirmations

## Project Structure

```
frontend/
├── README.md                 # This file
├── package.json              # Dependencies
├── vite.config.js           # Vite configuration
├── index.html               # HTML entry point
├── eslint.config.js         # ESLint configuration
├── src/
│   ├── main.jsx             # React entry point
│   ├── App.jsx              # Main app component
│   ├── App.css              # Global styles
│   ├── components/
│   │   ├── DownloadForm.jsx          # Download form component
│   │   ├── DownloadList.jsx          # Downloads list component
│   │   ├── FolderPickerModal.jsx     # Folder selection modal
│   │   ├── FileBrowser.jsx           # File browser (legacy)
│   │   └── FileManagerModal.jsx      # File manager (legacy)
│   ├── styles/
│   │   ├── FolderPickerModal.css     # Folder picker styles
│   │   └── FileManagerModal.css      # File manager styles
│   └── assets/               # Static assets
└── public/                   # Public files
```

## Installation

### Prerequisites
- **Node.js** v14 or higher
- **npm** v6 or higher

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure API endpoints**
   
   Edit the following files and update the IP address to match your server:
   
   - `src/App.jsx`
   - `src/components/DownloadForm.jsx`
   - `src/components/FolderPickerModal.jsx`
   
   ```javascript
   const API_BASE = 'http://192.168.1.10:5000/api';
   const WS_URL = 'ws://192.168.1.10:5001';
   ```

## Development

### Start Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:5173`

### Build for Production
```bash
npm run build
```
Creates optimized build in `dist/` directory

### Preview Production Build
```bash
npm run preview
```
Test the production build locally

### Run ESLint
```bash
npm run lint
```
Check code quality and style

## Components

### App.jsx
Main application component that:
- Manages global state (downloads, current folder)
- Handles WebSocket connection
- Manages download operations
- Renders main layout

### DownloadForm.jsx
Form for starting new downloads with:
- URL input field
- Optional display name
- Connection count selector
- Folder selection button
- Submit button

### DownloadList.jsx
Displays list of downloads with:
- Download progress bars
- Speed and ETA information
- Status indicators
- Cancel buttons
- Copy URL functionality
- Error messages

### FolderPickerModal.jsx
Modal for selecting/managing folders with:
- Breadcrumb navigation
- Folder browser
- File/folder management
- Create folder functionality
- Rename, delete, move operations

### FileBrowser.jsx & FileManagerModal.jsx
Legacy components for file management (currently not used)

## Component Communication

```
App.jsx
├── State: downloads, currentFolder, ws, isLoading
├── ├→ DownloadForm.jsx
│  └─ Props: currentFolder, onFolderChange, onCreateFolder
│     └─ Renders: FolderPickerModal.jsx
├── └→ DownloadList.jsx
   └─ Props: downloads, onCancel, isLoading
```

## API Integration

### REST Endpoints Used

**Downloads:**
- `POST /api/download` - Create download
- `GET /api/downloads` - Fetch downloads
- `DELETE /api/download/:id` - Cancel download

**Folders:**
- `GET /api/folders/list` - List directory contents
- `POST /api/folders` - Create folder
- `DELETE /api/folders/item` - Delete file/folder
- `POST /api/folders/rename` - Rename item
- `POST /api/folders/move` - Move item

### WebSocket Events

```javascript
// Outgoing (none - WebSocket is one-way)

// Incoming Events:
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'download_started': // New download
    case 'download_progress': // Progress update
    case 'download_complete': // Finished
    case 'download_cancelled': // Cancelled
  }
}
```

## Styling

### CSS Architecture
- `App.css` - Global styles and layout
- Component-specific CSS files in `styles/` directory
- Mobile-first responsive design
- CSS variables for theme colors

### Responsive Breakpoints
- Mobile: < 600px
- Tablet: 600px - 768px
- Desktop: > 768px

### Color Scheme
- Primary: #667eea (Purple)
- Secondary: #764ba2 (Dark Purple)
- Success: #4caf50 (Green)
- Danger: #f44336 (Red)
- Warning: #ffc107 (Yellow)
- Light: #f9f9f9 (Light Gray)

## State Management

### App.jsx State
```javascript
const [downloads, setDownloads] = useState([]);
const [currentFolder, setCurrentFolder] = useState('');
const [ws, setWs] = useState(null);
const [isLoading, setIsLoading] = useState(true);
```

### Component Local State
- Form inputs (url, name, connections)
- Modal open/close states
- Edit/rename modes
- Move mode state

## LocalStorage

The app uses localStorage to:
- Persist downloads list (`downloads` key)
- Recover downloads after page refresh
- This allows offline view of download history

## Error Handling

- Try-catch blocks for API calls
- User-friendly error messages
- Validation of inputs
- Confirmation dialogs for destructive actions
- Console logging for debugging

## Performance Optimizations

1. **WebSocket** - Real-time updates without polling
2. **Event debouncing** - Limited API calls
3. **Component memoization** - Reduce re-renders
4. **Lazy loading** - Load components only when needed
5. **LocalStorage** - Quick state recovery

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome  | ✅ Latest |
| Firefox | ✅ Latest |
| Safari  | ✅ Latest |
| Edge    | ✅ Latest |
| IE 11   | ❌ Not supported |

## Accessibility

- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Color contrast compliance
- Focus indicators

## Dependencies

### Main Dependencies
- **react** (^19.2.4) - UI framework
- **react-dom** (^19.2.4) - DOM rendering
- **axios** (^1.13.5) - HTTP client
- **vite** (^7.3.1) - Build tool

### Dev Dependencies
- **eslint** (^9.39.2) - Code linting
- **eslint plugins** - ESLint configurations

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Environment Variables (if needed)

Create `.env` file in frontend directory:
```
VITE_API_BASE=http://192.168.1.10:5000/api
VITE_WS_URL=ws://192.168.1.10:5001
```

Then import in components:
```javascript
const API_BASE = import.meta.env.VITE_API_BASE;
const WS_URL = import.meta.env.VITE_WS_URL;
```

## Deployment

### Static Build (Recommended)
```bash
npm run build
# Copy dist/ contents to web server
```

### Development Server
```bash
npm run dev
# Works behind reverse proxy with proper configuration
```

### Docker (Optional)
Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

## Troubleshooting

### Port Already in Use
```bash
npm run dev -- --port 3000
```

### API Connection Failed
- Check backend is running
- Verify IP address in constants
- Check firewall settings
- Review browser console for errors

### WebSocket Connection Failed
- Ensure backend WebSocket is running on correct port
- Check proxy configuration
- Verify firewall allows WebSocket connections
- Check browser console for connection errors

### Styles Not Loading
```bash
npm install
npm run dev
```

### Build Fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
npm run build
```

## Performance Tips

1. **Reduce bundle size** - Tree-shaking unused imports
2. **Image optimization** - Compress images before use
3. **Code splitting** - Use dynamic imports for large components
4. **Caching** - Leverage HTTP caching headers
5. **CDN** - Serve static assets from CDN

## Code Standards

- Use functional components with hooks
- Proper error handling in async operations
- Meaningful variable and function names
- Comments for complex logic
- Consistent code formatting (ESLint)

## Future Improvements

- [ ] TypeScript support
- [ ] State management (Redux/Zustand)
- [ ] Component testing (Jest/React Testing Library)
- [ ] Storybook for component documentation
- [ ] Dark mode support
- [ ] Internationalization (i18n)
- [ ] Download scheduling
- [ ] Bandwidth limiting UI

## Contributing

1. Follow code standards
2. Test changes thoroughly
3. Update documentation
4. Use meaningful commit messages
5. Create pull requests for review

## License

MIT License - See main README.md

## Related Documentation

- [Backend README](../backend/README.md)
- [Main README](../README.md)

---

**Happy coding! 🚀**
