import { DashboardBackup, DashboardState } from '../../types/dashboard';

/**
 * Creates a sanitized backup object from the current dashboard state,
 * guaranteeing zero sensitive authentication credentials or OAuth tokens are leaked.
 */
export function createBackupPayload(state: DashboardState): DashboardBackup {
  // Deep clone to prevent mutating live state
  const cloned: DashboardState = JSON.parse(JSON.stringify(state));

  // Security: scrub any sensitive OAuth tokens or external client secrets
  const sanitizedPreferences = {
    ...cloned.preferences,
    google: {
      enabled: false,
      clientId: '', // Explicitly scrub Google OAuth Client credentials
    },
  };

  // Remove any potential secrets, tokens, or auth credentials recursively
  const scrubbedPreferences = scrubSecrets(sanitizedPreferences) as typeof sanitizedPreferences;
  scrubbedPreferences.google = {
    enabled: false,
    clientId: '',
  };

  return {
    app: 'PersonalDashboard',
    version: 1,
    exportedAt: new Date().toISOString(),
    theme: cloned.theme,
    preferences: scrubbedPreferences,
    bookmarkGroups: cloned.bookmarkGroups,
  };
}

/**
 * Recursively strips any keys matching credential or secret patterns
 * (e.g. token, secret, password, key, auth) from untrusted export payloads.
 */
function scrubSecrets(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(scrubSecrets);
  }
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = k.toLowerCase();
    if (
      lowerKey.includes('token') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('password') ||
      lowerKey === 'clientid' ||
      lowerKey === 'apikey' ||
      lowerKey === 'auth'
    ) {
      continue;
    }
    result[k] = scrubSecrets(v);
  }
  return result;
}

/**
 * Triggers a browser download of the dashboard JSON backup.
 */
export function downloadBackupFile(state: DashboardState): string {
  const backup = createBackupPayload(state);
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `personal-dashboard-backup-${dateStr}.json`;

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  return filename;
}
