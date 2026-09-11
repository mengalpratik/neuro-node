import {
  DeviceIdentity,
  PairedDevice,
  PairCodeInfo,
  PairRequestInfo,
  SyncConnectionStatus,
  SyncOperation,
} from '../../types/dashboard';

export type SyncEventListener = {
  onStatusChange?: (status: SyncConnectionStatus, error?: string) => void;
  onRemoteOperations?: (operations: SyncOperation[], latestRevision: number) => void;
  onPairRequest?: (info: PairRequestInfo) => void;
  onPairResolved?: (payload: {
    approved: boolean;
    syncGroupId?: string;
    pairedDevices?: PairedDevice[];
    message?: string;
  }) => void;
  onPeerJoined?: (payload: {
    syncGroupId: string;
    newDevice: { deviceId: string; deviceName: string; shortId: string };
    pairedDevices: PairedDevice[];
  }) => void;
  onDeviceStatus?: (payload: { deviceId: string; isOnline: boolean }) => void;
  onDeviceUnpaired?: (payload: { deviceId: string }) => void;
};

export class SyncEngine {
  private ws: WebSocket | null = null;
  private reconnectTimer: any = null;
  private reconnectAttempts = 0;
  private listeners: Set<SyncEventListener> = new Set();
  private processedOperationIds: Set<string> = new Set();
  private isPushing = false;
  private isPulling = false;
  private pingInterval: any = null;

