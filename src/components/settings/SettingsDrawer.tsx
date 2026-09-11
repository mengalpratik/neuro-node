import React, { useState, useEffect } from 'react';
import {
  DashboardBackup,
  DashboardState,
  ImportOptions,
  PairCodeInfo,
  ThemeSettings as ThemeSettingsType,
  UserPreferences,
  WeatherPreferences,
} from '../../types/dashboard';
import { ThemeSettings } from './ThemeSettings';
import { BackgroundSettings } from './BackgroundSettings';
import { WeatherSettings } from './WeatherSettings';
import { IntegrationsSettings } from './IntegrationsSettings';
import { ImportExportModal } from './ImportExportModal';
import { DevicesSyncSettings } from './DevicesSyncSettings';
import {
  X,
  Palette,
  Image,
  CloudSun,
  Shield,
  Database,
  Sliders,
  Radio,
} from 'lucide-react';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  state: DashboardState;
  onUpdateTheme: (partial: Partial<ThemeSettingsType>) => void;
  onUpdateWeather: (partial: Partial<WeatherPreferences>) => void;
  onUpdatePreferences: (partial: Partial<UserPreferences>) => void;
  onImportBackup: (backup: DashboardBackup, options: ImportOptions) => void;
  onResetToDefaults: () => void;
  // Phase 2 Sync props
  onRenameDevice?: (name: string) => void;
  onToggleSync?: (enabled?: boolean) => void;
  onSetServerUrl?: (url: string) => void;
  onGeneratePairCode?: () => Promise<PairCodeInfo>;
  onRequestPairing?: (code: string) => Promise<{ requestId: string; targetDeviceName: string; targetShortId: string }>;
  onUnpairDevice?: (targetDeviceId?: string) => Promise<boolean>;
  onTriggerManualSync?: () => Promise<void>;
}

type SettingsTab = 'theme' | 'background' | 'weather' | 'sync' | 'integrations' | 'data';

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  state,
  onUpdateTheme,
  onUpdateWeather,
  onUpdatePreferences,
  onImportBackup,
  onResetToDefaults,
  onRenameDevice,
  onToggleSync,
  onSetServerUrl,
  onGeneratePairCode,
  onRequestPairing,
  onUnpairDevice,
  onTriggerManualSync,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('theme');

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'theme', label: 'Theme & Colors', icon: <Palette className="w-4 h-4" /> },
    { id: 'background', label: 'Wallpaper', icon: <Image className="w-4 h-4" /> },
    { id: 'weather', label: 'Meteorology', icon: <CloudSun className="w-4 h-4" /> },
    { id: 'sync', label: 'Devices & Sync', icon: <Radio className="w-4 h-4" /> },
    { id: 'integrations', label: 'Security & OAuth', icon: <Shield className="w-4 h-4" /> },
    { id: 'data', label: 'Data & Backup', icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-md glass-panel border-l border-emerald-500/30 flex flex-col h-full bg-[#050d09]/95 text-gray-100 shadow-2xl animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/20 bg-black/40">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                SYSTEM CONFIG // SETTINGS
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close settings drawer"
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-emerald-500/20 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center border-b border-emerald-500/15 bg-black/20 overflow-x-auto px-4 gap-1 py-2">
            {tabs.map(tab => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-black/30'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content Body */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'theme' && (
              <ThemeSettings theme={state.theme} onUpdateTheme={onUpdateTheme} />
            )}

            {activeTab === 'background' && (
              <BackgroundSettings theme={state.theme} onUpdateTheme={onUpdateTheme} />
            )}

            {activeTab === 'weather' && (
              <WeatherSettings
                weather={state.preferences.weather}
                onUpdateWeather={onUpdateWeather}
              />
            )}

            {activeTab === 'sync' && (
              <DevicesSyncSettings
                state={state}
                onRenameDevice={onRenameDevice || (() => {})}
                onToggleSync={onToggleSync || (() => {})}
                onSetServerUrl={onSetServerUrl || (() => {})}
                onGeneratePairCode={onGeneratePairCode || (async () => ({ code: '00-00-00', expiresAt: Date.now() }))}
                onRequestPairing={onRequestPairing || (async () => ({ requestId: '', targetDeviceName: '', targetShortId: '' }))}
                onUnpairDevice={onUnpairDevice || (async () => true)}
                onTriggerManualSync={onTriggerManualSync || (async () => {})}
              />
            )}

            {activeTab === 'integrations' && (
              <IntegrationsSettings
                settings={state.preferences.google}
                onUpdateGoogle={partial =>
                  onUpdatePreferences({
                    google: { ...state.preferences.google, ...partial },
                  })
                }
              />
            )}

            {activeTab === 'data' && (
              <ImportExportModal
                state={state}
                onImportBackup={onImportBackup}
                onResetToDefaults={onResetToDefaults}
              />
            )}
          </div>

          {/* Footer Info & Attribution */}
          <div className="p-3.5 border-t border-emerald-500/15 bg-black/40 text-[11px] font-mono text-gray-500 space-y-1.5">
            <div className="flex items-center justify-between">
              <span>Schema v{state.version} // Local-First</span>
              <span className="text-emerald-400/80">Persistent State Active</span>
            </div>
            <div className="pt-1 border-t border-emerald-500/10 text-center text-[10px] text-gray-400">
              NEURO//NODE • Built with love by <span className="text-emerald-300 font-semibold">Mengal Pratik (Neuro)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
