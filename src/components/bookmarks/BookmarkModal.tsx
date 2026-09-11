import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { BookmarkItem } from '../../types/dashboard';
import { isValidWebUrl } from '../../services/backup/importService';
import { Globe } from 'lucide-react';

interface BookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, url: string) => void;
  initialData?: BookmarkItem | null;
  groupTitle: string;
}

export const BookmarkModal: React.FC<BookmarkModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  groupTitle,
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setUrl(initialData.url);
    } else {
      setTitle('');
      setUrl('');
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setError('Please provide a URL.');
      return;
    }

    const lower = trimmedUrl.toLowerCase();
    if (
      lower.startsWith('javascript:') ||
      lower.startsWith('data:') ||
      lower.startsWith('vbscript:') ||
      lower.startsWith('file:')
    ) {
      setError('Invalid or unsafe URL scheme. Only HTTP and HTTPS navigation schemes are permitted.');
      return;
    }

    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://') && !trimmedUrl.startsWith('ftp://')) {
      trimmedUrl = `https://${trimmedUrl}`;
    }

    if (!isValidWebUrl(trimmedUrl)) {
      setError('Please enter a valid website URL (e.g. https://example.com).');
      return;
    }

    const trimmedTitle = title.trim() || new URL(trimmedUrl).hostname;

    onSave(trimmedTitle, trimmedUrl);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Bookmark' : `Add Bookmark to ${groupTitle}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-mono text-gray-300 mb-1">
            Website URL <span className="text-emerald-400">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={url}
              onChange={e => {
                setUrl(e.target.value);
                setError(null);
              }}
              placeholder="e.g. https://github.com or github.com"
              autoFocus={!initialData}
              required
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-black/60 border border-emerald-500/30 text-emerald-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm font-mono"
            />
            <Globe className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono text-gray-300 mb-1">
            Bookmark Label / Title
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. GitHub Dashboard (leave blank for domain name)"
            className="w-full px-3 py-2 rounded-lg bg-black/60 border border-emerald-500/30 text-emerald-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-emerald-500/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black transition-colors"
          >
            {initialData ? 'Update Bookmark' : 'Add Bookmark'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
