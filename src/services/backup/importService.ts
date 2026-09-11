import { BookmarkGroup, DashboardBackup, ImportValidationResult } from '../../types/dashboard';

export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Validates a web URL safely to guard against XSS injection vectors (e.g. javascript: schemes).
 */
export function isValidWebUrl(urlStr: string): boolean {
  if (typeof urlStr !== 'string' || !urlStr.trim()) return false;
  // Strip control characters and whitespace
  const sanitized = urlStr.trim().replace(/[\u0000-\u001F\u007F-\u009F\s]/g, '').toLowerCase();
  
  // Guard against dangerous schemes
  if (
    sanitized.startsWith('javascript:') ||
    sanitized.startsWith('data:') ||
    sanitized.startsWith('vbscript:') ||
    sanitized.startsWith('file:') ||
    sanitized.startsWith('blob:')
  ) {
    return false;
  }

  // Check if parseable as http or https
  try {
    const parsed = new URL(urlStr.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    // If protocol was omitted, e.g. "github.com", allow if valid domain structure
    return /^[a-zA-Z0-9][-a-zA-Z0-9.]*\.[a-zA-Z]{2,}(\/.*)?$/.test(urlStr.trim());
  }
}

/**
 * Validates untrusted JSON input against the Dashboard backup schema.
 */
export function validateImportJson(rawJson: string): ImportValidationResult {
  if (!rawJson || typeof rawJson !== 'string' || !rawJson.trim()) {
    return { valid: false, error: 'Uploaded file is empty or cannot be read.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err) {
    return { valid: false, error: `Invalid JSON format: ${(err as Error).message}` };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, error: 'Backup payload must be a valid JSON object.' };
  }

  const obj = parsed as Record<string, unknown>;

  // Check application signature or groups
  if (obj.app !== 'PersonalDashboard' && !Array.isArray(obj.bookmarkGroups)) {
    return { valid: false, error: 'Unrecognized backup file format. Expected a NEURO//NODE / NEXUS Personal Dashboard backup.' };
  }

  if (typeof obj.version !== 'number' || obj.version < 1) {
    return { valid: false, error: 'Unsupported or missing schema version in backup file.' };
  }

  if (obj.version > CURRENT_SCHEMA_VERSION) {
    return { valid: false, error: 'Backup was created by a newer NEURO//NODE version.' };
  }

  if (!Array.isArray(obj.bookmarkGroups)) {
    return { valid: false, error: 'Backup is missing bookmarkGroups list.' };
  }

  let totalBookmarks = 0;
  const sanitizedGroups: BookmarkGroup[] = [];

  for (let gIdx = 0; gIdx < obj.bookmarkGroups.length; gIdx++) {
    const rawGroup = obj.bookmarkGroups[gIdx];
    if (!rawGroup || typeof rawGroup !== 'object') {
      return { valid: false, error: `Group at position ${gIdx + 1} is malformed.` };
    }

    const g = rawGroup as Record<string, unknown>;
    const title = typeof g.title === 'string' && g.title.trim() ? g.title.trim() : `Group ${gIdx + 1}`;
    const id = typeof g.id === 'string' && g.id.trim() ? g.id.trim() : `imported-group-${Date.now()}-${gIdx}`;

    if (!Array.isArray(g.bookmarks)) {
      return { valid: false, error: `Bookmark list in group "${title}" is malformed.` };
    }

    const validBookmarks = [];
    for (let bIdx = 0; bIdx < g.bookmarks.length; bIdx++) {
      const rawBm = g.bookmarks[bIdx];
      if (!rawBm || typeof rawBm !== 'object') continue;

      const b = rawBm as Record<string, unknown>;
      const bTitle = typeof b.title === 'string' && b.title.trim() ? b.title.trim() : 'Untitled Bookmark';
      const bUrl = typeof b.url === 'string' ? b.url.trim() : '';

      if (!isValidWebUrl(bUrl)) {
        return { valid: false, error: `Invalid or unsafe bookmark URL "${bUrl}" found in group "${title}".` };
      }

      validBookmarks.push({
        id: typeof b.id === 'string' && b.id.trim() ? b.id.trim() : `bm-${Date.now()}-${bIdx}`,
        title: bTitle,
        url: bUrl,
        icon: typeof b.icon === 'string' ? b.icon : undefined,
      });
      totalBookmarks++;
    }

    sanitizedGroups.push({
      id,
      title,
      order: typeof g.order === 'number' ? g.order : gIdx,
      bookmarks: validBookmarks,
    });
  }

  const resultBackup: DashboardBackup = {
    app: 'PersonalDashboard',
    version: Number(obj.version),
    exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString(),
    theme: (obj.theme && typeof obj.theme === 'object') ? (obj.theme as any) : undefined,
    preferences: (obj.preferences && typeof obj.preferences === 'object') ? (obj.preferences as any) : undefined,
    bookmarkGroups: sanitizedGroups,
  };

  return {
    valid: true,
    data: resultBackup,
    stats: {
      groupsCount: sanitizedGroups.length,
      bookmarksCount: totalBookmarks,
    },
  };
}
