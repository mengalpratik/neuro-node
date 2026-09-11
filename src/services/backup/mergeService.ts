import { BookmarkItem, DashboardBackup, DashboardState, ImportOptions } from '../../types/dashboard';

/**
 * Normalizes a URL for duplicate detection (lowercased, trailing slash stripped, trimmed protocol)
 */
export function normalizeUrl(url: string): string {
  try {
    let clean = url.trim().toLowerCase();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }
    const parsed = new URL(clean);
    return (parsed.hostname + parsed.pathname.replace(/\/+$/, '') + parsed.search).toLowerCase();
  } catch {
    return url.trim().toLowerCase().replace(/\/+$/, '');
  }
}

/**
 * Executes state resolution upon importing data with user's selected options:
 * - dataStrategy: 'replace' | 'merge'
 * - stylingStrategy: 'apply' | 'keep'
 */
export function applyImportedData(
  currentState: DashboardState,
  importedBackup: DashboardBackup,
  options: ImportOptions
): DashboardState {
  // Deep clone current state
  const nextState: DashboardState = JSON.parse(JSON.stringify(currentState));

  // 1. STYLING RESOLUTION
  if (options.stylingStrategy === 'apply' && importedBackup.theme) {
    nextState.theme = {
      ...nextState.theme,
      ...importedBackup.theme,
    };
  }

  // 2. DATA RESOLUTION
  if (options.dataStrategy === 'replace') {
    // Replace all groups with imported groups
    nextState.bookmarkGroups = importedBackup.bookmarkGroups.map((g, idx) => ({
      ...g,
      order: idx,
    }));

    // Optionally update preferences if present (except Google credentials)
    if (importedBackup.preferences) {
      nextState.preferences = {
        ...nextState.preferences,
        timeFormat: importedBackup.preferences.timeFormat || nextState.preferences.timeFormat,
        weather: {
          ...nextState.preferences.weather,
          ...(importedBackup.preferences.weather || {}),
        },
      };
    }
  } else if (options.dataStrategy === 'merge') {
    // MERGE STRATEGY:
    // Retain existing groups.
    // For imported groups:
    // - If matching group title exists (case-insensitive), merge bookmarks avoiding duplicate URLs.
    // - If not, append the imported group to the list with new order.

    const existingGroups = [...nextState.bookmarkGroups];

    for (const impGroup of importedBackup.bookmarkGroups) {
      const existingMatch = existingGroups.find(
        eg => eg.title.trim().toLowerCase() === impGroup.title.trim().toLowerCase()
      );

      if (existingMatch) {
        // Group already exists: append unique bookmarks
        const existingUrlSet = new Set(existingMatch.bookmarks.map(b => normalizeUrl(b.url)));
        const newBookmarks: BookmarkItem[] = [];

        for (const bm of impGroup.bookmarks) {
          const norm = normalizeUrl(bm.url);
          if (!existingUrlSet.has(norm)) {
            existingUrlSet.add(norm);
            newBookmarks.push({
              ...bm,
              id: `bm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            });
          }
        }

        existingMatch.bookmarks = [...existingMatch.bookmarks, ...newBookmarks];
      } else {
        // Group does not exist: create as a new group at end
        existingGroups.push({
          ...impGroup,
          id: `grp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          order: existingGroups.length,
        });
      }
    }

    nextState.bookmarkGroups = existingGroups;
  }

  return nextState;
}
