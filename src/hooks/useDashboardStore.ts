import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BookmarkGroup,
  BookmarkItem,
  DashboardBackup,
  DashboardState,
  ImportOptions,
  LocalEventReminder,
  PairCodeInfo,
  PairRequestInfo,
  SyncConnectionStatus,
  SyncOperation,
  ThemeSettings,
  UserPreferences,
  WeatherPreferences,
} from '../types/dashboard';
import {
  loadDashboardState,
  saveDashboardState,
  resetDashboardState,
} from '../services/storage/storageService';
import { applyImportedData } from '../services/backup/mergeService';
import { isValidWebUrl } from '../services/backup/importService';
import { createSyncOperation, applySyncOperation } from '../services/sync/syncOperations';
import { syncEngine } from '../services/sync/syncEngine';
import { multiTabSync } from '../services/sync/multiTabSync';

export function useDashboardStore() {
  const [state, setState] = useState<DashboardState>(() => loadDashboardState());
  const [pendingPairRequest, setPendingPairRequest] = useState<PairRequestInfo | null>(null);

  const stateRef = useRef(state);
  stateRef.current = state;

  const isInternalUpdateRef = useRef(false);

  // Save to localStorage whenever state updates & broadcast across tabs
  useEffect(() => {
    saveDashboardState(state);
    if (!isInternalUpdateRef.current) {
      multiTabSync.broadcast({ type: 'STATE_CHANGED', timestamp: Date.now() });
    }
    isInternalUpdateRef.current = false;
  }, [state]);

  // Apply CSS variables on DOM based on theme state
  useEffect(() => {
    const root = document.documentElement;
    const { theme } = state;
    root.style.setProperty('--accent-color', theme.accentColor);
    root.style.setProperty('--accent-rgb', theme.accentRgb);
    root.style.setProperty('--text-secondary', theme.secondaryColor);
    root.style.setProperty('--glass-opacity', theme.glassOpacity.toString());
    root.style.setProperty('--glass-blur', `${theme.glassBlur}px`);
    root.style.setProperty('--border-intensity', theme.borderIntensity.toString());
  }, [state.theme]);

  // Listen to multi-tab sync
  useEffect(() => {
    const unsubscribe = multiTabSync.subscribe(msg => {
      if (msg.type === 'STATE_CHANGED') {
        isInternalUpdateRef.current = true;
        const fresh = loadDashboardState();
        setState(fresh);
      }
    });
    return unsubscribe;
  }, []);

  // Helper to append pending sync operation if sync is enabled
  const appendPendingOperation = useCallback((op: SyncOperation) => {
    setState(prev => {
      if (!prev.sync.enabled) return prev;
      return {
        ...prev,
        sync: {
          ...prev.sync,
          pendingChanges: [...prev.sync.pendingChanges, op],
        },
      };
    });
  }, []);

  // ==================== BOOKMARK GROUPS ====================

  const addGroup = useCallback((title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const newGroup: BookmarkGroup = {
      id: `grp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: trimmed,
      order: stateRef.current.bookmarkGroups.length,
      bookmarks: [],
    };

    setState(prev => ({
      ...prev,
      bookmarkGroups: [...prev.bookmarkGroups, newGroup],
    }));

    const op = createSyncOperation(stateRef.current.device.deviceId, 'GROUP_ADD', newGroup.id, newGroup);
    syncEngine.markOperationProcessed(op.operationId);
    appendPendingOperation(op);
  }, [appendPendingOperation]);

  const renameGroup = useCallback((groupId: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    setState(prev => ({
      ...prev,
      bookmarkGroups: prev.bookmarkGroups.map(g =>
        g.id === groupId ? { ...g, title: trimmed } : g
      ),
    }));

    const op = createSyncOperation(stateRef.current.device.deviceId, 'GROUP_UPDATE', groupId, {
      groupId,
      title: trimmed,
    });
    syncEngine.markOperationProcessed(op.operationId);
    appendPendingOperation(op);
  }, [appendPendingOperation]);

  const deleteGroup = useCallback((groupId: string) => {
    setState(prev => ({
      ...prev,
      bookmarkGroups: prev.bookmarkGroups
        .filter(g => g.id !== groupId)
        .map((g, idx) => ({ ...g, order: idx })),
    }));

    const op = createSyncOperation(stateRef.current.device.deviceId, 'GROUP_DELETE', groupId, {
      groupId,
    });
    syncEngine.markOperationProcessed(op.operationId);
    appendPendingOperation(op);
  }, [appendPendingOperation]);

  const moveGroup = useCallback((groupId: string, direction: 'left' | 'right') => {
    setState(prev => {
      const groups = [...prev.bookmarkGroups];
      const index = groups.findIndex(g => g.id === groupId);
      if (index < 0) return prev;

      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= groups.length) return prev;

      const [moved] = groups.splice(index, 1);
      groups.splice(targetIndex, 0, moved);

      return {
        ...prev,
        bookmarkGroups: groups.map((g, idx) => ({ ...g, order: idx })),
      };
    });

    const op = createSyncOperation(stateRef.current.device.deviceId, 'GROUP_MOVE', groupId, {
      groupId,
      direction,
    });
    syncEngine.markOperationProcessed(op.operationId);
    appendPendingOperation(op);
  }, [appendPendingOperation]);

  const reorderGroups = useCallback((startIndex: number, endIndex: number) => {
    setState(prev => {
      const groups = [...prev.bookmarkGroups];
      if (startIndex < 0 || startIndex >= groups.length || endIndex < 0 || endIndex >= groups.length) {
        return prev;
      }
      const [moved] = groups.splice(startIndex, 1);
      groups.splice(endIndex, 0, moved);

      return {
        ...prev,
        bookmarkGroups: groups.map((g, idx) => ({ ...g, order: idx })),
      };
    });

    const op = createSyncOperation(stateRef.current.device.deviceId, 'GROUP_REORDER', 'groups', {
      startIndex,
      endIndex,
    });
    syncEngine.markOperationProcessed(op.operationId);
    appendPendingOperation(op);
  }, [appendPendingOperation]);

  // ==================== BOOKMARKS ====================

  const addBookmark = useCallback((groupId: string, title: string, url: string) => {
    let cleanUrl = url.trim();
    if (!cleanUrl) return;
    if (!isValidWebUrl(cleanUrl)) return;
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }
    if (!isValidWebUrl(cleanUrl)) return;

    let cleanTitle = title.trim();
    try {
      if (!cleanTitle) cleanTitle = new URL(cleanUrl).hostname;
    } catch {
      cleanTitle = cleanTitle || 'Bookmark';
    }

    const newBookmark: BookmarkItem = {
      id: `bm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: cleanTitle,
      url: cleanUrl,
      createdAt: Date.now(),
    };

    setState(prev => ({
      ...prev,
      bookmarkGroups: prev.bookmarkGroups.map(group => {
        if (group.id !== groupId) return group;
        return {
          ...group,
          bookmarks: [...group.bookmarks, newBookmark],
        };
      }),
    }));

    const op = createSyncOperation(stateRef.current.device.deviceId, 'BOOKMARK_ADD', newBookmark.id, {
      groupId,
      bookmark: newBookmark,
    });
    syncEngine.markOperationProcessed(op.operationId);
    appendPendingOperation(op);
  }, [appendPendingOperation]);

  const editBookmark = useCallback((groupId: string, bookmarkId: string, title: string, url: string) => {
    let cleanUrl = url.trim();
    if (!cleanUrl) return;
    if (!isValidWebUrl(cleanUrl)) return;
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }
    if (!isValidWebUrl(cleanUrl)) return;

    let cleanTitle = title.trim();
    try {
      if (!cleanTitle) cleanTitle = new URL(cleanUrl).hostname;
    } catch {
      cleanTitle = cleanTitle || 'Bookmark';
    }

    setState(prev => ({
      ...prev,
      bookmarkGroups: prev.bookmarkGroups.map(group => {
        if (group.id !== groupId) return group;
        return {
          ...group,
          bookmarks: group.bookmarks.map(bm =>
            bm.id === bookmarkId ? { ...bm, title: cleanTitle, url: cleanUrl } : bm
          ),
        };
      }),
    }));

    const op = createSyncOperation(stateRef.current.device.deviceId, 'BOOKMARK_UPDATE', bookmarkId, {
      groupId,
      bookmarkId,
      title: cleanTitle,
      url: cleanUrl,
    });
    syncEngine.markOperationProcessed(op.operationId);
    appendPendingOperation(op);
  }, [appendPendingOperation]);

  const deleteBookmark = useCallback((groupId: string, bookmarkId: string) => {
    setState(prev => ({
      ...prev,
      bookmarkGroups: prev.bookmarkGroups.map(group => {
        if (group.id !== groupId) return group;
        return {
          ...group,
          bookmarks: group.bookmarks.filter(bm => bm.id !== bookmarkId),
        };
      }),
    }));

    const op = createSyncOperation(stateRef.current.device.deviceId, 'BOOKMARK_DELETE', bookmarkId, {
      groupId,
      bookmarkId,
    });
    syncEngine.markOperationProcessed(op.operationId);
    appendPendingOperation(op);
  }, [appendPendingOperation]);

  const moveBookmark = useCallback((groupId: string, bookmarkId: string, direction: 'up' | 'down') => {
    setState(prev => ({
      ...prev,
      bookmarkGroups: prev.bookmarkGroups.map(group => {
        if (group.id !== groupId) return group;
        const bms = [...group.bookmarks];
        const index = bms.findIndex(b => b.id === bookmarkId);
        if (index < 0) return group;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= bms.length) return group;

        const [moved] = bms.splice(index, 1);
        bms.splice(targetIndex, 0, moved);

        return {
          ...group,
          bookmarks: bms,
        };
      }),
    }));

    const op = createSyncOperation(stateRef.current.device.deviceId, 'BOOKMARK_MOVE', bookmarkId, {
      groupId,
      bookmarkId,
      direction,
    });
    syncEngine.markOperationProcessed(op.operationId);
    appendPendingOperation(op);
  }, [appendPendingOperation]);

  const reorderBookmarks = useCallback((groupId: string, startIndex: number, endIndex: number) => {
    setState(prev => ({
      ...prev,
      bookmarkGroups: prev.bookmarkGroups.map(group => {
        if (group.id !== groupId) return group;
        const bms = [...group.bookmarks];
        if (startIndex < 0 || startIndex >= bms.length || endIndex < 0 || endIndex >= bms.length) {
          return group;
        }
        const [moved] = bms.splice(startIndex, 1);
        bms.splice(endIndex, 0, moved);

        return {
          ...group,
          bookmarks: bms,
        };
      }),
    }));

    const op = createSyncOperation(stateRef.current.device.deviceId, 'BOOKMARK_REORDER', groupId, {
      groupId,
      startIndex,
      endIndex,
    });
    syncEngine.markOperationProcessed(op.operationId);
    appendPendingOperation(op);
  }, [appendPendingOperation]);

  // ==================== THEME & PREFERENCES ====================

  const updateTheme = useCallback((partial: Partial<ThemeSettings>) => {
    setState(prev => ({
      ...prev,
      theme: {
        ...prev.theme,
        ...partial,
      },
    }));

    const op = createSyncOperation(stateRef.current.device.deviceId, 'THEME_UPDATE', 'theme', {
      theme: partial,
    });
    syncEngine.markOperationProcessed(op.operationId);
    appendPendingOperation(op);
  }, [appendPendingOperation]);

  const updateWeatherPreferences = useCallback((partial: Partial<WeatherPreferences>) => {
    setState(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        weather: {
          ...prev.preferences.weather,
          ...partial,
        },
      },
    }));

    const op = createSyncOperation(stateRef.current.device.deviceId, 'PREFERENCES_UPDATE', 'weather', {
      preferences: { weather: partial },
    });
    syncEngine.markOperationProcessed(op.operationId);
    appendPendingOperation(op);
  }, [appendPendingOperation]);

  const updatePreferences = useCallback((partial: Partial<UserPreferences>) => {
    setState(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        ...partial,
      },
    }));

    const op = createSyncOperation(stateRef.current.device.deviceId, 'PREFERENCES_UPDATE', 'preferences', {
      preferences: partial,
    });
    syncEngine.markOperationProcessed(op.operationId);
    appendPendingOperation(op);
  }, [appendPendingOperation]);

  // ==================== REMINDERS / EVENTS ====================

  const addReminder = useCallback((reminder: Omit<LocalEventReminder, 'id'>) => {
    const newReminder: LocalEventReminder = {
      ...reminder,
      id: `rem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };

    setState(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        reminders: [...prev.preferences.reminders, newReminder],
      },
    }));

    const op = createSyncOperation(stateRef.current.device.deviceId, 'TASK_ADD', newReminder.id, {
      reminder: newReminder,
    });
    syncEngine.markOperationProcessed(op.operationId);
    appendPendingOperation(op);
  }, [appendPendingOperation]);

  const toggleReminder = useCallback((id: string) => {
    let toggledVal = false;
    setState(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        reminders: prev.preferences.reminders.map(r => {
          if (r.id === id) {
            toggledVal = !r.completed;
            return { ...r, completed: toggledVal };
          }
          return r;
        }),
      },
    }));

    const op = createSyncOperation(stateRef.current.device.deviceId, 'TASK_UPDATE', id, {
      reminderId: id,
      updates: { completed: toggledVal },
    });
    syncEngine.markOperationProcessed(op.operationId);
    appendPendingOperation(op);
  }, [appendPendingOperation]);

  const deleteReminder = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        reminders: prev.preferences.reminders.filter(r => r.id !== id),
      },
    }));

    const op = createSyncOperation(stateRef.current.device.deviceId, 'TASK_DELETE', id, {
      reminderId: id,
    });
    syncEngine.markOperationProcessed(op.operationId);
    appendPendingOperation(op);
  }, [appendPendingOperation]);

  // ==================== IMPORT & RESET ====================

  const importBackup = useCallback((backup: DashboardBackup, options: ImportOptions) => {
    setState(prev => applyImportedData(prev, backup, options));
  }, []);

  const resetToDefaults = useCallback(() => {
    const defaults = resetDashboardState();
    setState(defaults);
  }, []);

  // ==================== DEVICE & SYNC OPERATIONS ====================

  const renameDevice = useCallback((deviceName: string) => {
    const trimmed = deviceName.trim();
    if (!trimmed) return;
    setState(prev => ({
      ...prev,
      device: {
        ...prev.device,
        deviceName: trimmed,
      },
    }));
  }, []);

  const toggleSync = useCallback((enabled?: boolean) => {
    setState(prev => {
      const nextVal = enabled !== undefined ? enabled : !prev.sync.enabled;
      return {
        ...prev,
        sync: {
          ...prev.sync,
          enabled: nextVal,
          syncStatus: nextVal ? (prev.sync.syncGroupId ? 'ONLINE' : 'LOCAL_ONLY') : 'LOCAL_ONLY',
        },
      };
    });
  }, []);

  const setServerUrl = useCallback((url: string) => {
    setState(prev => ({
      ...prev,
      sync: {
        ...prev.sync,
        serverUrl: url.trim(),
      },
    }));
  }, []);

  const clearPairRequest = useCallback(() => {
    setPendingPairRequest(null);
  }, []);

  const generatePairCode = useCallback(async (): Promise<PairCodeInfo> => {
    const s = stateRef.current;
    let token = s.sync.authToken;

    if (!token) {
      const reg = await syncEngine.registerDevice(s.device, s.sync.serverUrl);
      token = reg.authToken;
      setState(prev => ({
        ...prev,
        sync: {
          ...prev.sync,
          authToken: reg.authToken,
          syncGroupId: reg.syncGroupId || prev.sync.syncGroupId,
        },
      }));
    }

    return await syncEngine.generatePairCode(s.device, token, s.sync.serverUrl);
  }, []);

  const requestPairing = useCallback(async (code: string) => {
    const s = stateRef.current;
    let token = s.sync.authToken;

    if (!token) {
      const reg = await syncEngine.registerDevice(s.device, s.sync.serverUrl);
      token = reg.authToken;
      setState(prev => ({
        ...prev,
        sync: {
          ...prev.sync,
          authToken: reg.authToken,
          syncGroupId: reg.syncGroupId || prev.sync.syncGroupId,
        },
      }));
    }

    return await syncEngine.requestPairing(s.device, token, s.sync.serverUrl, code);
  }, []);

  const respondToPairRequest = useCallback(async (requestId: string, approved: boolean) => {
    const s = stateRef.current;
    const token = s.sync.authToken;
    if (!token) throw new Error('Device not authenticated');

    const res = await syncEngine.respondToPairRequest(s.device, token, s.sync.serverUrl, requestId, approved);
    setPendingPairRequest(null);

    if (approved && res.syncGroupId) {
      setState(prev => ({
        ...prev,
        sync: {
          ...prev.sync,
          enabled: true,
          syncGroupId: res.syncGroupId || prev.sync.syncGroupId,
          pairedDevices: res.pairedDevices || prev.sync.pairedDevices,
          syncStatus: 'SYNCED',
        },
      }));

      // Flush local state as initial convergence operations
      const initialOps: SyncOperation[] = [];
      for (const grp of s.bookmarkGroups) {
        initialOps.push(createSyncOperation(s.device.deviceId, 'GROUP_ADD', grp.id, grp));
        for (const bm of grp.bookmarks) {
          initialOps.push(
            createSyncOperation(s.device.deviceId, 'BOOKMARK_ADD', bm.id, {
              groupId: grp.id,
              bookmark: bm,
            })
          );
        }
      }
      if (initialOps.length > 0) {
        await syncEngine.pushPendingOperations(s.device, token, s.sync.serverUrl, initialOps);
      }
    }

    return res;
  }, []);

  const unpairDevice = useCallback(async (targetDeviceId?: string) => {
    const s = stateRef.current;
    const token = s.sync.authToken;
    if (!token) return false;

    const ok = await syncEngine.unpairDevice(s.device, token, s.sync.serverUrl, targetDeviceId);
    if (ok) {
      const isSelf = !targetDeviceId || targetDeviceId === s.device.deviceId;
      setState(prev => {
        if (isSelf) {
          return {
            ...prev,
            sync: {
              ...prev.sync,
              syncGroupId: null,
              pairedDevices: [],
              lastServerRevision: 0,
              syncStatus: 'LOCAL_ONLY',
            },
          };
        } else {
          return {
            ...prev,
            sync: {
              ...prev.sync,
              pairedDevices: prev.sync.pairedDevices.filter(d => d.deviceId !== targetDeviceId),
            },
          };
        }
      });
    }
    return ok;
  }, []);

  const triggerManualSync = useCallback(async () => {
    const s = stateRef.current;
    if (!s.sync.enabled || !s.sync.authToken || !s.sync.syncGroupId) return;

    setState(prev => ({
      ...prev,
      sync: { ...prev.sync, syncStatus: 'SYNCING' },
    }));

    try {
      // 1. Push pending
      if (s.sync.pendingChanges.length > 0) {
        const pushRes = await syncEngine.pushPendingOperations(
          s.device,
          s.sync.authToken,
          s.sync.serverUrl,
          s.sync.pendingChanges
        );
        if (pushRes) {
          setState(prev => ({
            ...prev,
            sync: {
              ...prev.sync,
              pendingChanges: prev.sync.pendingChanges.filter(
                op => !pushRes.acknowledgedIds.includes(op.operationId)
              ),
              lastServerRevision: Math.max(prev.sync.lastServerRevision, pushRes.serverRevision),
            },
          }));
        }
      }

      // 2. Pull remote
      const pullRes = await syncEngine.pullRemoteOperations(
        s.device,
        s.sync.authToken,
        s.sync.serverUrl,
        s.sync.lastServerRevision
      );

      if (pullRes && pullRes.operations.length > 0) {
        setState(prev => {
          let updated = { ...prev };
          for (const item of pullRes.operations) {
            const op = item.operation;
            if (op && !syncEngine.hasOperationBeenProcessed(op.operationId)) {
              syncEngine.markOperationProcessed(op.operationId);
              updated = applySyncOperation(updated, op);
            }
          }
          return {
            ...updated,
            sync: {
              ...updated.sync,
              lastServerRevision: Math.max(prev.sync.lastServerRevision, pullRes.currentRevision),
              lastSyncTime: Date.now(),
              syncStatus: 'SYNCED',
            },
          };
        });
      } else {
        setState(prev => ({
          ...prev,
          sync: {
            ...prev.sync,
            lastSyncTime: Date.now(),
            syncStatus: prev.sync.pendingChanges.length === 0 ? 'SYNCED' : 'ONLINE',
          },
        }));
      }

      // 3. Refresh paired devices
      const devices = await syncEngine.fetchPairedDevices(s.device, s.sync.authToken, s.sync.serverUrl);
      if (devices.length > 0) {
        setState(prev => ({
          ...prev,
          sync: {
            ...prev.sync,
            pairedDevices: devices,
          },
        }));
      }
    } catch (err: any) {
      console.warn('[NEURO//NODE Sync] Manual sync error:', err);
      setState(prev => ({
        ...prev,
        sync: {
          ...prev.sync,
          syncStatus: 'ERROR',
          syncError: err.message,
        },
      }));
    }
  }, []);

  // ==================== SYNC ENGINE BACKGROUND LIFECYCLE ====================

  useEffect(() => {
    if (!state.sync.enabled) {
      syncEngine.disconnect();
      return;
    }

    let isMounted = true;

    // Device registration & auth setup
    const setupAuth = async () => {
      try {
        if (!state.sync.authToken) {
          const reg = await syncEngine.registerDevice(state.device, state.sync.serverUrl);
          if (isMounted) {
            setState(prev => ({
              ...prev,
              sync: {
                ...prev.sync,
                authToken: reg.authToken,
                syncGroupId: reg.syncGroupId || prev.sync.syncGroupId,
              },
            }));
          }
        }
      } catch (err) {
        console.warn('[NEURO//NODE Sync] Registration failed:', err);
      }
    };

    setupAuth();

    return () => {
      isMounted = false;
    };
  }, [state.sync.enabled, state.sync.serverUrl, state.sync.authToken, state.device]);

  useEffect(() => {
    if (!state.sync.enabled || !state.sync.authToken) return;

    // Connect WebSocket
    syncEngine.connectWebSocket(state.device, state.sync.authToken, state.sync.serverUrl);

    // Register sync engine listeners
    const unsubscribe = syncEngine.addListener({
      onStatusChange: (status, error) => {
        if (status === 'ONLINE') {
          triggerManualSync();
        }
        setState(prev => {
          if (!prev.sync.enabled) return prev;
          let computedStatus: SyncConnectionStatus = status;
          if (status === 'ONLINE' && prev.sync.pendingChanges.length === 0) {
            computedStatus = 'SYNCED';
          }
          return {
            ...prev,
            sync: {
              ...prev.sync,
              syncStatus: computedStatus,
              syncError: error,
            },
          };
        });
      },

      onRemoteOperations: (operations, latestRevision) => {
        setState(prev => {
          let updated = { ...prev };
          for (const op of operations) {
            updated = applySyncOperation(updated, op);
          }
          return {
            ...updated,
            sync: {
              ...updated.sync,
              lastServerRevision: Math.max(prev.sync.lastServerRevision, latestRevision),
              lastSyncTime: Date.now(),
              syncStatus: 'SYNCED',
            },
          };
        });
      },

      onPairRequest: info => {
        setPendingPairRequest(info);
      },

      onPairResolved: async payload => {
        if (payload.approved && payload.syncGroupId) {
          setState(prev => ({
            ...prev,
            sync: {
              ...prev.sync,
              syncGroupId: payload.syncGroupId || prev.sync.syncGroupId,
              pairedDevices: payload.pairedDevices || prev.sync.pairedDevices,
              syncStatus: 'SYNCED',
            },
          }));

          // Trigger initial convergence pull/push
          const s = stateRef.current;
          if (s.sync.authToken) {
            const pullRes = await syncEngine.pullRemoteOperations(
              s.device,
              s.sync.authToken,
              s.sync.serverUrl,
              0
            );
            if (pullRes && pullRes.operations.length > 0) {
              setState(p => {
                let merged = { ...p };
                for (const item of pullRes.operations) {
                  const op = item.operation;
                  if (op && !syncEngine.hasOperationBeenProcessed(op.operationId)) {
                    syncEngine.markOperationProcessed(op.operationId);
                    merged = applySyncOperation(merged, op);
                  }
                }
                return {
                  ...merged,
                  sync: {
                    ...merged.sync,
                    lastServerRevision: Math.max(p.sync.lastServerRevision, pullRes.currentRevision),
                    lastSyncTime: Date.now(),
                  },
                };
              });
            }
          }
        }
      },

      onPeerJoined: payload => {
        setState(prev => ({
          ...prev,
          sync: {
            ...prev.sync,
            syncGroupId: payload.syncGroupId || prev.sync.syncGroupId,
            pairedDevices: payload.pairedDevices || prev.sync.pairedDevices,
          },
        }));
      },

      onDeviceStatus: payload => {
        setState(prev => ({
          ...prev,
          sync: {
            ...prev.sync,
            pairedDevices: prev.sync.pairedDevices.map(d =>
              d.deviceId === payload.deviceId ? { ...d, isOnline: payload.isOnline } : d
            ),
          },
        }));
      },

      onDeviceUnpaired: payload => {
        const currentDevId = stateRef.current.device.deviceId;
        if (payload.deviceId === currentDevId) {
          setState(prev => ({
            ...prev,
            sync: {
              ...prev.sync,
              syncGroupId: null,
              pairedDevices: [],
              lastServerRevision: 0,
              syncStatus: 'LOCAL_ONLY',
            },
          }));
        } else {
          setState(prev => ({
            ...prev,
            sync: {
              ...prev.sync,
              pairedDevices: prev.sync.pairedDevices.filter(d => d.deviceId !== payload.deviceId),
            },
          }));
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, [state.sync.enabled, state.sync.authToken, state.sync.serverUrl, state.device]);

  // Auto flush pending changes whenever pendingChanges changes or status is online
  useEffect(() => {
    if (!state.sync.enabled || !state.sync.authToken || !state.sync.syncGroupId) return;
    if (state.sync.pendingChanges.length === 0) return;

    const timer = setTimeout(() => {
      triggerManualSync();
    }, 300);

    return () => clearTimeout(timer);
  }, [
    state.sync.enabled,
    state.sync.authToken,
    state.sync.syncGroupId,
    state.sync.pendingChanges.length,
    triggerManualSync,
  ]);

  // Flush queued pending changes when browser comes back online
  useEffect(() => {
    const handleOnline = () => {
      if (stateRef.current.sync.enabled && stateRef.current.sync.syncGroupId) {
        triggerManualSync();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [triggerManualSync]);

  return {
    state,
    addGroup,
    renameGroup,
    deleteGroup,
    moveGroup,
    reorderGroups,
    addBookmark,
    editBookmark,
    deleteBookmark,
    moveBookmark,
    reorderBookmarks,
    updateTheme,
    updateWeatherPreferences,
    updatePreferences,
    addReminder,
    toggleReminder,
    deleteReminder,
    importBackup,
    resetToDefaults,
    // Phase 2 Multi-device sync methods
    renameDevice,
    toggleSync,
    setServerUrl,
    generatePairCode,
    requestPairing,
    respondToPairRequest,
    unpairDevice,
    pendingPairRequest,
    clearPairRequest,
    triggerManualSync,
  };
}
