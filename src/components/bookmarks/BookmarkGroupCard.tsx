import React, { useState } from 'react';
import { BookmarkGroup, BookmarkItem as BookmarkItemType } from '../../types/dashboard';
import { GlassCard } from '../common/GlassCard';
import { BookmarkItem } from './BookmarkItem';
import { BookmarkModal } from './BookmarkModal';
import { AddGroupModal } from './AddGroupModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  MoreVertical,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  GripHorizontal,
  Bookmark,
} from 'lucide-react';

interface BookmarkGroupCardProps {
  group: BookmarkGroup;
  index: number;
  totalGroups: number;
  onRenameGroup: (id: string, newTitle: string) => void;
  onDeleteGroup: (id: string) => void;
  onMoveGroup: (id: string, direction: 'left' | 'right') => void;
  onAddBookmark: (groupId: string, title: string, url: string) => void;
  onEditBookmark: (groupId: string, bookmarkId: string, title: string, url: string) => void;
  onDeleteBookmark: (groupId: string, bookmarkId: string) => void;
  onMoveBookmark: (groupId: string, bookmarkId: string, direction: 'up' | 'down') => void;
  onReorderBookmarks: (groupId: string, startIndex: number, endIndex: number) => void;
  onGroupDragStart: (e: React.DragEvent, index: number) => void;
  onGroupDragOver: (e: React.DragEvent) => void;
  onGroupDrop: (e: React.DragEvent, targetIndex: number) => void;
}

