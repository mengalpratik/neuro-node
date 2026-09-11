import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = true,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          {isDestructive && (
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400 shrink-0 border border-red-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
          )}
          <p className="text-sm text-gray-300 leading-relaxed pt-1">
            {message}
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-emerald-500/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800/60 hover:bg-gray-700/80 rounded-lg border border-gray-700 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              isDestructive
                ? 'bg-red-600/80 hover:bg-red-500 text-white shadow-lg shadow-red-900/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-black font-semibold'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
