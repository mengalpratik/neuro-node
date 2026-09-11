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

## ⚙️ Configuration

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Sync Server listening port | `8787` |
| `VITE_APP_ENV` | Environment identifier | `development` |

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
