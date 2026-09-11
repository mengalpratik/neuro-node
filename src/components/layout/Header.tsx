import React from 'react';
import { SyncConnectionStatus } from '../../types/dashboard';
import { Menu, Terminal, HardDrive, Wifi, WifiOff, Radio, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  groupsCount: number;
  bookmarksCount: number;
  syncStatus?: SyncConnectionStatus;
  pendingOperationsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  groupsCount,
  bookmarksCount,
  syncStatus = 'LOCAL_ONLY',
  pendingOperationsCount = 0,
}) => {
  const [isOnline, setIsOnline] = React.useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [storageKb, setStorageKb] = React.useState<string>('0.0');

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  React.useEffect(() => {
    try {
      const rawState = localStorage.getItem('PERSONAL_DASHBOARD_V1');
      if (rawState) {
        // Measure exact UTF-8 serialized byte size
        const bytes = typeof Blob !== 'undefined'
          ? new Blob([rawState]).size
          : new TextEncoder().encode(rawState).length;
        setStorageKb((bytes / 1024).toFixed(1));
      } else {
        setStorageKb('0.0');
      }
    } catch {
      setStorageKb('0.0');
    }
  }, [groupsCount, bookmarksCount]);

  return (
    <header className="w-full glass-panel-subtle border-b border-emerald-500/20 py-2.5 px-4 sm:px-8 xl:px-10 2xl:px-12 mb-6 sticky top-0 z-40 backdrop-blur-md">
      <div className="w-full max-w-[1720px] mx-auto flex items-center justify-between gap-2">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
            <Terminal className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg font-mono font-bold tracking-wider text-white flex items-center gap-1.5 sm:gap-2 truncate">
              <span>NEURO//NODE</span>
              <span className="text-emerald-400 text-[10px] sm:text-xs px-1.5 py-0.2 sm:py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 font-semibold">
                COMMAND
              </span>
            </h1>
            <p className="text-[10px] font-mono text-gray-400 hidden md:block">
              LOCAL-FIRST PERSONAL HOME INTERFACE
            </p>
          </div>
        </div>

        {/* Telemetry Status & Main Burger Menu Trigger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Truthful Storage Telemetry */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-gray-400 bg-black/40 px-2.5 py-1 rounded-lg border border-emerald-500/15">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span>LOCAL DATA:</span>
            <span className="text-emerald-300 font-semibold">{storageKb} KB</span>
          </div>

          {/* Truthful Multi-Device Sync Status Telemetry */}
          <div className="hidden md:flex items-center gap-1.5 text-xs font-mono bg-black/40 px-2.5 py-1 rounded-lg border border-emerald-500/15">
            {syncStatus === 'SYNCED' ? (
              <>
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">SYNCED</span>
              </>
            ) : syncStatus === 'SYNCING' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
                <span className="text-yellow-400 font-semibold">SYNCING</span>
              </>
            ) : syncStatus === 'ONLINE' ? (
              <>
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-cyan-400 font-semibold">ONLINE</span>
              </>
            ) : syncStatus === 'OFFLINE' ? (
              <>
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400 font-semibold">
                  OFFLINE {pendingOperationsCount > 0 ? `(${pendingOperationsCount}Q)` : ''}
                </span>
              </>
            ) : syncStatus === 'ERROR' ? (
              <>
                <Radio className="w-3.5 h-3.5 text-red-400" />
                <span className="text-red-400 font-semibold">SYNC ERR</span>
              </>
            ) : (
              <>
                <Radio className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-gray-400 font-semibold">LOCAL ONLY</span>
              </>
            )}
          </div>

          {/* Truthful Network status */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono bg-black/40 px-2.5 py-1 rounded-lg border border-emerald-500/15">
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">ONLINE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400 font-semibold">OFFLINE</span>
              </>
            )}
          </div>

          {/* MAIN HAMBURGER MENU BUTTON */}
          <button
            onClick={onOpenSettings}
            aria-label="Open main system settings menu"
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 transition-all font-mono text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 min-h-[36px]"
          >
            <Menu className="w-4 h-4" />
            <span className="hidden xs:inline">MENU</span>
          </button>
        </div>
      </div>
    </header>
  );
};