export const BookmarkGroupCard: React.FC<BookmarkGroupCardProps> = ({
  group,
  index,
  totalGroups,
  onRenameGroup,
  onDeleteGroup,
  onMoveGroup,
  onAddBookmark,
  onEditBookmark,
  onDeleteBookmark,
  onMoveBookmark,
  onReorderBookmarks,
  onGroupDragStart,
  onGroupDragOver,
  onGroupDrop,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isAddBookmarkOpen, setIsAddBookmarkOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkItemType | null>(null);

  // Group drag-over highlight state
  const [isCardDragOver, setIsCardDragOver] = useState(false);

  // Internal drag-and-drop state for bookmarks inside this group
  const [draggedBmIndex, setDraggedBmIndex] = useState<number | null>(null);

  const handleBookmarkDragStart = (e: React.DragEvent, bmIndex: number) => {
    e.stopPropagation();
    setDraggedBmIndex(bmIndex);
    e.dataTransfer.setData('text/plain', `bookmark:${group.id}:${bmIndex}`);
  };

  const handleBookmarkDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleBookmarkDrop = (e: React.DragEvent, targetBmIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedBmIndex !== null && draggedBmIndex !== targetBmIndex) {
      onReorderBookmarks(group.id, draggedBmIndex, targetBmIndex);
    }
    setDraggedBmIndex(null);
  };

  const handleGroupCardDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsCardDragOver(true);
    onGroupDragOver(e);
  };

  const handleGroupCardDragLeave = () => {
    setIsCardDragOver(false);
  };

  const handleGroupCardDrop = (e: React.DragEvent) => {
    setIsCardDragOver(false);
    onGroupDrop(e, index);
  };

  return (
    <>
      <GlassCard
        className={`flex flex-col h-full overflow-hidden relative group/card transition-all duration-200 ${
          isCardDragOver
            ? 'border-emerald-400 bg-emerald-500/15 ring-2 ring-emerald-400/40 shadow-xl shadow-emerald-500/20'
            : 'border-emerald-500/20 hover:border-emerald-500/40'
        }`}
        onDragOver={handleGroupCardDragOver}
        onDragLeave={handleGroupCardDragLeave}
        onDrop={handleGroupCardDrop}
      >
        {/* Card Header with Drag Handle & Group Actions */}
        <div
          draggable
          onDragStart={e => onGroupDragStart(e, index)}
          className="flex items-center justify-between px-4 py-3 border-b border-emerald-500/15 bg-black/40 cursor-grab active:cursor-grabbing select-none"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <GripHorizontal className="w-3.5 h-3.5 text-gray-500 group-hover/card:text-emerald-400 shrink-0" />
            <span className="font-mono text-xs text-emerald-400 font-bold tracking-wider uppercase truncate">
              {group.title}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shrink-0">
              {group.bookmarks.length}
            </span>
          </div>

          {/* Touch-friendly 3-Dot Group Action Menu Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={`Menu for group ${group.title}`}
              className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-300 hover:bg-emerald-500/10 active:scale-95 transition-all min-w-[32px] min-h-[32px] flex items-center justify-center"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-black/95 border border-emerald-500/30 shadow-2xl z-30 py-1 font-mono text-xs backdrop-blur-md">
                  {/* Point 12: Add Bookmark inside menu */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsAddBookmarkOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Add Bookmark</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsRenameOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-gray-200 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Rename Group</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onMoveGroup(group.id, 'left');
                    }}
                    disabled={index === 0}
                    className="w-full flex items-center gap-2 px-3 py-2 text-gray-200 hover:bg-emerald-500/20 hover:text-emerald-300 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Move Left</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onMoveGroup(group.id, 'right');
                    }}
                    disabled={index === totalGroups - 1}
                    className="w-full flex items-center gap-2 px-3 py-2 text-gray-200 hover:bg-emerald-500/20 hover:text-emerald-300 disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span>Move Right</span>
                  </button>

                  <div className="my-1 border-t border-emerald-500/20" />

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsDeleteConfirmOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Group</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bookmarks List with Natural Height and Sensible Max-Height */}
        <div className="p-3 flex-1 overflow-y-auto space-y-1.5 min-h-[90px] max-h-[380px]">
          {group.bookmarks.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-500 font-mono">
              <Bookmark className="w-5 h-5 mx-auto mb-1 opacity-40 text-emerald-400" />
              <span>Empty cluster. Add your first bookmark below.</span>
            </div>
          ) : (
            group.bookmarks.map((bm, bIdx) => (
              <BookmarkItem
                key={bm.id}
                bookmark={bm}
                index={bIdx}
                totalCount={group.bookmarks.length}
                onEdit={() => setEditingBookmark(bm)}
                onDelete={() => onDeleteBookmark(group.id, bm.id)}
                onMoveUp={() => onMoveBookmark(group.id, bm.id, 'up')}
                onMoveDown={() => onMoveBookmark(group.id, bm.id, 'down')}
                onDragStart={e => handleBookmarkDragStart(e, bIdx)}
                onDragOver={handleBookmarkDragOver}
                onDrop={e => handleBookmarkDrop(e, bIdx)}
              />
            ))
          )}
        </div>

        {/* Bottom "+ Add bookmark" Action */}
        <div className="p-2 border-t border-emerald-500/10 bg-black/20">
          <button
            onClick={() => setIsAddBookmarkOpen(true)}
            aria-label="Add bookmark to this group"
            className="w-full py-1.5 px-3 rounded-lg text-xs font-mono text-emerald-400/90 hover:text-emerald-300 hover:bg-emerald-500/10 active:scale-[0.99] border border-dashed border-emerald-500/25 hover:border-emerald-500/50 flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add bookmark</span>
          </button>
        </div>
      </GlassCard>

      {/* Rename Group Modal */}
      <AddGroupModal
        isOpen={isRenameOpen}
        onClose={() => setIsRenameOpen(false)}
        onSave={newTitle => onRenameGroup(group.id, newTitle)}
        initialTitle={group.title}
        isEditing
      />

      {/* Delete Group Confirm Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => onDeleteGroup(group.id)}
        title={`Delete "${group.title}" Group`}
        message={`Are you sure you want to delete "${group.title}" and its ${group.bookmarks.length} bookmark(s)? This action cannot be undone.`}
        confirmLabel="Delete Group"
        isDestructive
      />

      {/* Add / Edit Bookmark Modal */}
      <BookmarkModal
        isOpen={isAddBookmarkOpen || editingBookmark !== null}
        onClose={() => {
          setIsAddBookmarkOpen(false);
          setEditingBookmark(null);
        }}
        onSave={(title, url) => {
          if (editingBookmark) {
            onEditBookmark(group.id, editingBookmark.id, title, url);
          } else {
            onAddBookmark(group.id, title, url);
          }
        }}
        initialData={editingBookmark}
        groupTitle={group.title}
      />
    </>
  );
};
