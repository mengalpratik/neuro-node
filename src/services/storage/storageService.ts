import { DashboardState } from '../../types/dashboard';
import { DEFAULT_DASHBOARD_STATE } from './defaultState';
import { createNewDeviceIdentity } from '../device/deviceService';

export const STORAGE_KEY = 'PERSONAL_DASHBOARD_V1';
export const CORRUPTED_BACKUP_KEY = 'PERSONAL_DASHBOARD_V1_CORRUPTED_BACKUP';

/**
 * Checks whether a preserved backup of corrupted localStorage data exists.
 */
export function hasCorruptedStateBackup(): boolean {
  try {
    return !!localStorage.getItem(CORRUPTED_BACKUP_KEY);
  } catch {
    return false;
  }
}

/**
 * Retrieves the preserved raw corrupted state string, if any.
 */
export function getCorruptedStateBackup(): string | null {
  try {
    return localStorage.getItem(CORRUPTED_BACKUP_KEY);
  } catch {
    return null;
  }
}

/**
 * Clears the preserved corrupted state backup.
 */
export function clearCorruptedStateBackup(): void {
  try {
    localStorage.removeItem(CORRUPTED_BACKUP_KEY);
  } catch (err) {
    console.error('[Dashboard Storage] Failed to clear corrupted backup:', err);
  }
}

/**
 * Migrates a valid legacy v1 (or partial v2) state into a full schema v2 state.
 */
export function migrateStateToV2(state: Record<string, unknown>): DashboardState {
  const device =
    state.device && typeof state.device === 'object' && typeof (state.device as any).deviceId === 'string'
      ? (state.device as any)
      : createNewDeviceIdentity();

  const sync =
    state.sync && typeof state.sync === 'object'
      ? {
          enabled: Boolean((state.sync as any).enabled),
          syncGroupId: (state.sync as any).syncGroupId || null,
          lastServerRevision: Number((state.sync as any).lastServerRevision) || 0,
          pendingChanges: Array.isArray((state.sync as any).pendingChanges)
            ? (state.sync as any).pendingChanges
            : [],
          pairedDevices: Array.isArray((state.sync as any).pairedDevices)
            ? (state.sync as any).pairedDevices
            : [],
          serverUrl: typeof (state.sync as any).serverUrl === 'string' ? (state.sync as any).serverUrl : '',
          authToken: (state.sync as any).authToken,
          lastSyncTime: (state.sync as any).lastSyncTime,
          syncStatus: (state.sync as any).syncStatus || 'LOCAL_ONLY',
          syncError: (state.sync as any).syncError,
        }
      : {
          enabled: false,
          syncGroupId: null,
          lastServerRevision: 0,
          pendingChanges: [],
          pairedDevices: [],
          serverUrl: '',
          syncStatus: 'LOCAL_ONLY' as const,
        };

  return {
    version: 1,
    schemaVersion: 2,
    app: 'PersonalDashboard',
    device,
    sync,
    theme: state.theme as any,
    preferences: state.preferences as any,
    bookmarkGroups: state.bookmarkGroups as any,
  };
}

/**
 * Validates whether an unknown object conforms to a valid DashboardState structure.
 */
export function isValidDashboardState(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  const state = obj as Record<string, unknown>;

  if (typeof state.version !== 'number' || state.version < 1) return false;
  if (!Array.isArray(state.bookmarkGroups)) return false;
  if (!state.theme || typeof state.theme !== 'object') return false;
  if (!state.preferences || typeof state.preferences !== 'object') return false;

  // Check each bookmark group
  for (const group of state.bookmarkGroups as unknown[]) {
    if (!group || typeof group !== 'object') return false;
    const g = group as Record<string, unknown>;
    if (typeof g.id !== 'string' || typeof g.title !== 'string') return false;
    if (!Array.isArray(g.bookmarks)) return false;
    for (const bm of g.bookmarks as unknown[]) {
      if (!bm || typeof bm !== 'object') return false;
      const b = bm as Record<string, unknown>;
      if (typeof b.id !== 'string' || typeof b.title !== 'string' || typeof b.url !== 'string') {
        return false;
      }
    }
  }

  return true;
}

/**
 * Loads the dashboard state from localStorage, gracefully falling back to default
 * if uninitialized or corrupted. Automatically migrates legacy v1 states to v2.
 */
export function loadDashboardState(): DashboardState {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveDashboardState(DEFAULT_DASHBOARD_STATE);
      return DEFAULT_DASHBOARD_STATE;
    }

    const parsed = JSON.parse(raw);
    if (isValidDashboardState(parsed)) {
      if (!parsed.schemaVersion || parsed.schemaVersion < 2 || !parsed.device || !parsed.sync) {
        const migrated = migrateStateToV2(parsed);
        saveDashboardState(migrated);
        return migrated;
      }
      return parsed as DashboardState;
    }

    console.warn('[Dashboard Storage] Invalid state structure detected. Preserving backup and restoring defaults.');
    // Preserve corrupted raw state for user safety
    try {
      localStorage.setItem(CORRUPTED_BACKUP_KEY, raw);
    } catch {}
    saveDashboardState(DEFAULT_DASHBOARD_STATE);
    return DEFAULT_DASHBOARD_STATE;
  } catch (err) {
    console.error('[Dashboard Storage] Malformed JSON or read failure in localStorage. Preserving backup.', err);
    if (raw) {
      try {
        localStorage.setItem(CORRUPTED_BACKUP_KEY, raw);
      } catch {}
    }
    saveDashboardState(DEFAULT_DASHBOARD_STATE);
    return DEFAULT_DASHBOARD_STATE;
  }
}

/**
 * Safely persists dashboard state to localStorage.
 */
export function saveDashboardState(state: DashboardState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.error('[Dashboard Storage] Failed to write to localStorage:', err);
    return false;
  }
}

/**
 * Resets dashboard state back to factory defaults.
 */
export function resetDashboardState(): DashboardState {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('[Dashboard Storage] Failed to reset localStorage:', err);
  }
  saveDashboardState(DEFAULT_DASHBOARD_STATE);
  return DEFAULT_DASHBOARD_STATE;
}
