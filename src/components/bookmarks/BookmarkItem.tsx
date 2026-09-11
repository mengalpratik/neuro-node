import React, { useState } from 'react';
import { BookmarkItem as BookmarkItemType } from '../../types/dashboard';
import { getFaviconUrl, markFaviconFailed } from '../../services/favicon/faviconService';
import {
  ExternalLink,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Globe,
} from 'lucide-react';

interface BookmarkItemProps {
  bookmark: BookmarkItemType;
  index: number;
  totalCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export const BookmarkItem: React.FC<BookmarkItemProps> = ({
  bookmark,
  index,
  totalCount,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const [imgError, setImgError] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDraggingThis, setIsDraggingThis] = useState(false);

  // Optional, isolated favicon URL (null if offline, internal, or previously failed)
  const faviconUrl = getFaviconUrl(bookmark.url);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDraggingThis(true);
    onDragStart(e);
  };

  const handleDragEnd = () => {
    setIsDraggingThis(false);
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    onDragOver(e);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    setIsDragOver(false);
    setIsDraggingThis(false);
    onDrop(e);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150 text-sm ${
        isDraggingThis
          ? 'opacity-40 border-dashed border-emerald-400 bg-emerald-950/20'
          : isDragOver
          ? 'border-emerald-400 bg-emerald-500/20 shadow-md shadow-emerald-500/10'
          : 'bg-black/30 hover:bg-black/60 border border-emerald-500/10 hover:border-emerald-500/30'
      }`}
    >
      {/* Drag handle: fixed width / shrink-0 */}
      <span
        className="text-gray-600 group-hover:text-emerald-400/80 cursor-grab active:cursor-grabbing p-1 touch-none shrink-0"
        title="Drag to reorder"
        aria-hidden="true"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </span>

      {/* Favicon or fallback icon: fixed width / shrink-0 */}
      <div className="w-4 h-4 rounded shrink-0 flex items-center justify-center overflow-hidden bg-black/40">
        {faviconUrl && !imgError ? (
          <img
            src={faviconUrl}
            alt=""
            onError={() => {
              markFaviconFailed(bookmark.url);
              setImgError(true);
            }}
            className="w-4 h-4 object-contain"
            loading="lazy"
          />
        ) : (
          <Globe className="w-3.5 h-3.5 text-gray-500" />
        )}
      </div>

      {/* Link & Title: flexible (flex: 1 1 auto; min-width: 0;), visible text, truncates gracefully */}
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 min-w-0 text-gray-200 hover:text-emerald-300 font-medium transition-colors flex items-center gap-1.5 focus:outline-none focus:underline"
        title={`${bookmark.title} (${bookmark.url})`}
      >
        <span className="truncate min-w-0 flex-1">{bookmark.title}</span>
        <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </a>

      {/* Contextual Action Controls (Floating pill on desktop hover, static flex flow on mobile): fixed width / shrink-0 */}
      <div className="flex items-center gap-0.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0 md:absolute md:right-2 md:top-1/2 md:-translate-y-1/2 md:bg-black/90 md:px-1 md:py-0.5 md:rounded-md md:border md:border-emerald-500/30 md:backdrop-blur-md md:shadow-lg z-10">
        {/* Reordering Buttons (Accessible Keyboard Fallback) */}
        <div className="flex items-center">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            aria-label={`Move ${bookmark.title} up`}
            className="p-1 sm:p-1 text-gray-400 hover:text-emerald-300 disabled:opacity-10 transition-colors focus:opacity-100"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === totalCount - 1}
            aria-label={`Move ${bookmark.title} down`}
            className="p-1 sm:p-1 text-gray-400 hover:text-emerald-300 disabled:opacity-10 transition-colors focus:opacity-100"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Edit Button */}
        <button
          onClick={onEdit}
          aria-label={`Edit ${bookmark.title}`}
          className="p-1 text-gray-400 hover:text-cyan-300 transition-colors focus:opacity-100"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>

        {/* Delete Button */}
        <button
          onClick={onDelete}
          aria-label={`Delete ${bookmark.title}`}
          className="p-1 text-gray-400 hover:text-red-400 transition-colors focus:opacity-100"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
