import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'sync_db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-Memory Database with atomic disk persistence
class SyncDatabase {
  constructor() {
    this.devices = new Map(); // deviceId -> { deviceId, deviceName, shortId, authToken, syncGroupId, createdAt, lastSeenAt }
    this.pairingCodes = new Map(); // codeHash -> { code, codeHash, deviceId, deviceName, shortId, createdAt, expiresAt, status, requesterDevice, approvedGroupId }
    this.syncGroups = new Map(); // syncGroupId -> { syncGroupId, memberDeviceIds: string[], revisionCounter: number, operations: [] }
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (data.devices) this.devices = new Map(Object.entries(data.devices));
        if (data.syncGroups) this.syncGroups = new Map(Object.entries(data.syncGroups));
        console.log(`[NEURO//NODE Server] Loaded ${this.devices.size} devices and ${this.syncGroups.size} sync groups from disk.`);
      }
    } catch (err) {
      console.error('[NEURO//NODE Server] Failed to read database file. Starting fresh.', err);
    }
  }

  save() {
    try {
      const data = {
        devices: Object.fromEntries(this.devices),
        syncGroups: Object.fromEntries(this.syncGroups),
      };
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('[NEURO//NODE Server] Failed to save database to disk:', err);
    }
  }

  getDevice(deviceId) {
    return this.devices.get(deviceId);
  }

  registerDevice(deviceId, deviceName, shortId) {
    let device = this.devices.get(deviceId);
    if (!device) {
      const authToken = 'tok_' + crypto.randomBytes(24).toString('hex');
      device = {
        deviceId,
        deviceName: deviceName || 'NEURO//NODE Device',
        shortId: shortId || 'DEV-0000',
        authToken,
        syncGroupId: null,
        createdAt: Date.now(),
        lastSeenAt: Date.now(),
      };
      this.devices.set(deviceId, device);
      this.save();
    } else {
      if (deviceName && device.deviceName !== deviceName) {
        device.deviceName = deviceName;
      }
      device.lastSeenAt = Date.now();
      this.save();
    }
    return device;
  }

  authenticate(deviceId, token) {
    if (!deviceId || !token) return null;
    const device = this.devices.get(deviceId);
    if (!device) return null;
    if (device.authToken !== token) return null;
    device.lastSeenAt = Date.now();
    return device;
  }

  createPairCode(device) {
    // Unambiguous character set (no 0, 1, I, O)
    const charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    const bytes = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) {
      code += charset[bytes[i] % charset.length];
      if (i === 1 || i === 3) code += '-';
    }

    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const now = Date.now();
    const expiresAt = now + 5 * 60 * 1000; // 5 minutes validity

    const record = {
      code,
      codeHash,
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      shortId: device.shortId,
      createdAt: now,
      expiresAt,
      status: 'PENDING',
      requesterDevice: null,
      approvedGroupId: null,
    };

    this.pairingCodes.set(codeHash, record);

    // Clean up expired codes after 10 minutes
    setTimeout(() => {
      this.pairingCodes.delete(codeHash);
    }, 10 * 60 * 1000);

    return { code, expiresAt, codeHash };
  }

  findPairCode(rawCode) {
    const clean = rawCode.trim().toUpperCase();
    const codeHash = crypto.createHash('sha256').update(clean).digest('hex');
    const record = this.pairingCodes.get(codeHash);
    if (!record) return null;
    if (Date.now() > record.expiresAt) {
      record.status = 'EXPIRED';
      return null;
    }
    return record;
  }

  createOrJoinSyncGroup(deviceAId, deviceBId) {
    const devA = this.devices.get(deviceAId);
    const devB = this.devices.get(deviceBId);
    if (!devA || !devB) return null;

    let groupId = devA.syncGroupId || devB.syncGroupId;
    if (!groupId) {
      groupId = 'pair_' + crypto.randomBytes(12).toString('hex');
    }

    let group = this.syncGroups.get(groupId);
    if (!group) {
      group = {
        syncGroupId: groupId,
        memberDeviceIds: [],
        revisionCounter: 0,
        operations: [],
      };
      this.syncGroups.set(groupId, group);
    }

    if (!group.memberDeviceIds.includes(deviceAId)) group.memberDeviceIds.push(deviceAId);
    if (!group.memberDeviceIds.includes(deviceBId)) group.memberDeviceIds.push(deviceBId);

    devA.syncGroupId = groupId;
    devB.syncGroupId = groupId;
    this.save();
    return group;
  }

  getGroup(groupId) {
    return this.syncGroups.get(groupId);
  }

  getGroupDevices(groupId) {
    const group = this.syncGroups.get(groupId);
    if (!group) return [];
    return group.memberDeviceIds
      .map(id => this.devices.get(id))
      .filter(Boolean)
      .map(d => ({
        deviceId: d.deviceId,
        deviceName: d.deviceName,
        shortId: d.shortId,
        lastSeenAt: d.lastSeenAt,
      }));
  }

  pushOperations(groupId, deviceId, operations) {
    const group = this.syncGroups.get(groupId);
    if (!group) return null;

    const acknowledged = [];
    const newRevisions = [];

    for (const op of operations) {
      // Idempotency: check if operationId already in group
      const exists = group.operations.some(o => o.operation.operationId === op.operationId);
      if (exists) {
        acknowledged.push(op.operationId);
        continue;
      }

      group.revisionCounter += 1;
      const revisionEntry = {
        revision: group.revisionCounter,
        operation: op,
        receivedAt: Date.now(),
      };
      group.operations.push(revisionEntry);
      acknowledged.push(op.operationId);
      newRevisions.push(revisionEntry);
    }

    this.save();
    return {
      acknowledgedIds: acknowledged,
      serverRevision: group.revisionCounter,
      newRevisions,
    };
  }

  pullOperations(groupId, sinceRevision = 0) {
    const group = this.syncGroups.get(groupId);
    if (!group) return { operations: [], currentRevision: 0 };

    const ops = group.operations
      .filter(entry => entry.revision > sinceRevision)
      .map(entry => ({
        revision: entry.revision,
        operation: entry.operation,
      }));

    return {
      operations: ops,
      currentRevision: group.revisionCounter,
    };
  }

  unpairDevice(deviceId) {
    const dev = this.devices.get(deviceId);
    if (!dev || !dev.syncGroupId) return false;

    const group = this.syncGroups.get(dev.syncGroupId);
    if (group) {
      group.memberDeviceIds = group.memberDeviceIds.filter(id => id !== deviceId);
      if (group.memberDeviceIds.length === 0) {
        this.syncGroups.delete(dev.syncGroupId);
      }
    }
    dev.syncGroupId = null;
    this.save();
    return true;
  }
}

