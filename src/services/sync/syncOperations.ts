import {
  BookmarkGroup,
  DashboardState,
  LocalEventReminder,
  SyncOperation,
  SyncOperationType,
} from '../../types/dashboard';

export function normalizeBookmarkUrl(raw: string): string {
  if (!raw) return '';
  try {
    let clean = raw.trim();
    const lower = clean.toLowerCase();
    if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
      clean = `https://${clean}`;
    }
    const u = new URL(clean);
    let href = `${u.protocol.toLowerCase()}//${u.host.toLowerCase()}${u.pathname}`;
    href = href.replace(/\/+$/, '');
    if (u.search) href += u.search;
    return href;
  } catch {
    return raw.trim().toLowerCase().replace(/\/+$/, '');
  }
}

export function createSyncOperation(
  deviceId: string,
  type: SyncOperationType,
  entityId: string,
  payload: any
): SyncOperation {
  const timestamp = Date.now();
  const rand = Math.random().toString(36).substring(2, 8);
  const operationId = `op_${timestamp}_${rand}`;

  return {
    operationId,
    deviceId,
    entityId,
    type,
    timestamp,
    payload,
  };
}

export function applySyncOperation(state: DashboardState, op: SyncOperation): DashboardState {
  if (!op || !op.type) return state;

  switch (op.type) {
    case 'GROUP_ADD': {
      const newGroup = op.payload as BookmarkGroup;
      if (!newGroup || !newGroup.title) return state;

      // Check if group with same ID already exists
      const existingById = state.bookmarkGroups.find(g => g.id === newGroup.id);
      if (existingById) return state;

      // Check if group with same normalized title already exists
      const existingByTitle = state.bookmarkGroups.find(
        g => g.title.trim().toLowerCase() === newGroup.title.trim().toLowerCase()
      );
      if (existingByTitle) {
        // Merge bookmarks with URL deduplication
        const existingNormUrls = new Set(
          existingByTitle.bookmarks.map(b => normalizeBookmarkUrl(b.url))
        );
        const uniqueBookmarks = (newGroup.bookmarks || []).filter(
          b => !existingNormUrls.has(normalizeBookmarkUrl(b.url))
        );

        return {
          ...state,
          bookmarkGroups: state.bookmarkGroups.map(g =>
            g.id === existingByTitle.id
              ? { ...g, bookmarks: [...g.bookmarks, ...uniqueBookmarks] }
              : g
          ),
        };
      }

      return {
        ...state,
        bookmarkGroups: [
          ...state.bookmarkGroups,
          {
            ...newGroup,
            order: state.bookmarkGroups.length,
            bookmarks: newGroup.bookmarks || [],
          },
        ],
      };
    }

    case 'GROUP_UPDATE': {
      const { groupId, title } = op.payload || {};
      if (!groupId || !title) return state;
      return {
        ...state,
        bookmarkGroups: state.bookmarkGroups.map(g =>
          g.id === groupId ? { ...g, title: title.trim() } : g
        ),
      };
    }

    case 'GROUP_DELETE': {
      const { groupId } = op.payload || {};
      if (!groupId) return state;
      return {
        ...state,
        bookmarkGroups: state.bookmarkGroups
          .filter(g => g.id !== groupId)
          .map((g, idx) => ({ ...g, order: idx })),
      };
    }

    case 'GROUP_MOVE': {
      const { groupId, direction } = op.payload || {};
      if (!groupId || !direction) return state;
      const groups = [...state.bookmarkGroups];
      const index = groups.findIndex(g => g.id === groupId);
      if (index < 0) return state;

      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= groups.length) return state;

      const [moved] = groups.splice(index, 1);
      groups.splice(targetIndex, 0, moved);

      return {
        ...state,
        bookmarkGroups: groups.map((g, idx) => ({ ...g, order: idx })),
      };
    }

    case 'GROUP_REORDER': {
      const { startIndex, endIndex } = op.payload || {};
      if (startIndex === undefined || endIndex === undefined) return state;
      const groups = [...state.bookmarkGroups];
      if (
        startIndex < 0 ||
        startIndex >= groups.length ||
        endIndex < 0 ||
        endIndex >= groups.length
      ) {
        return state;
      }
      const [moved] = groups.splice(startIndex, 1);
      groups.splice(endIndex, 0, moved);

      return {
        ...state,
        bookmarkGroups: groups.map((g, idx) => ({ ...g, order: idx })),
      };
    }

    case 'BOOKMARK_ADD': {
      const { groupId, bookmark } = op.payload || {};
      if (!bookmark || !bookmark.url) return state;

      const normUrl = normalizeBookmarkUrl(bookmark.url);
      let targetGroupId = groupId;

      // If group doesn't exist, fall back to first available group
      if (!state.bookmarkGroups.some(g => g.id === targetGroupId)) {
        if (state.bookmarkGroups.length > 0) {
          targetGroupId = state.bookmarkGroups[0].id;
        } else {
          return state;
        }
      }

      return {
        ...state,
        bookmarkGroups: state.bookmarkGroups.map(group => {
          if (group.id !== targetGroupId) return group;

          // Deduplicate by URL
          const exists = group.bookmarks.some(
            b => b.id === bookmark.id || normalizeBookmarkUrl(b.url) === normUrl
          );
          if (exists) {
            // Update title if needed, but do not create duplicate
            return {
              ...group,
              bookmarks: group.bookmarks.map(b =>
                normalizeBookmarkUrl(b.url) === normUrl
                  ? { ...b, title: bookmark.title || b.title }
                  : b
              ),
            };
          }

          return {
            ...group,
            bookmarks: [
              ...group.bookmarks,
              {
                id: bookmark.id || `bm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                title: bookmark.title || 'Bookmark',
                url: bookmark.url,
                icon: bookmark.icon,
                createdAt: bookmark.createdAt || Date.now(),
              },
            ],
          };
        }),
      };
    }

    case 'BOOKMARK_UPDATE': {
      const { groupId, bookmarkId, title, url } = op.payload || {};
      if (!bookmarkId) return state;

      return {
        ...state,
        bookmarkGroups: state.bookmarkGroups.map(group => {
          if (groupId && group.id !== groupId) return group;
          return {
            ...group,
            bookmarks: group.bookmarks.map(bm =>
              bm.id === bookmarkId
                ? {
                    ...bm,
                    title: title !== undefined ? title.trim() : bm.title,
                    url: url !== undefined ? url.trim() : bm.url,
                  }
                : bm
            ),
          };
        }),
      };
    }

    case 'BOOKMARK_DELETE': {
      const { groupId, bookmarkId } = op.payload || {};
      if (!bookmarkId) return state;

      return {
        ...state,
        bookmarkGroups: state.bookmarkGroups.map(group => {
          if (groupId && group.id !== groupId) return group;
          return {
            ...group,
            bookmarks: group.bookmarks.filter(bm => bm.id !== bookmarkId),
          };
        }),
      };
    }

    case 'BOOKMARK_MOVE': {
      const { groupId, bookmarkId, direction } = op.payload || {};
      if (!groupId || !bookmarkId || !direction) return state;

      return {
        ...state,
        bookmarkGroups: state.bookmarkGroups.map(group => {
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
      };
    }

    case 'BOOKMARK_REORDER': {
      const { groupId, startIndex, endIndex } = op.payload || {};
      if (!groupId || startIndex === undefined || endIndex === undefined) return state;

      return {
        ...state,
        bookmarkGroups: state.bookmarkGroups.map(group => {
          if (group.id !== groupId) return group;
          const bms = [...group.bookmarks];
          if (
            startIndex < 0 ||
            startIndex >= bms.length ||
            endIndex < 0 ||
            endIndex >= bms.length
          ) {
            return group;
          }
          const [moved] = bms.splice(startIndex, 1);
          bms.splice(endIndex, 0, moved);

          return {
            ...group,
            bookmarks: bms,
          };
        }),
      };
    }

    case 'TASK_ADD': {
      const reminder = op.payload?.reminder as LocalEventReminder;
      if (!reminder || !reminder.title) return state;

      const exists = (state.preferences.reminders || []).some(r => r.id === reminder.id);
      if (exists) return state;

      return {
        ...state,
        preferences: {
          ...state.preferences,
          reminders: [...(state.preferences.reminders || []), reminder],
        },
      };
    }

    case 'TASK_UPDATE': {
      const { reminderId, updates } = op.payload || {};
      if (!reminderId) return state;

      return {
        ...state,
        preferences: {
          ...state.preferences,
          reminders: (state.preferences.reminders || []).map(r =>
            r.id === reminderId ? { ...r, ...updates } : r
          ),
        },
      };
    }

    case 'TASK_DELETE': {
      const { reminderId } = op.payload || {};
      if (!reminderId) return state;

      return {
        ...state,
        preferences: {
          ...state.preferences,
          reminders: (state.preferences.reminders || []).filter(r => r.id !== reminderId),
        },
      };
    }

    case 'THEME_UPDATE': {
      const partialTheme = op.payload?.theme || {};
      return {
        ...state,
        theme: {
          ...state.theme,
          ...partialTheme,
        },
      };
    }

    case 'PREFERENCES_UPDATE': {
      const partialPrefs = op.payload?.preferences || {};
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...partialPrefs,
        },
      };
    }

    default:
      return state;
  }
}
