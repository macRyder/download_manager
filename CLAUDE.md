# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack download manager that wraps `aria2c` for actual downloading, with a BullMQ job queue (Redis-backed) for concurrency control and retries, real-time progress via SSE (Server-Sent Events), and a file/folder management UI. The backend runs on port 5000; the frontend is a Vite/React app served by nginx.

## Development Commands

### Backend
```bash
cd backend
npm install
npm run start:dev     # starts with nodemon (auto-reload)
```

### Frontend
```bash
cd frontend
npm install
npm run dev           # Vite dev server
npm run build         # production build
npm run lint          # ESLint
npm run preview       # preview production build
```

### Docker (full stack)
```bash
docker compose up -d          # starts redis + backend + frontend
docker compose up -d redis    # redis only (for local dev)
docker compose build          # rebuild images
docker compose logs -f        # follow all logs
```

There are no tests currently in this project.

## Architecture

### Data Flow
1. User submits a URL via `DownloadForm` → POST `/api/download`
2. `DownloadManager.createDownload()` enqueues a job to BullMQ (status: `queued`)
3. BullMQ worker picks up the job (max 3 concurrent) → spawns `aria2c` child process
4. `DownloadManager` parses aria2c stdout for progress, broadcasts updates via `SSEService`
5. Frontend `useDownloads` hook receives SSE events via `EventSource`, updates state + localStorage
6. On failure, BullMQ retries up to 3 times with exponential backoff (5s, 10s, 20s)
7. On completion/failure/cancel, the download is persisted to SQLite
8. `DownloadList` renders the current download status

### Backend (`backend/`)
- **`server.js`** — Express entry point. Mounts routes at `/api/download`, `/api/folders`, `/api/health`, `/api/events` (SSE). Initializes all services and wires up the queue.
- **`services/downloadManager.js`** — Core download logic. `createDownload()` enqueues to BullMQ. `processDownload(job)` is the worker callback that spawns `aria2c`. Handles retries, cancellation, and merges active (in-memory) + history (SQLite) for `GET /api/download`.
- **`services/queueService.js`** — BullMQ queue and worker. Configurable concurrency and retry policy. Connects to Redis.
- **`services/sseService.js`** — SSE server on the same Express port. One-directional: server → all connected clients. Events: `download_queued`, `download_started`, `download_progress`, `download_complete`, `download_cancelled`, `download_retrying`.
- **`services/database.js`** — SQLite persistence via `better-sqlite3`. Stores completed/failed/cancelled downloads. WAL mode for performance.
- **`services/logger.js`** — File-based logging to `logs/app.log` and `logs/downloads.log`.
- **`routes/downloadRoutes.js`** — POST (start/enqueue), GET (list all active+history), POST `/:id/retry` (retry failed), DELETE by ID (cancel). History sub-routes: GET `/history`, DELETE `/history/:id`, DELETE `/history`.
- **`routes/folderRoutes.js`** — Folder tree, directory listing, create, delete, rename, move.
- **`utils/fileUtils.js`** — All filesystem operations scoped to `BASE_DOWNLOAD_DIR`.
- **`config/config.js`** — Port, base download directory, Redis connection, queue settings (concurrency, retries, backoff delay).

Active downloads are in-memory. Finished downloads are persisted to SQLite at `backend/data/downloads.db`.

### Frontend (`frontend/src/`)
- **`App.jsx`** — Thin orchestrator. Uses `useDownloads` hook for all download state and actions.
- **`hooks/useDownloads.js`** — Core hook: fetches initial data, handles SSE events (including `download_queued` and `download_retrying`), persists to localStorage, provides `startDownload`, `cancelDownload`, `retryDownload`, `removeDownload`.
- **`hooks/useSSE.js`** — Generic SSE connection hook. Auto-reconnects via browser's built-in `EventSource`.
- **`services/api.js`** — Centralized axios client. Uses `VITE_API_BASE` env var. All API calls go through here.
- **`components/DownloadForm.jsx`** — URL input, optional display name, connections count, folder selector.
- **`components/DownloadList.jsx`** — Renders download cards with progress bars, speed, ETA, status badges (queued/downloading/retrying/completed/failed/cancelled), cancel/retry/remove buttons.
- **`components/FolderPickerModal.jsx`** — Modal for browsing the server's folder tree. Supports create, rename, delete, and move operations.
- **`components/FileBrowser.jsx`** and **`components/FileManagerModal.jsx`** — Legacy, not rendered anywhere.

### API URL Configuration
- **Local dev**: Set in `frontend/.env.development` → `VITE_API_BASE=http://192.168.1.9:5000/api`
- **Docker**: Frontend nginx proxies `/api` to backend container — no hardcoded IP needed. Build arg `VITE_API_BASE=/api`.
- **`services/api.js`** reads `import.meta.env.VITE_API_BASE` with fallback to `/api`.

### Docker Setup
- **`docker-compose.yml`** — 3 services: `redis` (redis:7-alpine), `backend` (node:22-alpine + aria2c), `frontend` (nginx:alpine serving built static files)
- Multi-stage builds for minimal images (~26MB frontend, ~70MB backend)
- Frontend nginx proxies `/api/*` to `backend:5000` (including SSE with buffering disabled)
- Volumes: `redis_data` (queue persistence), `backend_data` (SQLite), `backend_logs` (logs), host bind mount for `/home/hp_server/media` (download target)
- Backend connects to Redis via `REDIS_HOST=redis` env var

### External Dependency
`aria2c` must be installed on the server and available on PATH (installed via `apk add aria2` in Docker). The backend calls it directly as a child process — no aria2c RPC, just CLI stdout parsing.
