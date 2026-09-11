# NEURO//NODE

### LOCAL-FIRST PERSONAL HOME INTERFACE

> A local-first personal dashboard designed to act as a private, customizable command center for bookmarks, calendar information, weather, personal tasks, and multi-device synchronization.

---

## ⚡ Overview

**NEURO//NODE** is an offline-capable, privacy-first personal dashboard engineered with a futuristic cyberpunk terminal aesthetic. It serves as your daily command center: organizing browser bookmarks into modular matrix clusters, presenting live chrono telemetry, calculating traditional Indian calendar (Panchang / पंचांग) dates, retrieving meteorology data, organizing agenda items, and synchronizing state across multiple paired devices using local-first CRDT protocols.

---

## 🌐 Local-First Philosophy

In **NEURO//NODE**, your device is the primary authority:
1. **0ms Local UI Latency**: All user actions (creating bookmarks, reordering groups, updating tasks, toggling themes) mutate local browser storage instantly. The UI never freezes waiting for a remote server.
2. **True Offline Independence**: Works 100% offline. If the network drops or the sync server is offline, NEURO//NODE functions with zero degradation.
3. **Data Sovereignty & Client Isolation**: Your data remains on your machine in `localStorage`. There are no tracking scripts, third-party trackers, or cloud-only databases.
4. **Explicit Multi-Device Pairing**: Synchronization happens strictly between devices you have explicitly paired with single-use cryptographic codes and interactive human authorization.

---

## 🚀 Features

- **Matrix Routing // Bookmark Clusters**: Group and categorize web applications and links with favicon auto-detection, drag-and-drop reordering, and direct URL validation.
- **Chrono // Live Real-Time Clock**: Precision digital clock with seconds telemetry and timezone awareness.
- **भारतीय पंचांग // Indian Calendar**: Comprehensive sidereal Vedic calendar computations calculating Tithi (तिथी), Paksha (पक्ष), Ritu (ऋतू), Samvat (संवत), and Masa (मास) directly in the browser.
- **Meteorology // Live Weather**: Real-time atmospheric conditions, humidity, wind speeds, and temperature forecasts using the privacy-friendly Open-Meteo API with offline caching.
- **Schedule // Events & Agenda**: Local agenda and task checklist system with optional Google Calendar / Tasks integration.
- **दैनिक राशीभविष्य // Horoscope Insights**: Offline modular Rashi and astrological attributes with element filtering (Fire, Earth, Air, Water) and lucky metrics.
- **Multi-Device Sync Engine**: Offline-capable synchronization with monotonic revision logs, conflict-free state convergence, single-use pairing codes, and real-time WebSocket propagation with REST fallback.
- **Backup & Portability**: Standalone JSON export and import with cryptographic scrubbing of credentials, OAuth tokens, and pairing secrets.

---

## 🏗️ Architecture

```
+-------------------------------------------------------------------------+
|                              LOCAL BROWSER                              |
|                                                                         |
|   +-----------------------------------------------------------------+   |
|   |                NEURO//NODE User Interface (React 19)            |   |
|   |         0ms Latency - Immediate Optimistic UI Updates           |   |
|   +-----------------------------------------------------------------+   |
|                                    |                                    |
|                                    v                                    |
|   +-----------------------------------------------------------------+   |
|   |          LocalStorage Primary Engine (Browser Sandboxed)        |   |
|   |               Zero Cloud Dependency for Core Runtime            |   |
|   +-----------------------------------------------------------------+   |
|          |                                            |                 |
|          v                                            v                 |
|   +---------------+                        +----------------------+     |
|   | Multi-Tab Sync|                        |  Sync Engine Queue   |     |
|   | BroadcastChan |                        | (pendingChanges in   |     |
|   +---------------+                        |    LocalStorage)     |     |
|                                            +----------------------+     |
+-------------------------------------------------------|-----------------+
                                                        |
                               (Encrypted WS / REST)    |
                                                        v
                                             +----------------------+
                                             |NEURO//NODE SyncServer|
                                             |  - Monotonic Revisions
                                             |  - Atomic Log Storage|
                                             |  - Ephemeral Pairing |
                                             +----------------------+
                                                        |
                                                        v
                                             +----------------------+
                                             |   Paired Device B    |
                                             |   (Phone / Tablet)   |
                                             +----------------------+
```

Detailed protocol specifications, sequence diagrams, and convergence rules are documented in [`docs/SYNC_ARCHITECTURE.md`](docs/SYNC_ARCHITECTURE.md).

---

## 🛠️ Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or later
- **npm**: v9.0.0 or later

### Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/mengalpratik/neuro-node.git
cd neuro-node
npm install
```

### Running the Dashboard
Start the Vite development server:

```bash
npm run dev
```

Open your browser at `http://localhost:5173`.

### Running the Multi-Device Sync Server (Optional)
To enable multi-device synchronization across local network devices:

```bash
npm run server
```

The sync server will bind to `http://0.0.0.0:8787` (WebSocket: `ws://0.0.0.0:8787/ws`).