  private currentStatus: SyncConnectionStatus = 'LOCAL_ONLY';
  private currentError?: string;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[NEURO//NODE SyncEngine] Network is back online.');
        this.reconnectAttempts = 0;
        this.reconnectWs();
      });
      window.addEventListener('offline', () => {
        console.log('[NEURO//NODE SyncEngine] Network went offline.');
        this.setStatus('OFFLINE');
      });
    }
  }

  public getStatus(): SyncConnectionStatus {
    return this.currentStatus;
  }

  public getError(): string | undefined {
    return this.currentError;
  }

  public addListener(listener: SyncEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public markOperationProcessed(operationId: string): void {
    this.processedOperationIds.add(operationId);
    // Limit memory set size to 2000 items
    if (this.processedOperationIds.size > 2000) {
      const first = this.processedOperationIds.values().next().value;
      if (first) this.processedOperationIds.delete(first);
    }
  }

  public hasOperationBeenProcessed(operationId: string): boolean {
    return this.processedOperationIds.has(operationId);
  }

  private setStatus(status: SyncConnectionStatus, error?: string): void {
    this.currentStatus = status;
    this.currentError = error;
    for (const l of this.listeners) {
      l.onStatusChange?.(status, error);
    }
  }

  // ==================== HTTP REST API ====================

  private resolveHttpUrl(serverUrl: string, endpoint: string): string {
    const base = serverUrl.trim() || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8787');
    const cleanBase = base.replace(/\/+$/, '');
    return `${cleanBase}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  }

  public async registerDevice(
    device: DeviceIdentity,
    serverUrl: string
  ): Promise<{ authToken: string; syncGroupId: string | null }> {
    const url = this.resolveHttpUrl(serverUrl, '/api/device/register');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        shortId: device.shortId,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Device registration failed: ${err}`);
    }

    const data = await res.json();
    return {
      authToken: data.authToken,
      syncGroupId: data.syncGroupId || null,
    };
  }

  public async generatePairCode(
    device: DeviceIdentity,
    authToken: string,
    serverUrl: string
  ): Promise<PairCodeInfo> {
    const url = this.resolveHttpUrl(serverUrl, '/api/pair/generate');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-ID': device.deviceId,
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to generate pair code: ${err}`);
    }

    const data = await res.json();
    return {
      code: data.code,
      expiresAt: data.expiresAt,
    };
  }

  public async requestPairing(
    device: DeviceIdentity,
    authToken: string,
    serverUrl: string,
    code: string
  ): Promise<{ requestId: string; status: string; targetDeviceName: string; targetShortId: string }> {
    const url = this.resolveHttpUrl(serverUrl, '/api/pair/request');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-ID': device.deviceId,
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ code }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Pairing request failed' }));
      throw new Error(err.error || 'Pairing request failed');
    }

    return await res.json();
  }

  public async respondToPairRequest(
    device: DeviceIdentity,
    authToken: string,
    serverUrl: string,
    requestId: string,
    approved: boolean
  ): Promise<{ status: string; syncGroupId?: string; pairedDevices?: PairedDevice[] }> {
    const url = this.resolveHttpUrl(serverUrl, '/api/pair/respond');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-ID': device.deviceId,
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ requestId, approved }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to respond to pair request: ${err}`);
    }

    return await res.json();
  }

  public async pushPendingOperations(
    device: DeviceIdentity,
    authToken: string,
    serverUrl: string,
    operations: SyncOperation[]
  ): Promise<{ acknowledgedIds: string[]; serverRevision: number } | null> {
    if (operations.length === 0 || this.isPushing) return null;

    try {
      this.isPushing = true;
      const url = this.resolveHttpUrl(serverUrl, '/api/sync/push');
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-ID': device.deviceId,
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ operations }),
      });

      if (!res.ok) {
        throw new Error(`Sync push failed with HTTP ${res.status}`);
      }

      const data = await res.json();
      return {
        acknowledgedIds: data.acknowledgedIds || [],
        serverRevision: data.serverRevision || 0,
      };
    } catch (err: any) {
      console.warn('[NEURO//NODE SyncEngine] Sync push error:', err);
      return null;
    } finally {
      this.isPushing = false;
    }
  }

  public async pullRemoteOperations(
    device: DeviceIdentity,
    authToken: string,
    serverUrl: string,
    sinceRevision: number = 0
  ): Promise<{ operations: Array<{ revision: number; operation: SyncOperation }>; currentRevision: number } | null> {
    if (this.isPulling) return null;

    try {
      this.isPulling = true;
      const url = this.resolveHttpUrl(serverUrl, `/api/sync/pull?since=${sinceRevision}`);
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Device-ID': device.deviceId,
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Sync pull failed with HTTP ${res.status}`);
      }

      const data = await res.json();
      return {
        operations: data.operations || [],
        currentRevision: data.currentRevision || 0,
      };
    } catch (err: any) {
      console.warn('[NEURO//NODE SyncEngine] Sync pull error:', err);
      return null;
    } finally {
      this.isPulling = false;
    }
  }

  public async fetchPairedDevices(
    device: DeviceIdentity,
    authToken: string,
    serverUrl: string
  ): Promise<PairedDevice[]> {
    try {
      const url = this.resolveHttpUrl(serverUrl, '/api/devices');
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Device-ID': device.deviceId,
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!res.ok) return [];
      const data = await res.json();
      return data.pairedDevices || [];
    } catch {
      return [];
    }
  }

  public async unpairDevice(
    device: DeviceIdentity,
    authToken: string,
    serverUrl: string,
    targetDeviceId?: string
  ): Promise<boolean> {
    try {
      const url = this.resolveHttpUrl(serverUrl, '/api/devices/unpair');
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-ID': device.deviceId,
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ targetDeviceId: targetDeviceId || device.deviceId }),
      });

      return res.ok;
    } catch {
      return false;
    }
  }

  // ==================== WEBSOCKET CONNECTION ====================

  public connectWebSocket(device: DeviceIdentity, authToken: string, serverUrl: string): void {
    if (typeof window === 'undefined') return;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      let base = serverUrl.trim();
      if (!base) base = window.location.origin;

      const urlObj = new URL(base);
      const wsProtocol = urlObj.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${urlObj.host}/ws?deviceId=${encodeURIComponent(device.deviceId)}&token=${encodeURIComponent(authToken)}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('ONLINE');

        // Setup ping keep-alive
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'PING' }));
          }
        }, 20000);
      };

      this.ws.onmessage = event => {
        try {
          const msg = JSON.parse(event.data);
          this.handleWsMessage(msg);
        } catch (err) {
          console.error('[NEURO//NODE SyncEngine] Failed to parse WS message:', err);
        }
      };

      this.ws.onerror = err => {
        console.warn('[NEURO//NODE SyncEngine] WebSocket error:', err);
        this.setStatus('OFFLINE', 'WebSocket connection error');
      };

      this.ws.onclose = () => {
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }
        this.ws = null;
        this.setStatus('OFFLINE');
        this.scheduleReconnect(device, authToken, serverUrl);
      };
    } catch (err: any) {
      console.warn('[NEURO//NODE SyncEngine] Failed to initiate WS connection:', err);
      this.setStatus('OFFLINE', err.message);
      this.scheduleReconnect(device, authToken, serverUrl);
    }
  }

  private scheduleReconnect(device: DeviceIdentity, authToken: string, serverUrl: string): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return; // Reconnect will trigger on window 'online' event
    }

    this.reconnectAttempts += 1;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 20000);

    this.reconnectTimer = setTimeout(() => {
      this.connectWebSocket(device, authToken, serverUrl);
    }, delay);
  }

  private reconnectWs(): void {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.setStatus('LOCAL_ONLY');
  }

  private handleWsMessage(msg: { type: string; payload?: any }): void {
    switch (msg.type) {
      case 'REMOTE_OPERATIONS': {
        const { operations, latestRevision } = msg.payload || {};
        if (Array.isArray(operations)) {
          const opsToApply: SyncOperation[] = [];
          for (const item of operations) {
            const op: SyncOperation = item.operation || item;
            if (op && op.operationId && !this.hasOperationBeenProcessed(op.operationId)) {
              this.markOperationProcessed(op.operationId);
              opsToApply.push(op);
            }
          }
          if (opsToApply.length > 0) {
            for (const l of this.listeners) {
              l.onRemoteOperations?.(opsToApply, latestRevision || 0);
            }
          }
        }
        break;
      }

      case 'PAIR_REQUEST': {
        const { requestId, requesterDevice } = msg.payload || {};
        if (requestId && requesterDevice) {
          for (const l of this.listeners) {
            l.onPairRequest?.({ requestId, requesterDevice });
          }
        }
        break;
      }

      case 'PAIR_RESOLVED': {
        for (const l of this.listeners) {
          l.onPairResolved?.(msg.payload || { approved: false });
        }
        break;
      }

      case 'PEER_JOINED': {
        for (const l of this.listeners) {
          l.onPeerJoined?.(msg.payload);
        }
        break;
      }

      case 'DEVICE_STATUS': {
        for (const l of this.listeners) {
          l.onDeviceStatus?.(msg.payload);
        }
        break;
      }

      case 'DEVICE_UNPAIRED': {
        for (const l of this.listeners) {
          l.onDeviceUnpaired?.(msg.payload);
        }
        break;
      }

      case 'PONG':
        // Heartbeat received
        break;

      default:
        break;
    }
  }
}

export const syncEngine = new SyncEngine();
