export interface RegisteredDevice {
  deviceId: string;
  deviceName: string;
  shortId: string;
  authToken: string;
  syncGroupId: string | null;
  createdAt: number;
  lastSeenAt: number;
}

export interface PairCodeRecord {
  code: string;
  codeHash: string;
  deviceId: string;
  deviceName: string;
  shortId: string;
  createdAt: number;
  expiresAt: number;
  status: string;
  requesterDevice: any;
  approvedGroupId: string | null;
}

export interface SyncGroupRecord {
  syncGroupId: string;
  memberDeviceIds: string[];
  revisionCounter: number;
  operations: any[];
}

export interface SyncDatabaseInstance {
  devices: Map<string, RegisteredDevice>;
  pairingCodes: Map<string, PairCodeRecord>;
  syncGroups: Map<string, SyncGroupRecord>;
  registerDevice(deviceId: string, deviceName?: string, shortId?: string): RegisteredDevice;
  authenticate(deviceId: string, token: string): RegisteredDevice | null;
  createPairCode(device: RegisteredDevice): { code: string; expiresAt: number; codeHash: string };
  findPairCode(rawCode: string): PairCodeRecord | null;
  createOrJoinSyncGroup(deviceAId: string, deviceBId: string): SyncGroupRecord | null;
  getGroup(groupId: string): SyncGroupRecord | undefined;
  getGroupDevices(groupId: string): Array<{ deviceId: string; deviceName: string; shortId: string; lastSeenAt: number }>;
  pushOperations(groupId: string, deviceId: string, operations: any[]): { acknowledgedIds: string[]; serverRevision: number; newRevisions: any[] } | null;
  pullOperations(groupId: string, sinceRevision?: number): { operations: Array<{ revision: number; operation: any }>; currentRevision: number };
  unpairDevice(deviceId: string): boolean;
  getDevice(deviceId: string): RegisteredDevice | undefined;
}

export const db: SyncDatabaseInstance;
export function createServer(): { server: any; wss: any };
export const hub: any;
