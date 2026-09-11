import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';

interface AddGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string) => void;
  initialTitle?: string;
  isEditing?: boolean;
}

export const AddGroupModal: React.FC<AddGroupModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTitle = '',
  isEditing = false,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(initialTitle);
    setError(null);
  }, [initialTitle, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Please provide a group title.');
      return;
    }
    onSave(trimmed);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Rename Bookmark Group' : 'Create New Bookmark Group'}
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
            Group Title <span className="text-emerald-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => {
              setTitle(e.target.value);
              setError(null);
            }}
            placeholder="e.g. Cloud Infrastructure, Research, Finance"
            autoFocus
            required
            className="w-full px-3 py-2 rounded-lg bg-black/60 border border-emerald-500/30 text-emerald-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm font-sans"
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
            {isEditing ? 'Rename Group' : 'Create Group'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