---

## 🧪 Testing & Verification

NEURO//NODE includes automated unit tests, integration suites, and multi-device browser tests using **Vitest** and **Playwright**:

```bash
# Run full Vitest suite (12 test suites, 52+ unit & integration tests)
npm test

# Run tests in watch mode
npm run test:watch
```

### Production Build
Compile TypeScript and generate the optimized production web bundle:

```bash
npm run build
```

Artifacts are output to `dist/` with full PWA shell caching.

---

---

## 🐳 Docker Deployment

NEURO//NODE provides a production-ready, multi-stage Docker containerization optimized for low-resource cloud or home server environments (e.g. small Ubuntu VMs with ~1 GB RAM).

> [!NOTE]
> **No Node.js or npm required on host**: When deploying with Docker, the host VM does **NOT** need Node.js, npm, or build tools installed. Docker builds and runs the entire application in an isolated, minimal Alpine environment consuming only ~35–45 MB RAM.

### 1. Prerequisites
- **Docker Engine** (version 20.10+ or later)
- **Docker Compose** (V2 plugin `docker compose` or standalone `docker-compose`)
- Port `8787` available (or custom port configured in `.env`)

### 2. Clone the Repository
```bash
git clone https://github.com/mengalpratik/neuro-node.git
cd neuro-node
```

### 3. Environment Setup (Optional)
Copy `.env.example` to `.env` if you wish to override default port or runtime settings:
```bash
cp .env.example .env
```
Default parameters in `.env.example`:
- `PORT=8787`
- `NODE_ENV=production`
- `DATA_DIR=/app/server/data`
- `STATIC_DIR=/app/dist`

### 4. Build and Start
Build the image and launch the container in detached mode:
```bash
docker compose up -d --build
```
This multi-stage build compiles TypeScript and packages the Vite frontend inside the builder container, then copies the production assets into a lightweight Node.js 20 Alpine runner container.

### 5. Verify Health & Status
Check running container status and health:
```bash
docker compose ps
```
Or query the health endpoint:
```bash
curl -i http://localhost:8787/health
```

### 6. View Logs
Stream real-time server and WebSocket logs:
```bash
docker compose logs -f
```

### 7. Stopping the Service
Stop the container gracefully:
```bash
docker compose down
```

### 8. Restarting the Service
Restart the container:
```bash
docker compose restart
```

### 9. Updating to Latest Version
Pull new changes and rebuild:
```bash
git pull origin main
docker compose up -d --build
```

### 10. Persistent Data & Backups
All paired device identities, synchronization groups, and operation logs are saved in the Docker named volume: `neuro_node_data`, mounted at `/app/server/data`.
Data persists across container restarts, rebuilds, and `docker compose down`.

To locate or inspect the volume:
```bash
docker volume inspect neuro_node_data
```

To backup the sync database from the container:
```bash
docker compose cp neuro-node:/app/server/data/sync_db.json ./backup_sync_db.json
```

### 11. Port Configuration
By default, the unified server runs on port `8787` on all interfaces (`0.0.0.0:8787`).
To change the host port, set `PORT=9000` in `.env`.

### 12. Local Area Network (LAN) Access
Access the dashboard from any phone, laptop, or tablet on your local network:
```text
http://<YOUR_SERVER_IP>:8787/
```
The frontend automatically detects the browser's origin (`window.location.origin`) and establishes REST and WebSocket (`ws://`) connections without manual IP configuration.

### 13. HTTPS & Reverse Proxy Setup
For public internet deployment or domain access with SSL (e.g. Caddy or Nginx), place a reverse proxy in front of port `8787`.

**Caddy Example** (`Caddyfile`):
```caddy
neuro.example.com {
    reverse_proxy 127.0.0.1:8787
}
```
*Caddy automatically handles Let's Encrypt TLS certificates and WebSocket upgrades (`wss://`). The NEURO//NODE frontend automatically detects the `https:` protocol and switches WebSocket communication to `wss://`.*

**Nginx Example**:
```nginx
server {
    listen 443 ssl http2;
    server_name neuro.example.com;

    ssl_certificate /etc/letsencrypt/live/neuro.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/neuro.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8787;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## ⚙️ Configuration

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Server listening port | `8787` |
| `HOST` | Server bind address | `0.0.0.0` |
| `DATA_DIR` | Persistent data directory | `/app/server/data` |
| `STATIC_DIR` | Static web build directory | `/app/dist` |
| `NODE_ENV` | Environment identifier | `production` |

Application preferences (theme, background style, weather coordinates, sync endpoints) are managed directly in the dashboard UI via the **Settings Drawer** (`Cmd/Ctrl + ,` or burger icon).

---

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for complete terms.

---

## 👤 Credits & Author

**Built with love by Mengal Pratik (Neuro)**

- **Author**: Pratik Mengal (Neuro)
- **GitHub**: [mengalpratik](https://github.com/mengalpratik)
- **Email**: [iampratikmengal@gmail.com](mailto:iampratikmengal@gmail.com)