export const db = new SyncDatabase();

// WebSocket Manager
class ConnectionHub {
  constructor() {
    this.deviceSockets = new Map(); // deviceId -> Set<WebSocket>
  }

  add(deviceId, ws) {
    if (!this.deviceSockets.has(deviceId)) {
      this.deviceSockets.set(deviceId, new Set());
    }
    this.deviceSockets.get(deviceId).add(ws);
  }

  remove(deviceId, ws) {
    const set = this.deviceSockets.get(deviceId);
    if (set) {
      set.delete(ws);
      if (set.size === 0) this.deviceSockets.delete(deviceId);
    }
  }

  isOnline(deviceId) {
    const set = this.deviceSockets.get(deviceId);
    return !!set && set.size > 0;
  }

  sendToDevice(deviceId, message) {
    const set = this.deviceSockets.get(deviceId);
    if (!set) return false;
    const payload = JSON.stringify(message);
    for (const ws of set) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
    return true;
  }

  broadcastToGroup(groupId, message, excludeDeviceId = null) {
    const group = db.getGroup(groupId);
    if (!group) return;

    for (const memberId of group.memberDeviceIds) {
      if (excludeDeviceId && memberId === excludeDeviceId) continue;
      this.sendToDevice(memberId, message);
    }
  }
}

export const hub = new ConnectionHub();

