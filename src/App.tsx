import React, { useState } from 'react';
import { useDashboardStore } from './hooks/useDashboardStore';
import { DashboardShell } from './components/layout/DashboardShell';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { OverviewSection } from './components/overview/OverviewSection';
import { BookmarkSection } from './components/bookmarks/BookmarkSection';
import { SettingsDrawer } from './components/settings/SettingsDrawer';
import { IncomingPairRequestModal } from './components/sync/IncomingPairRequestModal';
import { hasCorruptedStateBackup, clearCorruptedStateBackup } from './services/storage/storageService';
import { AlertTriangle } from 'lucide-react';

export const App: React.FC = () => {
  const {
    state,
    addGroup,
    renameGroup,
    deleteGroup,
    moveGroup,
    reorderGroups,
    addBookmark,
    editBookmark,
    deleteBookmark,
    moveBookmark,
    reorderBookmarks,
    updateTheme,
    updateWeatherPreferences,
    updatePreferences,
    addReminder,
    toggleReminder,
    deleteReminder,
    importBackup,
    resetToDefaults,
    // Multi-device sync methods
    renameDevice,
    toggleSync,
    setServerUrl,
    generatePairCode,
    requestPairing,
    respondToPairRequest,
    unpairDevice,
    pendingPairRequest,
    clearPairRequest,
    triggerManualSync,
  } = useDashboardStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showCorruptionAlert, setShowCorruptionAlert] = useState(() => hasCorruptedStateBackup());

  const handleDismissCorruption = () => {
    clearCorruptedStateBackup();
    setShowCorruptionAlert(false);
  };

  const totalBookmarks = state.bookmarkGroups.reduce(
    (acc, g) => acc + g.bookmarks.length,
    0
  );

  return (
    <DashboardShell theme={state.theme}>
      {/* Header with hamburger settings trigger & sync status */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        groupsCount={state.bookmarkGroups.length}
        bookmarksCount={totalBookmarks}
        syncStatus={state.sync.syncStatus}
        pendingOperationsCount={state.sync.pendingChanges.length}
      />

      {/* Main Dashboard Space */}
      <main className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 xl:px-10 2xl:px-12 space-y-8 flex-1 pb-12">
        {/* Storage Corruption Recovery Alert */}
        {showCorruptionAlert && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                STORAGE RECOVERY: Corrupted localStorage data was detected. Safe defaults have been loaded and your previous raw data was preserved in backup storage.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={handleDismissCorruption}
                className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  resetToDefaults();
                  handleDismissCorruption();
                }}
                className="px-2.5 py-1 rounded bg-amber-500/30 hover:bg-amber-500/40 text-amber-100 font-semibold transition-colors"
              >
                Reset Storage
              </button>
            </div>
          </div>
        )}

        {/* Top Overview Section: Clock, Indian Calendar, Weather, Schedule */}
        <OverviewSection
          weatherPreferences={state.preferences.weather}
          reminders={state.preferences.reminders}
          isGoogleConfigured={state.preferences.google.enabled}
          onAddReminder={addReminder}
          onToggleReminder={toggleReminder}
          onDeleteReminder={deleteReminder}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Dynamic Responsive Bookmark Section */}
        <BookmarkSection
          groups={state.bookmarkGroups}
          onAddGroup={addGroup}
          onRenameGroup={renameGroup}
          onDeleteGroup={deleteGroup}
          onMoveGroup={moveGroup}
          onReorderGroups={reorderGroups}
          onAddBookmark={addBookmark}
          onEditBookmark={editBookmark}
          onDeleteBookmark={deleteBookmark}
          onMoveBookmark={moveBookmark}
          onReorderBookmarks={reorderBookmarks}
        />
      </main>

      {/* Footer */}
      <Footer />

      {/* Settings / Main Burger Menu Drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        state={state}
        onUpdateTheme={updateTheme}
        onUpdateWeather={updateWeatherPreferences}
        onUpdatePreferences={updatePreferences}
        onImportBackup={importBackup}
        onResetToDefaults={resetToDefaults}
        onRenameDevice={renameDevice}
        onToggleSync={toggleSync}
        onSetServerUrl={setServerUrl}
        onGeneratePairCode={generatePairCode}
        onRequestPairing={requestPairing}
        onUnpairDevice={unpairDevice}
        onTriggerManualSync={triggerManualSync}
      />

      {/* Incoming Interactive Pair Request Modal (Human Authorization) */}
      {pendingPairRequest && (
        <IncomingPairRequestModal
          request={pendingPairRequest}
          onRespond={respondToPairRequest}
          onClose={clearPairRequest}
        />
      )}
    </DashboardShell>
  );
};

export default App;
