import { describe, it, expect } from 'vitest';
import { createBackupPayload } from '../services/backup/exportService';
import { validateImportJson, isValidWebUrl } from '../services/backup/importService';
import { applyImportedData, normalizeUrl } from '../services/backup/mergeService';
import { DEFAULT_DASHBOARD_STATE } from '../services/storage/defaultState';
import { DashboardBackup, DashboardState } from '../types/dashboard';

describe('Import / Export & Conflict Resolution Engine', () => {
  it('exports valid state while strictly scrubbing OAuth credentials and secrets', () => {
    const dirtyState: DashboardState = {
      ...DEFAULT_DASHBOARD_STATE,
      preferences: {
        ...DEFAULT_DASHBOARD_STATE.preferences,
        google: {
          enabled: true,
          clientId: 'secret-oauth-client-id-12345.apps.googleusercontent.com',
        },
      },
    };

    const backup = createBackupPayload(dirtyState);
    expect(backup.app).toBe('PersonalDashboard');
    expect(backup.version).toBe(1);
    expect(backup.exportedAt).toBeDefined();
    // Security verification
    expect(backup.preferences.google.clientId).toBe('');
    expect(backup.preferences.google.enabled).toBe(false);
  });

  it('validates URLs safely and rejects dangerous scripts', () => {
    expect(isValidWebUrl('https://google.com')).toBe(true);
    expect(isValidWebUrl('http://localhost:3000/path?q=1')).toBe(true);
    expect(isValidWebUrl('github.com/developer')).toBe(true);
    expect(isValidWebUrl('javascript:alert(1)')).toBe(false);
    expect(isValidWebUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isValidWebUrl('')).toBe(false);
  });

  it('normalizes URLs for strict duplicate detection', () => {
    expect(normalizeUrl('https://GitHub.com/')).toBe('github.com');
    expect(normalizeUrl('http://github.com/test/')).toBe('github.com/test');
    expect(normalizeUrl('github.com/test')).toBe('github.com/test');
  });

  it('validates a correct JSON backup and rejects invalid/corrupted JSON', () => {
    const validJson = JSON.stringify({
      app: 'PersonalDashboard',
      version: 1,
      exportedAt: new Date().toISOString(),
      bookmarkGroups: [
        {
          id: 'grp-test',
          title: 'Testing',
          order: 0,
          bookmarks: [{ id: 'b1', title: 'Example', url: 'https://example.com' }],
        },
      ],
    });

    const validRes = validateImportJson(validJson);
    expect(validRes.valid).toBe(true);
    expect(validRes.data).toBeDefined();
    expect(validRes.stats?.groupsCount).toBe(1);
    expect(validRes.stats?.bookmarksCount).toBe(1);

    // Corrupted syntax
    expect(validateImportJson('{ broken json').valid).toBe(false);
    // Missing required fields
    expect(validateImportJson('{"unrelated": true}').valid).toBe(false);
    // Malformed bookmark with script URL
    const evilJson = JSON.stringify({
      app: 'PersonalDashboard',
      version: 1,
      bookmarkGroups: [
        {
          id: 'grp-evil',
          title: 'Evil',
          bookmarks: [{ id: 'b1', title: 'Hack', url: 'javascript:stealCookies()' }],
        },
      ],
    });
    expect(validateImportJson(evilJson).valid).toBe(false);
  });

  it('replaces all data in "replace" mode', () => {
    const backup: DashboardBackup = {
      app: 'PersonalDashboard',
      version: 1,
      exportedAt: new Date().toISOString(),
      theme: {
        ...DEFAULT_DASHBOARD_STATE.theme,
        accentColor: '#ff0055',
      },
      preferences: DEFAULT_DASHBOARD_STATE.preferences,
      bookmarkGroups: [
        {
          id: 'imp-1',
          title: 'Imported Only Group',
          order: 0,
          bookmarks: [{ id: 'ib-1', title: 'Single Link', url: 'https://single.org' }],
        },
      ],
    };

    const nextState = applyImportedData(DEFAULT_DASHBOARD_STATE, backup, {
      dataStrategy: 'replace',
      stylingStrategy: 'apply',
    });

    expect(nextState.bookmarkGroups.length).toBe(1);
    expect(nextState.bookmarkGroups[0].title).toBe('Imported Only Group');
    expect(nextState.theme.accentColor).toBe('#ff0055');
  });

  it('merges data without duplicate URLs and respects styling choices', () => {
    const existingState: DashboardState = {
      ...DEFAULT_DASHBOARD_STATE,
      theme: {
        ...DEFAULT_DASHBOARD_STATE.theme,
        accentColor: '#00ff66',
      },
      bookmarkGroups: [
        {
          id: 'grp-1',
          title: 'Development',
          order: 0,
          bookmarks: [
            { id: 'b1', title: 'GitHub', url: 'https://github.com' },
          ],
        },
      ],
    };

    const incomingBackup: DashboardBackup = {
      app: 'PersonalDashboard',
      version: 1,
      exportedAt: new Date().toISOString(),
      theme: {
        ...DEFAULT_DASHBOARD_STATE.theme,
        accentColor: '#00e5ff',
      },
      preferences: DEFAULT_DASHBOARD_STATE.preferences,
      bookmarkGroups: [
        {
          id: 'imp-grp-1',
          title: 'Development', // Matching group name!
          order: 0,
          bookmarks: [
            { id: 'ib-dup', title: 'GitHub duplicate', url: 'https://github.com/' }, // Duplicate URL
            { id: 'ib-new', title: 'GitLab', url: 'https://gitlab.com' }, // New URL
          ],
        },
        {
          id: 'imp-grp-2',
          title: 'Brand New Group', // New group!
          order: 1,
          bookmarks: [{ id: 'ib-fresh', title: 'Fresh', url: 'https://fresh.io' }],
        },
      ],
    };

    // MERGE + KEEP STYLING
    const mergedKeepStyle = applyImportedData(existingState, incomingBackup, {
      dataStrategy: 'merge',
      stylingStrategy: 'keep',
    });

    // Theme preserved
    expect(mergedKeepStyle.theme.accentColor).toBe('#00ff66');
    // Groups merged: Development + Brand New Group
    expect(mergedKeepStyle.bookmarkGroups.length).toBe(2);

    const devGroup = mergedKeepStyle.bookmarkGroups.find(g => g.title === 'Development');
    expect(devGroup).toBeDefined();
    // GitHub was not duplicated; only GitLab was added -> total 2 bookmarks
    expect(devGroup?.bookmarks.length).toBe(2);
    expect(devGroup?.bookmarks.map(b => b.url)).toContain('https://github.com');
    expect(devGroup?.bookmarks.map(b => b.url)).toContain('https://gitlab.com');

    // New group added
    const brandNewGroup = mergedKeepStyle.bookmarkGroups.find(g => g.title === 'Brand New Group');
    expect(brandNewGroup).toBeDefined();
    expect(brandNewGroup?.bookmarks.length).toBe(1);

    // MERGE + APPLY STYLING
    const mergedApplyStyle = applyImportedData(existingState, incomingBackup, {
      dataStrategy: 'merge',
      stylingStrategy: 'apply',
    });
    expect(mergedApplyStyle.theme.accentColor).toBe('#00e5ff');
  });

  it('rejects future incompatible schema versions safely', () => {
    const futureJson = JSON.stringify({
      app: 'PersonalDashboard',
      version: 2, // Future version!
      exportedAt: new Date().toISOString(),
      bookmarkGroups: [
        {
          id: 'grp-future',
          title: 'Future',
          bookmarks: [{ id: 'b1', title: 'Future Link', url: 'https://future.org' }],
        },
      ],
    });

    const result = validateImportJson(futureJson);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Backup was created by a newer NEURO//NODE version.');
  });

  it('strictly rejects blob:, javascript:, and control-character obfuscated URLs', () => {
    expect(isValidWebUrl('blob:https://example.com/uuid')).toBe(false);
    expect(isValidWebUrl('javascript:alert("pwned")')).toBe(false);
    expect(isValidWebUrl('   javascript:alert(1)  ')).toBe(false);
    expect(isValidWebUrl('vbscript:msgbox(1)')).toBe(false);
    expect(isValidWebUrl('file:///etc/passwd')).toBe(false);
  });
});
