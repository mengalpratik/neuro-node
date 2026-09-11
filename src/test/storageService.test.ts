import { describe, it, expect, beforeEach } from 'vitest';
import {
  STORAGE_KEY,
  CORRUPTED_BACKUP_KEY,
  loadDashboardState,
  saveDashboardState,
  resetDashboardState,
  isValidDashboardState,
  hasCorruptedStateBackup,
  getCorruptedStateBackup,
  clearCorruptedStateBackup,
} from '../services/storage/storageService';
import { DEFAULT_DASHBOARD_STATE } from '../services/storage/defaultState';

describe('Storage Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads clean default state with 0 demo groups/tasks when localStorage is empty', () => {
    const state = loadDashboardState();
    expect(state).toBeDefined();
    expect(state.version).toBe(1);
    expect(state.bookmarkGroups.length).toBe(0);
    expect(state.preferences.reminders.length).toBe(0);
  });

  it('persists and retrieves updated dashboard state', () => {
    const customState = {
      ...DEFAULT_DASHBOARD_STATE,
      bookmarkGroups: [
        {
          id: 'grp-test',
          title: 'Custom Group',
          order: 0,
          bookmarks: [{ id: 'bm-1', title: 'Example', url: 'https://example.com' }],
        },
      ],
    };

    saveDashboardState(customState);
    const loaded = loadDashboardState();

    expect(loaded.bookmarkGroups.length).toBe(1);
    expect(loaded.bookmarkGroups[0].title).toBe('Custom Group');
    expect(loaded.bookmarkGroups[0].bookmarks[0].title).toBe('Example');
  });

  it('handles invalid JSON or corrupted schema gracefully without crashing', () => {
    localStorage.setItem(STORAGE_KEY, 'invalid json string {{');
    const state = loadDashboardState();
    expect(state).toBeDefined();
    expect(state.bookmarkGroups.length).toBe(DEFAULT_DASHBOARD_STATE.bookmarkGroups.length);

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 'invalid-string', bookmarkGroups: 'not-an-array' }));
    const recovered = loadDashboardState();
    expect(recovered).toBeDefined();
    expect(recovered.version).toBe(1);
  });

  it('correctly identifies valid vs invalid dashboard state shapes', () => {
    expect(isValidDashboardState(DEFAULT_DASHBOARD_STATE)).toBe(true);
    expect(isValidDashboardState(null)).toBe(false);
    expect(isValidDashboardState({})).toBe(false);
    expect(isValidDashboardState({ version: 1 })).toBe(false);
    expect(
      isValidDashboardState({
        version: 1,
        bookmarkGroups: [{ id: '1', title: 'G1', bookmarks: [{ id: 'b1', title: 'T', url: 'https://test.com' }] }],
        theme: {},
        preferences: {},
      })
    ).toBe(true);
  });

  it('resets back to factory defaults', () => {
    saveDashboardState({
      ...DEFAULT_DASHBOARD_STATE,
      bookmarkGroups: [{ id: 'custom-grp', title: 'Custom', order: 0, bookmarks: [] }],
    });
    expect(loadDashboardState().bookmarkGroups.length).toBe(1);

    const reset = resetDashboardState();
    expect(reset.bookmarkGroups.length).toBe(0);
    expect(loadDashboardState().bookmarkGroups.length).toBe(0);
  });

  it('preserves corrupted raw state in CORRUPTED_BACKUP_KEY when corruption is detected', () => {
    const brokenData = '{"malformed": true, "unclosed';
    localStorage.setItem(STORAGE_KEY, brokenData);

    expect(hasCorruptedStateBackup()).toBe(false);
    const recovered = loadDashboardState();
    expect(recovered).toBeDefined();
    expect(hasCorruptedStateBackup()).toBe(true);
    expect(getCorruptedStateBackup()).toBe(brokenData);
    expect(localStorage.getItem(CORRUPTED_BACKUP_KEY)).toBe(brokenData);

    clearCorruptedStateBackup();
    expect(hasCorruptedStateBackup()).toBe(false);
    expect(localStorage.getItem(CORRUPTED_BACKUP_KEY)).toBeNull();
  });
});
