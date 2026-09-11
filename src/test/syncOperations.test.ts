import { describe, it, expect } from 'vitest';
import {
  normalizeBookmarkUrl,
  createSyncOperation,
  applySyncOperation,
} from '../services/sync/syncOperations';
import { DEFAULT_DASHBOARD_STATE } from '../services/storage/defaultState';
import { BookmarkGroup, BookmarkItem } from '../types/dashboard';

const getFreshState = () => JSON.parse(JSON.stringify(DEFAULT_DASHBOARD_STATE));

describe('Sync Operations & Convergence', () => {
  it('normalizes bookmark URLs accurately for deduplication', () => {
    expect(normalizeBookmarkUrl('https://github.com/')).toBe('https://github.com');
    expect(normalizeBookmarkUrl('HTTPS://GITHUB.COM/deepmind/')).toBe('https://github.com/deepmind');
    expect(normalizeBookmarkUrl('http://news.ycombinator.com///')).toBe('http://news.ycombinator.com');
    expect(normalizeBookmarkUrl('reddit.com')).toBe('https://reddit.com');
  });

  it('creates well-formed sync operations with unique IDs', () => {
    const op1 = createSyncOperation('dev_123', 'BOOKMARK_ADD', 'bm_1', { url: 'https://test.com' });
    const op2 = createSyncOperation('dev_123', 'BOOKMARK_ADD', 'bm_2', { url: 'https://test.com' });

    expect(op1.operationId).toBeDefined();
    expect(op2.operationId).toBeDefined();
    expect(op1.operationId).not.toBe(op2.operationId);
    expect(op1.type).toBe('BOOKMARK_ADD');
    expect(op1.deviceId).toBe('dev_123');
  });

  it('adds and updates groups via sync operations', () => {
    const state = getFreshState();
    const initialGroupsCount = state.bookmarkGroups.length;

    const newGroup: BookmarkGroup = {
      id: 'grp_sync_test',
      title: 'DevOps & Cloud',
      order: 99,
      bookmarks: [],
    };

    const addOp = createSyncOperation('dev_A', 'GROUP_ADD', newGroup.id, newGroup);
    const stateWithGroup = applySyncOperation(state, addOp);

    expect(stateWithGroup.bookmarkGroups.length).toBe(initialGroupsCount + 1);
    expect(stateWithGroup.bookmarkGroups.some(g => g.id === 'grp_sync_test')).toBe(true);

    // Update group title
    const updateOp = createSyncOperation('dev_A', 'GROUP_UPDATE', 'grp_sync_test', {
      groupId: 'grp_sync_test',
      title: 'Cloud Infrastructure',
    });
    const stateUpdated = applySyncOperation(stateWithGroup, updateOp);
    const found = stateUpdated.bookmarkGroups.find(g => g.id === 'grp_sync_test');
    expect(found?.title).toBe('Cloud Infrastructure');
  });

  it('deduplicates bookmarks with identical normalized URLs in BOOKMARK_ADD', () => {
    const state = getFreshState();
    const targetGroup: BookmarkGroup = {
      id: 'grp_test_1',
      title: 'Dev Resources',
      order: 0,
      bookmarks: [],
    };
    state.bookmarkGroups.push(targetGroup);
    const initialCount = targetGroup.bookmarks.length;

    const bm1: BookmarkItem = {
      id: 'bm_uniq_1',
      title: 'Hacker News',
      url: 'https://news.ycombinator.com/',
    };

    const op1 = createSyncOperation('dev_A', 'BOOKMARK_ADD', bm1.id, {
      groupId: targetGroup.id,
      bookmark: bm1,
    });
    const stateAfter1 = applySyncOperation(state, op1);
    const grpAfter1 = stateAfter1.bookmarkGroups.find(g => g.id === targetGroup.id)!;
    expect(grpAfter1.bookmarks.length).toBe(initialCount + 1);

    // Concurrent add of same URL from Device B with slight difference in case/slash
    const bm2: BookmarkItem = {
      id: 'bm_uniq_2',
      title: 'Hacker News (Updated)',
      url: 'https://NEWS.YCOMBINATOR.COM',
    };
    const op2 = createSyncOperation('dev_B', 'BOOKMARK_ADD', bm2.id, {
      groupId: targetGroup.id,
      bookmark: bm2,
    });
    const stateAfter2 = applySyncOperation(stateAfter1, op2);
    const grpAfter2 = stateAfter2.bookmarkGroups.find(g => g.id === targetGroup.id)!;

    // Count should NOT increment (deduplication applied)
    expect(grpAfter2.bookmarks.length).toBe(initialCount + 1);
    // Title updated
    expect(grpAfter2.bookmarks.some(b => b.title === 'Hacker News (Updated)')).toBe(true);
  });

  it('handles BOOKMARK_UPDATE and BOOKMARK_DELETE deterministically', () => {
    const state = getFreshState();
    const bm: BookmarkItem = {
      id: 'bm_initial_1',
      title: 'Old Portal',
      url: 'https://old-portal.example.com',
    };
    const targetGroup: BookmarkGroup = {
      id: 'grp_test_2',
      title: 'Portals',
      order: 0,
      bookmarks: [bm],
    };
    state.bookmarkGroups.push(targetGroup);

    // Update
    const updateOp = createSyncOperation('dev_A', 'BOOKMARK_UPDATE', bm.id, {
      groupId: targetGroup.id,
      bookmarkId: bm.id,
      title: 'Renamed Portal',
      url: 'https://portal.example.com',
    });
    const stateUpdated = applySyncOperation(state, updateOp);
    const updatedBm = stateUpdated.bookmarkGroups
      .find(g => g.id === targetGroup.id)
      ?.bookmarks.find(b => b.id === bm.id);

    expect(updatedBm?.title).toBe('Renamed Portal');
    expect(updatedBm?.url).toBe('https://portal.example.com');

    // Delete
    const deleteOp = createSyncOperation('dev_B', 'BOOKMARK_DELETE', bm.id, {
      groupId: targetGroup.id,
      bookmarkId: bm.id,
    });
    const stateDeleted = applySyncOperation(stateUpdated, deleteOp);
    const deletedBm = stateDeleted.bookmarkGroups
      .find(g => g.id === targetGroup.id)
      ?.bookmarks.find(b => b.id === bm.id);

    expect(deletedBm).toBeUndefined();
  });

  it('synchronizes reminders/tasks across devices', () => {
    const state = getFreshState();
    const initialTaskCount = state.preferences.reminders?.length || 0;

    const reminder = {
      id: 'task_sync_1',
      title: 'Multi-Device Launch Review',
      date: '2026-09-15',
      time: '14:00',
      category: 'task' as const,
      completed: false,
    };

    const addOp = createSyncOperation('dev_A', 'TASK_ADD', reminder.id, { reminder });
    const stateWithTask = applySyncOperation(state, addOp);
    expect(stateWithTask.preferences.reminders.length).toBe(initialTaskCount + 1);

    // Toggle completed
    const toggleOp = createSyncOperation('dev_B', 'TASK_UPDATE', reminder.id, {
      reminderId: reminder.id,
      updates: { completed: true },
    });
    const stateCompleted = applySyncOperation(stateWithTask, toggleOp);
    const foundTask = stateCompleted.preferences.reminders.find(r => r.id === reminder.id);
    expect(foundTask?.completed).toBe(true);

    // Delete task
    const deleteOp = createSyncOperation('dev_A', 'TASK_DELETE', reminder.id, {
      reminderId: reminder.id,
    });
    const stateDeleted = applySyncOperation(stateCompleted, deleteOp);
    expect(stateDeleted.preferences.reminders.some(r => r.id === reminder.id)).toBe(false);
  });
});
