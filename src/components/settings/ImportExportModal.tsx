import React, { useState, useRef } from 'react';
import { DashboardBackup, DashboardState, ImportOptions } from '../../types/dashboard';
import { downloadBackupFile } from '../../services/backup/exportService';
import { validateImportJson } from '../../services/backup/importService';
import { ImportConflictDialog } from './ImportConflictDialog';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Download, Upload, RefreshCcw, CheckCircle2, AlertTriangle, FileJson } from 'lucide-react';

interface ImportExportModalProps {
  state: DashboardState;
  onImportBackup: (backup: DashboardBackup, options: ImportOptions) => void;
  onResetToDefaults: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  state,
  onImportBackup,
  onResetToDefaults,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [stagedBackup, setStagedBackup] = useState<DashboardBackup | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleExport = () => {
    try {
      const filename = downloadBackupFile(state);
      setDownloadSuccess(filename);
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (err) {
      setValidationError(`Export failed: ${(err as Error).message}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setValidationError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      const result = validateImportJson(content);
      if (!result.valid || !result.data) {
        setValidationError(result.error || 'Failed to validate backup file.');
      } else {
        // Valid backup staged -> open conflict resolution dialog
        setStagedBackup(result.data);
      }
    };
    reader.onerror = () => {
      setValidationError('Failed to read backup file from disk.');
    };
    reader.readAsText(file);

    // Reset input so user can re-select the same file if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Messages */}
      {downloadSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Backup successfully exported as {downloadSuccess}</span>
        </div>
      )}

      {validationError && (
        <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-mono flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Import Validation Failed:</span>
            <span>{validationError}</span>
          </div>
        </div>
      )}

      {/* EXPORT SECTION */}
      <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/20 space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Export Dashboard Backup
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed mt-0.5">
              Download your bookmark groups, links, and styling as a standalone JSON backup file. No passwords or API tokens are ever included.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="w-full py-2 px-4 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <FileJson className="w-4 h-4" />
          <span>Download JSON Backup</span>
        </button>
      </div>

      {/* IMPORT SECTION */}
      <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/20 space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Import Dashboard Backup
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed mt-0.5">
              Restore or merge bookmarks from another browser or device. You will be prompted to choose between replacing or merging data.
            </p>
          </div>
        </div>

        <input
          type="file"
          accept=".json,application/json"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-2 px-4 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span>Select Backup JSON File</span>
        </button>
      </div>

      {/* FACTORY RESET SECTION */}
      <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            <RefreshCcw className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold text-red-300 uppercase tracking-wider">
              Factory Reset
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed mt-0.5">
              Clear custom bookmarks, wallpapers, and settings to return to default command center presets.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsResetConfirmOpen(true)}
          className="w-full py-2 px-4 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 text-xs font-mono font-semibold transition-colors"
        >
          Reset All Data to Factory Default
        </button>
      </div>

      {/* Conflict Resolution Dialog */}
      <ImportConflictDialog
        isOpen={stagedBackup !== null}
        onClose={() => setStagedBackup(null)}
        importedBackup={stagedBackup}
        currentGroupsCount={state.bookmarkGroups.length}
        onConfirm={options => {
          if (stagedBackup) {
            onImportBackup(stagedBackup, options);
            setDownloadSuccess('Backup successfully imported.');
            setTimeout(() => setDownloadSuccess(null), 4000);
          }
        }}
      />

      {/* Factory Reset Confirm Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={onResetToDefaults}
        title="Reset Dashboard to Defaults"
        message="Are you sure you want to reset the entire dashboard? All custom groups, bookmarks, and settings will be restored to original factory defaults."
        confirmLabel="Reset Everything"
        isDestructive
      />
    </div>
  );
};
