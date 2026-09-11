export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
  createdAt?: number;
}

export interface BookmarkGroup {
  id: string;
  title: string;
  bookmarks: BookmarkItem[];
  order: number;
}

export type BackgroundType = 'solid' | 'gradient' | 'wallpaper' | 'custom';

export interface ThemeSettings {
  backgroundType: BackgroundType;
  backgroundValue: string;
  accentColor: string;
  accentRgb: string;
  secondaryColor: string;
  glassOpacity: number; // 0.2 to 0.95
  glassBlur: number; // in px, e.g. 12 to 24
  borderIntensity: number; // 0.05 to 0.5
  themePreset: 'matrix' | 'cyberpunk' | 'amber' | 'crimson' | 'obsidian' | 'custom';
}

export interface WeatherPreferences {
  city: string;
  lat: number;
  lon: number;
  units: 'metric' | 'imperial';
  autoDetect: boolean;
}

export interface GoogleIntegrationSettings {
  enabled: boolean;
  clientId: string;
}

export interface LocalEventReminder {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  category: 'event' | 'reminder' | 'task';
  completed?: boolean;
}

export interface UserPreferences {
  timeFormat: '12h' | '24h';
  weather: WeatherPreferences;
  google: GoogleIntegrationSettings;
  reminders: LocalEventReminder[];
}

export interface DeviceIdentity {
  deviceId: string;
  deviceName: string;
  shortId: string;
  createdAt: number;
  lastSeenAt: number;
}

export type SyncOperationType =
  | 'BOOKMARK_ADD'
  | 'BOOKMARK_UPDATE'
  | 'BOOKMARK_DELETE'
  | 'BOOKMARK_MOVE'
  | 'BOOKMARK_REORDER'
  | 'GROUP_ADD'
  | 'GROUP_UPDATE'
  | 'GROUP_DELETE'
  | 'GROUP_MOVE'
  | 'GROUP_REORDER'
  | 'TASK_ADD'
  | 'TASK_UPDATE'
  | 'TASK_DELETE'
  | 'THEME_UPDATE'
  | 'PREFERENCES_UPDATE';

export interface SyncOperation {
  operationId: string;
  deviceId: string;
  entityId: string;
  type: SyncOperationType;
  timestamp: number;
  payload: any;
}

export interface PairedDevice {
  deviceId: string;
  deviceName: string;
  shortId: string;
  pairedAt: number;
  lastSeenAt: number;
  isOnline: boolean;
}

export type SyncConnectionStatus = 'LOCAL_ONLY' | 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'SYNCED' | 'ERROR';

export interface SyncState {
  enabled: boolean;
  syncGroupId: string | null;
  lastServerRevision: number;
  pendingChanges: SyncOperation[];
  pairedDevices: PairedDevice[];
  serverUrl: string;
  authToken?: string;
  lastSyncTime?: number;
  syncStatus: SyncConnectionStatus;
  syncError?: string;
}

export interface PairCodeInfo {
  code: string;
  expiresAt: number;
}

export interface PairRequestInfo {
  requestId: string;
  requesterDevice: {
    deviceId: string;
    deviceName: string;
    shortId: string;
    timestamp: number;
  };
}

export interface DashboardState {
  version: number;
  schemaVersion?: number;
  app: 'PersonalDashboard';
  device: DeviceIdentity;
  sync: SyncState;
  theme: ThemeSettings;
  preferences: UserPreferences;
  bookmarkGroups: BookmarkGroup[];
}

export interface DashboardBackup {
  app: 'PersonalDashboard';
  version: number;
  exportedAt: string;
  theme: ThemeSettings;
  preferences: UserPreferences;
  bookmarkGroups: BookmarkGroup[];
}

export type ImportDataStrategy = 'replace' | 'merge';
export type ImportStylingStrategy = 'apply' | 'keep';

export interface ImportOptions {
  dataStrategy: ImportDataStrategy;
  stylingStrategy: ImportStylingStrategy;
}

export interface ImportValidationResult {
  valid: boolean;
  error?: string;
  data?: DashboardBackup;
  stats?: {
    groupsCount: number;
    bookmarksCount: number;
  };
}
