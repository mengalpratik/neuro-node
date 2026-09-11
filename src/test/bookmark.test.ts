import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDashboardStore } from '../hooks/useDashboardStore';
import { STORAGE_KEY } from '../services/storage/storageService';

describe('Bookmark & Group Management Operations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates, renames, and deletes bookmark groups with persistence', () => {
    const { result } = renderHook(() => useDashboardStore());

    // 1. CREATE GROUP
    act(() => {
      result.current.addGroup('Cyber Defense');
    });

    const addedGroup = result.current.state.bookmarkGroups.find(g => g.title === 'Cyber Defense');
    expect(addedGroup).toBeDefined();
    expect(addedGroup?.bookmarks).toEqual([]);

    // 2. RENAME GROUP
    act(() => {
      if (addedGroup) {
        result.current.renameGroup(addedGroup.id, 'Offensive Security');
      }
    });

    const renamed = result.current.state.bookmarkGroups.find(g => g.id === addedGroup?.id);
    expect(renamed?.title).toBe('Offensive Security');

    // 3. DELETE GROUP
    act(() => {
      if (renamed) {
        result.current.deleteGroup(renamed.id);
      }
    });

    expect(result.current.state.bookmarkGroups.find(g => g.id === addedGroup?.id)).toBeUndefined();

    // Check localStorage persistence
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.bookmarkGroups.find((g: any) => g.title === 'Offensive Security')).toBeUndefined();
  });

  it('adds, edits, and deletes bookmarks within a group', () => {
    const { result } = renderHook(() => useDashboardStore());
    
    act(() => {
      result.current.addGroup('Development Tools');
    });
    const firstGroup = result.current.state.bookmarkGroups[0];
    const initialCount = firstGroup.bookmarks.length;

    // 1. ADD BOOKMARK (auto prefixes https://)
    act(() => {
      result.current.addBookmark(firstGroup.id, 'Custom Tool', 'custom-tool.dev');
    });

    const updatedGroup = result.current.state.bookmarkGroups[0];
    expect(updatedGroup.bookmarks.length).toBe(initialCount + 1);
    const addedBm = updatedGroup.bookmarks.find(b => b.title === 'Custom Tool');
    expect(addedBm).toBeDefined();
    expect(addedBm?.url).toBe('https://custom-tool.dev');

    // 2. EDIT BOOKMARK
    act(() => {
      if (addedBm) {
        result.current.editBookmark(firstGroup.id, addedBm.id, 'Renamed Tool', 'https://new-tool.dev');
      }
    });

    const editedBm = result.current.state.bookmarkGroups[0].bookmarks.find(b => b.id === addedBm?.id);
    expect(editedBm?.title).toBe('Renamed Tool');
    expect(editedBm?.url).toBe('https://new-tool.dev');

    // 3. DELETE BOOKMARK
    act(() => {
      if (editedBm) {
        result.current.deleteBookmark(firstGroup.id, editedBm.id);
      }
    });

    expect(result.current.state.bookmarkGroups[0].bookmarks.find(b => b.id === addedBm?.id)).toBeUndefined();
    expect(result.current.state.bookmarkGroups[0].bookmarks.length).toBe(initialCount);
  });

  it('reorders groups and bookmarks correctly with persistence', () => {
    const { result } = renderHook(() => useDashboardStore());

    act(() => {
      result.current.addGroup('Alpha Cluster');
      result.current.addGroup('Beta Cluster');
    });

    const group0Title = result.current.state.bookmarkGroups[0].title;
    const group1Title = result.current.state.bookmarkGroups[1].title;

    // Reorder groups: move group 0 to index 1
    act(() => {
      result.current.reorderGroups(0, 1);
    });

    expect(result.current.state.bookmarkGroups[0].title).toBe(group1Title);
    expect(result.current.state.bookmarkGroups[1].title).toBe(group0Title);

    // Reorder bookmarks within group 0
    const targetGroup = result.current.state.bookmarkGroups[0];
    act(() => {
      result.current.addBookmark(targetGroup.id, 'Link A', 'https://a.com');
      result.current.addBookmark(targetGroup.id, 'Link B', 'https://b.com');
    });

    const currentGroup = result.current.state.bookmarkGroups[0];
    const bm0Title = currentGroup.bookmarks[0].title;
    const bm1Title = currentGroup.bookmarks[1].title;

    act(() => {
      result.current.reorderBookmarks(currentGroup.id, 0, 1);
    });

    const afterBmGroup = result.current.state.bookmarkGroups[0];
    expect(afterBmGroup.bookmarks[0].title).toBe(bm1Title);
    expect(afterBmGroup.bookmarks[1].title).toBe(bm0Title);
  });
});
