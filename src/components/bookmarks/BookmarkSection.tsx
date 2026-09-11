import React, { useState } from 'react';
import { BookmarkGroup } from '../../types/dashboard';
import { BookmarkGroupCard } from './BookmarkGroupCard';
import { AddGroupModal } from './AddGroupModal';
import { GlassCard } from '../common/GlassCard';
import { Layers, Plus } from 'lucide-react';

interface BookmarkSectionProps {
  groups: BookmarkGroup[];
  onAddGroup: (title: string) => void;
  onRenameGroup: (id: string, newTitle: string) => void;
  onDeleteGroup: (id: string) => void;
  onMoveGroup: (id: string, direction: 'left' | 'right') => void;
  onReorderGroups: (startIndex: number, endIndex: number) => void;
  onAddBookmark: (groupId: string, title: string, url: string) => void;
  onEditBookmark: (groupId: string, bookmarkId: string, title: string, url: string) => void;
  onDeleteBookmark: (groupId: string, bookmarkId: string) => void;
  onMoveBookmark: (groupId: string, bookmarkId: string, direction: 'up' | 'down') => void;
  onReorderBookmarks: (groupId: string, startIndex: number, endIndex: number) => void;
}

export const BookmarkSection: React.FC<BookmarkSectionProps> = ({
  groups,
  onAddGroup,
  onRenameGroup,
  onDeleteGroup,
  onMoveGroup,
  onReorderGroups,
  onAddBookmark,
  onEditBookmark,
  onDeleteBookmark,
  onMoveBookmark,
  onReorderBookmarks,
}) => {
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [draggedGroupIndex, setDraggedGroupIndex] = useState<number | null>(null);

  const handleGroupDragStart = (_e: React.DragEvent, index: number) => {
    setDraggedGroupIndex(index);
  };

  const handleGroupDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleGroupDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedGroupIndex !== null && draggedGroupIndex !== targetIndex) {
      onReorderGroups(draggedGroupIndex, targetIndex);
    }
    setDraggedGroupIndex(null);
  };

  return (
    <section className="space-y-3" aria-label="Bookmarks and Quick Links">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold tracking-wider uppercase">
            MATRIX ROUTING // BOOKMARK CLUSTERS ({groups.length})
          </span>
        </div>

        <button
          onClick={() => setIsAddGroupOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Group</span>
        </button>
      </div>

      {/* Dynamic Responsive Grid: 1 col mobile, 2 sm, 3 lg, 4 xl, 5 2xl */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5">
        {groups.map((group, idx) => (
          <BookmarkGroupCard
            key={group.id}
            group={group}
            index={idx}
            totalGroups={groups.length}
            onRenameGroup={onRenameGroup}
            onDeleteGroup={onDeleteGroup}
            onMoveGroup={onMoveGroup}
            onAddBookmark={onAddBookmark}
            onEditBookmark={onEditBookmark}
            onDeleteBookmark={onDeleteBookmark}
            onMoveBookmark={onMoveBookmark}
            onReorderBookmarks={onReorderBookmarks}
            onGroupDragStart={handleGroupDragStart}
            onGroupDragOver={handleGroupDragOver}
            onGroupDrop={handleGroupDrop}
          />
        ))}

        {/* Dedicated "Add Group" Card at end of collection */}
        <GlassCard
          subtle
          onClick={() => setIsAddGroupOpen(true)}
          className="flex flex-col items-center justify-center min-h-[160px] p-6 border-2 border-dashed border-emerald-500/20 hover:border-emerald-400/50 hover:bg-emerald-950/20 cursor-pointer transition-all duration-200 group text-center select-none"
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsAddGroupOpen(true);
            }
          }}
          aria-label="Add new bookmark group"
        >
          <div className="p-3 rounded-2xl bg-black/40 group-hover:bg-emerald-500/20 text-emerald-400/80 group-hover:text-emerald-300 border border-emerald-500/20 group-hover:border-emerald-500/40 mb-2 transition-all">
            <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </div>
          <span className="sr-only">+ Add Group</span>
          <span
            aria-hidden="true"
            className="font-mono text-xs font-semibold text-emerald-300 tracking-wider uppercase"
          >
            Add Group
          </span>
          <span className="text-[11px] text-gray-500 mt-1">
            Create a new category cluster
          </span>
        </GlassCard>
      </div>

      {/* Add Group Modal */}
      <AddGroupModal
        isOpen={isAddGroupOpen}
        onClose={() => setIsAddGroupOpen(false)}
        onSave={onAddGroup}
      />
    </section>
  );
};
