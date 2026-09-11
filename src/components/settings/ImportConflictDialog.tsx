import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { DashboardBackup, ImportDataStrategy, ImportOptions, ImportStylingStrategy } from '../../types/dashboard';
import { Layers, Palette, RefreshCw, GitMerge } from 'lucide-react';

interface ImportConflictDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: ImportOptions) => void;
  importedBackup: DashboardBackup | null;
  currentGroupsCount: number;
}

export const ImportConflictDialog: React.FC<ImportConflictDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  importedBackup,
  currentGroupsCount,
}) => {
  const [dataStrategy, setDataStrategy] = useState<ImportDataStrategy>('merge');
  const [stylingStrategy, setStylingStrategy] = useState<ImportStylingStrategy>('keep');

  if (!importedBackup) return null;

  const importedGroupsCount = importedBackup.bookmarkGroups.length;
  const importedBookmarksCount = importedBackup.bookmarkGroups.reduce(
    (acc, g) => acc + g.bookmarks.length,
    0
  );

  const handleApply = () => {
    onConfirm({
      dataStrategy,
      stylingStrategy,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Conflict Resolution"
      maxWidth="max-w-lg"
      description="Choose how you want to apply this backup to your existing dashboard."
    >
      <div className="space-y-5">
        {/* Backup Summary Banner */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/20 text-xs font-mono space-y-1">
          <div className="flex justify-between text-gray-400">
            <span>Incoming Backup:</span>
            <span className="text-emerald-300 font-bold">
              {importedGroupsCount} groups, {importedBookmarksCount} bookmarks
            </span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Current Device:</span>
            <span className="text-gray-300">{currentGroupsCount} groups existing</span>
          </div>
          {importedBackup.exportedAt && (
            <div className="flex justify-between text-gray-500 text-[11px] pt-1 border-t border-gray-800">
              <span>Exported on:</span>
              <span>{new Date(importedBackup.exportedAt).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* STEP 1: Bookmark Data Strategy */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold block flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>1. Bookmark Data Strategy</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Merge Option (Default & Recommended) */}
            <button
              type="button"
              onClick={() => setDataStrategy('merge')}
              className={`p-3 rounded-xl text-left border transition-all ${
                dataStrategy === 'merge'
                  ? 'bg-emerald-500/15 border-emerald-400 ring-1 ring-emerald-400 text-white'
                  : 'bg-black/30 hover:bg-black/50 border-gray-800 text-gray-400'
              }`}
            >
              <div className="flex items-center gap-2 font-mono font-semibold text-xs text-emerald-300 mb-1">
                <GitMerge className="w-4 h-4" />
                <span>Merge Data (Recommended)</span>
              </div>
              <p className="text-[11px] text-gray-300 leading-snug">
                Preserve existing groups. Append new groups and merge bookmarks without creating duplicate URLs.
              </p>
            </button>

            {/* Replace Option */}
            <button
              type="button"
              onClick={() => setDataStrategy('replace')}
              className={`p-3 rounded-xl text-left border transition-all ${
                dataStrategy === 'replace'
                  ? 'bg-red-500/15 border-red-400 ring-1 ring-red-400 text-white'
                  : 'bg-black/30 hover:bg-black/50 border-gray-800 text-gray-400'
              }`}
            >
              <div className="flex items-center gap-2 font-mono font-semibold text-xs text-red-300 mb-1">
                <RefreshCw className="w-4 h-4" />
                <span>Replace Data</span>
              </div>
              <p className="text-[11px] text-gray-300 leading-snug">
                Completely overwrite all current bookmark groups and bookmarks with the imported backup.
              </p>
            </button>
          </div>
        </div>

        {/* STEP 2: Theme & Styling Strategy */}
        <div className="space-y-2 pt-2 border-t border-gray-800">
          <label className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold block flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" />
            <span>2. Theme & Visual Styling</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Keep Current Styling */}
            <button
              type="button"
              onClick={() => setStylingStrategy('keep')}
              className={`p-3 rounded-xl text-left border transition-all ${
                stylingStrategy === 'keep'
                  ? 'bg-emerald-500/15 border-emerald-400 ring-1 ring-emerald-400 text-white'
                  : 'bg-black/30 hover:bg-black/50 border-gray-800 text-gray-400'
              }`}
            >
              <span className="block font-mono font-semibold text-xs text-emerald-300 mb-0.5">
                Keep Current Device Styling
              </span>
              <p className="text-[11px] text-gray-300 leading-snug">
                Retain this device's current wallpaper, colors, and opacity settings.
              </p>
            </button>

            {/* Apply Imported Styling */}
            <button
              type="button"
              onClick={() => setStylingStrategy('apply')}
              className={`p-3 rounded-xl text-left border transition-all ${
                stylingStrategy === 'apply'
                  ? 'bg-emerald-500/15 border-emerald-400 ring-1 ring-emerald-400 text-white'
                  : 'bg-black/30 hover:bg-black/50 border-gray-800 text-gray-400'
              }`}
            >
              <span className="block font-mono font-semibold text-xs text-emerald-300 mb-0.5">
                Apply Imported Styling
              </span>
              <p className="text-[11px] text-gray-300 leading-snug">
                Adopt the theme, colors, and background bundled inside the backup file.
              </p>
            </button>
          </div>
        </div>

        {/* Summary Pill */}
        <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs font-mono text-emerald-300 flex items-center justify-between">
          <span>Action Plan:</span>
          <span className="font-bold">
            {dataStrategy === 'merge' ? 'Merge Bookmarks' : 'Replace Bookmarks'} +{' '}
            {stylingStrategy === 'keep' ? 'Keep Current Styling' : 'Apply Imported Styling'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-emerald-500/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white"
          >
            Cancel Import
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-900/30 transition-colors"
          >
            Confirm & Import
          </button>
        </div>
      </div>
    </Modal>
  );
};