// HTTP Request Handlers
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Device-ID',
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) { // 5MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function extractAuth(req) {
  const deviceId = req.headers['x-device-id'];
  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }
  return { deviceId, token };
}

export function createServer() {
  const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Device-ID',
      });
      res.end();
      return;
    }

    try {
      // Health check
      if (req.method === 'GET' && pathname === '/api/health') {
        return sendJson(res, 200, {
          status: 'ok',
          time: Date.now(),
          devicesCount: db.devices.size,
          groupsCount: db.syncGroups.size,
        });
      }

      // Device registration / verification
      if (req.method === 'POST' && pathname === '/api/device/register') {
        const body = await parseJsonBody(req);
        if (!body.deviceId) {
          return sendJson(res, 400, { error: 'deviceId is required' });
        }
        const device = db.registerDevice(body.deviceId, body.deviceName, body.shortId);
        return sendJson(res, 200, {
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          shortId: device.shortId,
          authToken: device.authToken,
          syncGroupId: device.syncGroupId,
        });
      }

      // Generate Pair Code (Device A)
      if (req.method === 'POST' && pathname === '/api/pair/generate') {
        const { deviceId, token } = extractAuth(req);
        const device = db.authenticate(deviceId, token);
        if (!device) {
          return sendJson(res, 401, { error: 'Unauthorized device' });
        }
        const pairInfo = db.createPairCode(device);
        return sendJson(res, 200, {
          code: pairInfo.code,
          expiresAt: pairInfo.expiresAt,
          codeHash: pairInfo.codeHash,
        });
      }

      // Request Pairing With Code (Device B)
      if (req.method === 'POST' && pathname === '/api/pair/request') {
        const { deviceId, token } = extractAuth(req);
        const deviceB = db.authenticate(deviceId, token);
        if (!deviceB) {
          return sendJson(res, 401, { error: 'Unauthorized device' });
        }

        const body = await parseJsonBody(req);
        if (!body.code) {
          return sendJson(res, 400, { error: 'Pair code is required' });
        }

        const pairRecord = db.findPairCode(body.code);
        if (!pairRecord) {
          return sendJson(res, 404, { error: 'Invalid, expired, or already used pair code' });
        }

        if (pairRecord.deviceId === deviceB.deviceId) {
          return sendJson(res, 400, { error: 'Cannot pair a device with itself' });
        }

        const requestId = 'req_' + crypto.randomBytes(8).toString('hex');
        pairRecord.status = 'WAITING_CONFIRMATION';
        pairRecord.requesterDevice = {
          requestId,
          deviceId: deviceB.deviceId,
          deviceName: deviceB.deviceName,
          shortId: deviceB.shortId,
          timestamp: Date.now(),
        };

        // Notify Device A via WebSocket
        hub.sendToDevice(pairRecord.deviceId, {
          type: 'PAIR_REQUEST',
          payload: {
            requestId,
            codeHash: pairRecord.codeHash,
            requesterDevice: pairRecord.requesterDevice,
          },
        });

        return sendJson(res, 200, {
          requestId,
          status: 'WAITING_CONFIRMATION',
          targetDeviceName: pairRecord.deviceName,
          targetShortId: pairRecord.shortId,
        });
      }

      // Respond to Pairing Request (Device A: Allow / Reject)
      if (req.method === 'POST' && pathname === '/api/pair/respond') {
        const { deviceId, token } = extractAuth(req);
        const deviceA = db.authenticate(deviceId, token);
        if (!deviceA) {
          return sendJson(res, 401, { error: 'Unauthorized device' });
        }

        const body = await parseJsonBody(req);
        const { requestId, approved } = body;

        let targetRecord = null;
        for (const record of db.pairingCodes.values()) {
          if (record.requesterDevice && record.requesterDevice.requestId === requestId) {
            targetRecord = record;
            break;
          }
        }

        if (!targetRecord) {
          return sendJson(res, 404, { error: 'Pair request not found or expired' });
        }

        if (targetRecord.deviceId !== deviceA.deviceId) {
          return sendJson(res, 403, { error: 'Forbidden: only the host device can respond' });
        }

        const deviceB = db.getDevice(targetRecord.requesterDevice.deviceId);

        if (!approved) {
          targetRecord.status = 'REJECTED';
          db.pairingCodes.delete(targetRecord.codeHash);

          // Notify Device B
          if (deviceB) {
            hub.sendToDevice(deviceB.deviceId, {
              type: 'PAIR_RESOLVED',
              payload: { approved: false, message: 'Pairing request was declined by the host device.' },
            });
          }

          return sendJson(res, 200, { status: 'REJECTED' });
        }

        // Approved: create / join sync group
        const group = db.createOrJoinSyncGroup(deviceA.deviceId, deviceB.deviceId);
        targetRecord.status = 'APPROVED';
        targetRecord.approvedGroupId = group.syncGroupId;
        db.pairingCodes.delete(targetRecord.codeHash);

        const pairedListForB = db.getGroupDevices(group.syncGroupId);
        const pairedListForA = db.getGroupDevices(group.syncGroupId);

        // Notify Device B
        hub.sendToDevice(deviceB.deviceId, {
          type: 'PAIR_RESOLVED',
          payload: {
            approved: true,
            syncGroupId: group.syncGroupId,
            pairedDevices: pairedListForB,
          },
        });

        // Notify Device A
        hub.sendToDevice(deviceA.deviceId, {
          type: 'PEER_JOINED',
          payload: {
            syncGroupId: group.syncGroupId,
            newDevice: {
              deviceId: deviceB.deviceId,
              deviceName: deviceB.deviceName,
              shortId: deviceB.shortId,
            },
            pairedDevices: pairedListForA,
          },
        });

        return sendJson(res, 200, {
          status: 'APPROVED',
          syncGroupId: group.syncGroupId,
          pairedDevices: pairedListForA,
        });
      }

      // Check Pair Status (polling fallback for Device B)
      if (req.method === 'GET' && pathname === '/api/pair/status') {
        const requestId = parsedUrl.searchParams.get('requestId');
        if (!requestId) return sendJson(res, 400, { error: 'requestId required' });

        let targetRecord = null;
        for (const record of db.pairingCodes.values()) {
          if (record.requesterDevice && record.requesterDevice.requestId === requestId) {
            targetRecord = record;
            break;
          }
        }

        if (!targetRecord) {
          return sendJson(res, 200, { status: 'UNKNOWN_OR_RESOLVED' });
        }

        return sendJson(res, 200, {
          status: targetRecord.status,
          syncGroupId: targetRecord.approvedGroupId,
        });
      }

      // Sync Push (Upload pending operations)
      if (req.method === 'POST' && pathname === '/api/sync/push') {
        const { deviceId, token } = extractAuth(req);
        const device = db.authenticate(deviceId, token);
        if (!device) {
          return sendJson(res, 401, { error: 'Unauthorized device' });
        }
        if (!device.syncGroupId) {
          return sendJson(res, 400, { error: 'Device is not paired to any sync group' });
        }

        const body = await parseJsonBody(req);
        const operations = Array.isArray(body.operations) ? body.operations : [];

        const result = db.pushOperations(device.syncGroupId, device.deviceId, operations);
        if (!result) {
          return sendJson(res, 500, { error: 'Failed to record operations' });
        }

        // Broadcast to other peers in the group
        if (result.newRevisions.length > 0) {
          hub.broadcastToGroup(
            device.syncGroupId,
            {
              type: 'REMOTE_OPERATIONS',
              payload: {
                syncGroupId: device.syncGroupId,
                latestRevision: result.serverRevision,
                operations: result.newRevisions,
                originDeviceId: device.deviceId,
              },
            },
            device.deviceId // exclude sender
          );
        }

        return sendJson(res, 200, {
          acknowledgedIds: result.acknowledgedIds,
          serverRevision: result.serverRevision,
        });
      }

      // Sync Pull (Fetch operations since last revision)
      if (req.method === 'GET' && pathname === '/api/sync/pull') {
        const { deviceId, token } = extractAuth(req);
        const device = db.authenticate(deviceId, token);
        if (!device) {
          return sendJson(res, 401, { error: 'Unauthorized device' });
        }
        if (!device.syncGroupId) {
          return sendJson(res, 400, { error: 'Device is not paired to any sync group' });
        }

        const sinceRevision = parseInt(parsedUrl.searchParams.get('since') || '0', 10);
        const result = db.pullOperations(device.syncGroupId, sinceRevision);

        return sendJson(res, 200, result);
      }

      // List Paired Devices
      if (req.method === 'GET' && pathname === '/api/devices') {
        const { deviceId, token } = extractAuth(req);
        const device = db.authenticate(deviceId, token);
        if (!device) {
          return sendJson(res, 401, { error: 'Unauthorized device' });
        }
        if (!device.syncGroupId) {
          return sendJson(res, 200, { pairedDevices: [] });
        }

        const devices = db.getGroupDevices(device.syncGroupId).map(d => ({
          ...d,
          isOnline: hub.isOnline(d.deviceId),
        }));

        return sendJson(res, 200, { pairedDevices: devices });
      }

      // Unpair Device
      if (req.method === 'POST' && pathname === '/api/devices/unpair') {
        const { deviceId, token } = extractAuth(req);
        const device = db.authenticate(deviceId, token);
        if (!device) {
          return sendJson(res, 401, { error: 'Unauthorized device' });
        }

        const body = await parseJsonBody(req);
        const targetDeviceId = body.targetDeviceId || device.deviceId;
        const oldGroupId = device.syncGroupId;

        db.unpairDevice(targetDeviceId);

        if (oldGroupId) {
          hub.broadcastToGroup(oldGroupId, {
            type: 'DEVICE_UNPAIRED',
            payload: { deviceId: targetDeviceId },
          });
        }

        return sendJson(res, 200, { success: true });
      }

      // Fallthrough: 404
      return sendJson(res, 404, { error: `Endpoint not found: ${req.method} ${pathname}` });
    } catch (err) {
      console.error('[NEURO//NODE Server] Request error:', err);
      return sendJson(res, 500, { error: 'Internal Server Error', message: err.message });
    }
  });

  // Attach WebSocket Server
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const parsedUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    if (parsedUrl.pathname !== '/ws') {
      socket.destroy();
      return;
    }

    const deviceId = parsedUrl.searchParams.get('deviceId');
    const token = parsedUrl.searchParams.get('token');

    // Authenticate device on WebSocket connection
    const device = db.authenticate(deviceId, token);
    if (!device) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, ws => {
      wss.emit('connection', ws, request, device);
    });
  });

  wss.on('connection', (ws, req, device) => {
    hub.add(device.deviceId, ws);

    // If device is in a sync group, announce online status to peers
    if (device.syncGroupId) {
      hub.broadcastToGroup(
        device.syncGroupId,
        {
          type: 'DEVICE_STATUS',
          payload: { deviceId: device.deviceId, isOnline: true },
        },
        device.deviceId
      );
    }

    // Heartbeat
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', rawMsg => {
      try {
        const msg = JSON.parse(rawMsg.toString());
        if (msg.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', time: Date.now() }));
        }
      } catch {}
    });

    ws.on('close', () => {
      hub.remove(device.deviceId, ws);
      if (device.syncGroupId) {
        hub.broadcastToGroup(
          device.syncGroupId,
          {
            type: 'DEVICE_STATUS',
            payload: { deviceId: device.deviceId, isOnline: hub.isOnline(device.deviceId) },
          },
          device.deviceId
        );
      }
    });
  });

  // Keep-alive ping interval
  const pingInterval = setInterval(() => {
    for (const ws of wss.clients) {
      if (ws.isAlive === false) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, 30000);

  server.on('close', () => {
    clearInterval(pingInterval);
  });

  return { server, wss };
}

// Start standalone server if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8787;
  const { server } = createServer();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[NEURO//NODE Sync Server] Listening on http://0.0.0.0:${PORT} (WebSocket: ws://0.0.0.0:${PORT}/ws)`);
  });
}
