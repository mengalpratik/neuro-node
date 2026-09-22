import React, { useState, useEffect } from 'react';
import {
  DashboardState,
  PairCodeInfo,
} from '../../types/dashboard';
import {
  Laptop,
  Smartphone,
  RefreshCw,
  Copy,
  Check,
  Plus,
  Trash2,
  Server,
  Radio,
  Clock,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Edit2,
} from 'lucide-react';

interface DevicesSyncSettingsProps {
  state: DashboardState;
  onRenameDevice: (name: string) => void;
  onToggleSync: (enabled?: boolean) => void;
  onSetServerUrl: (url: string) => void;
  onGeneratePairCode: () => Promise<PairCodeInfo>;
  onRequestPairing: (code: string) => Promise<{ requestId: string; targetDeviceName: string; targetShortId: string }>;
  onUnpairDevice: (targetDeviceId?: string) => Promise<boolean>;
  onTriggerManualSync: () => Promise<void>;
}

export const DevicesSyncSettings: React.FC<DevicesSyncSettingsProps> = ({
  state,
  onRenameDevice,
  onToggleSync,
  onSetServerUrl,
  onGeneratePairCode,
  onRequestPairing,
  onUnpairDevice,
  onTriggerManualSync,
}) => {
  const { device, sync } = state;

  // Local component state
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(device.deviceName);
  const [copiedId, setCopiedId] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Server URL config (defaults to current browser origin or VM01 when on github.io)
  const defaultOrigin =
    (import.meta as any).env?.VITE_DEFAULT_SERVER_URL ||
    (typeof window !== 'undefined' && !window.location.origin.includes('github.io')
      ? window.location.origin
      : 'http://92.4.73.160:8787');
  const [serverUrlInput, setServerUrlInput] = useState(sync.serverUrl || defaultOrigin);
  const [savedUrlMsg, setSavedUrlMsg] = useState(false);

  // Pairing Modal state
  const [pairModalOpen, setPairModalOpen] = useState(false);
  const [pairMode, setPairMode] = useState<'generate' | 'enter'>('generate');

  // Generate code state
  const [activeCodeInfo, setActiveCodeInfo] = useState<PairCodeInfo | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState(false);

  // Enter code state
  const [enteredCode, setEnteredCode] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  // Device Name Editing
  const handleSaveName = () => {
    if (nameInput.trim()) {
      onRenameDevice(nameInput.trim());
      setIsEditingName(false);
    }
  };

  const handleCopyDeviceId = () => {
    navigator.clipboard.writeText(device.deviceId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSaveServerUrl = (e: React.FormEvent) => {
    e.preventDefault();
    onSetServerUrl(serverUrlInput.trim());
    setSavedUrlMsg(true);
    setTimeout(() => setSavedUrlMsg(false), 2500);
  };

  const handleManualSync = async () => {
    try {
      setIsSyncing(true);
      await onTriggerManualSync();
    } finally {
      setIsSyncing(false);
    }
  };

  // Automatically dismiss pair modal once device is paired into a sync group
  useEffect(() => {
    if (sync.syncGroupId) {
      setPairModalOpen(false);
    }
  }, [sync.syncGroupId]);

  // Generate code handler
  const handleGenerateCode = async () => {
    try {
      setCodeLoading(true);
      const info = await onGeneratePairCode();
      setActiveCodeInfo(info);
      const remainingSeconds = Math.max(0, Math.floor((info.expiresAt - Date.now()) / 1000));
      setTimeLeft(remainingSeconds);
    } catch (err: any) {
      console.error('[NEURO//NODE] Failed to generate pair code:', err);
    } finally {
      setCodeLoading(false);
    }
  };

  // Countdown timer for pairing code
  useEffect(() => {
    if (!activeCodeInfo || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeCodeInfo, timeLeft]);

  // Enter code handler
  const handleRequestPairing = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = enteredCode.trim().toUpperCase();
    if (!clean) return;

    try {
      setRequestLoading(true);
      setRequestError(null);
      setRequestStatus('Sending pairing request...');
      const res = await onRequestPairing(clean);
      setRequestStatus(
        `Pairing request sent to "${res.targetDeviceName}" (${res.targetShortId}). Please approve on that device.`
      );
    } catch (err: any) {
      setRequestError(err.message || 'Failed to request pairing');
      setRequestStatus(null);
    } finally {
      setRequestLoading(false);
    }
  };

  const formatCodeInput = (val: string) => {
    const raw = val.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
    if (raw.length <= 2) return raw;
    if (raw.length <= 4) return `${raw.slice(0, 2)}-${raw.slice(2)}`;
    return `${raw.slice(0, 2)}-${raw.slice(2, 4)}-${raw.slice(4)}`;
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Security Architecture Header */}
      <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-mono font-bold text-emerald-300 block">
            LOCAL-FIRST MULTI-DEVICE SYNC
          </span>
          <p className="text-gray-300 leading-relaxed">
            NEURO//NODE runs 100% offline-first. LocalStorage is your immediate source of truth. The sync layer converges state across your devices with explicit pairing and zero cloud dependencies for normal operation.
          </p>
        </div>
      </div>

      {/* This Device Identity Card */}
      <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              THIS DEVICE IDENTITY
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-mono border border-emerald-500/30">
            {device.shortId}
          </span>
        </div>

        {/* Device Name Field */}
        <div className="space-y-1">
          <label className="text-[11px] font-mono text-gray-400">DEVICE NAME</label>
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg bg-black/60 border border-emerald-500 text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveName}
                className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-white font-medium bg-black/30 px-3 py-2 rounded-lg border border-gray-800">
              <span>{device.deviceName}</span>
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="text-gray-400 hover:text-emerald-400 p-1 transition-colors"
                title="Rename device"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Device ID */}
        <div className="space-y-1">
          <label className="text-[11px] font-mono text-gray-400">PERMANENT DEVICE ID</label>
          <div className="flex items-center justify-between text-xs font-mono text-gray-400 bg-black/30 px-3 py-1.5 rounded-lg border border-gray-800">
            <span className="truncate max-w-[240px] text-[11px]">{device.deviceId}</span>
            <button
              type="button"
              onClick={handleCopyDeviceId}
              className="text-gray-400 hover:text-emerald-400 transition-colors ml-2"
              title="Copy ID"
            >
              {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Status Telemetry */}
        <div className="pt-2 border-t border-gray-800 grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div>
            <span className="text-gray-500 block">CONNECTION:</span>
            <span
              className={`font-bold ${
                sync.syncStatus === 'SYNCED'
                  ? 'text-emerald-400'
                  : sync.syncStatus === 'ONLINE'
                  ? 'text-cyan-400'
                  : sync.syncStatus === 'SYNCING'
                  ? 'text-yellow-400'
                  : sync.syncStatus === 'OFFLINE'
                  ? 'text-amber-400'
                  : 'text-gray-400'
              }`}
            >
              {sync.syncStatus}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block">PENDING QUEUE:</span>
            <span className={sync.pendingChanges.length > 0 ? 'text-amber-400 font-bold' : 'text-gray-400'}>
              {sync.pendingChanges.length} changes
            </span>
          </div>
        </div>
      </div>

      {/* Sync Control & Configuration */}
      <div className="p-4 rounded-xl bg-black/40 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold text-white uppercase">
              MULTI-DEVICE SYNC ENGINE
            </span>
          </div>
          <button
            type="button"
            onClick={() => onToggleSync()}
            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
              sync.enabled ? 'bg-emerald-500' : 'bg-gray-700'
            }`}
            role="switch"
            aria-checked={sync.enabled}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                sync.enabled ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Server URL Form */}
        <form onSubmit={handleSaveServerUrl} className="space-y-2">
          <label className="text-[11px] font-mono text-gray-400 block flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>NEURO//NODE SYNC SERVER ENDPOINT</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={serverUrlInput}
              onChange={e => setServerUrlInput(e.target.value)}
              placeholder={defaultOrigin}
              className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg bg-black/60 border border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-mono rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors"
            >
              Update
            </button>
          </div>
          {savedUrlMsg && (
            <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
              <Check className="w-3 h-3" /> Server endpoint updated.
            </span>
          )}
        </form>

        {/* Telemetry Stats */}
        <div className="p-3 rounded-lg bg-black/60 border border-gray-800/80 space-y-1.5 text-[11px] font-mono">
          <div className="flex justify-between text-gray-400">
            <span>SYNC GROUP ID:</span>
            <span className="text-gray-300 font-bold">{sync.syncGroupId || 'NONE (LOCAL ONLY)'}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>SERVER REVISION:</span>
            <span className="text-gray-300">rev.{sync.lastServerRevision}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>MULTI-TAB BROADCAST:</span>
            <span className="text-emerald-400">ACTIVE (BROADCASTCHANNEL)</span>
          </div>
        </div>

        {/* Manual Force Sync Button */}
        {sync.enabled && sync.syncGroupId && (
          <button
            type="button"
            disabled={isSyncing}
            onClick={handleManualSync}
            className="w-full py-2 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'SYNCHRONIZING...' : 'FORCE SYNC NOW'}</span>
          </button>
        )}
      </div>

      {/* Paired Devices List */}
      <div className="p-4 rounded-xl bg-black/40 border border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold text-white uppercase">
              PAIRED DEVICES ({sync.pairedDevices.length})
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setPairModalOpen(true);
              handleGenerateCode();
            }}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Link Device</span>
          </button>
        </div>

        {sync.pairedDevices.length === 0 ? (
          <div className="p-4 rounded-lg border border-dashed border-gray-800 text-center space-y-2">
            <Radio className="w-5 h-5 text-gray-600 mx-auto" />
            <p className="text-xs text-gray-400">
              No devices currently paired to this dashboard.
            </p>
            <p className="text-[11px] text-gray-500">
              Click &quot;Link Device&quot; to generate or enter a pair code to synchronize across phone, tablet, and PC.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sync.pairedDevices.map(pd => (
              <div
                key={pd.deviceId}
                className="flex items-center justify-between p-3 rounded-lg bg-black/50 border border-gray-800 hover:border-emerald-500/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-gray-300" />
                    <span
                      className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                        pd.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{pd.deviceName}</span>
                      <span className="px-1.5 py-0.2 rounded bg-gray-800 text-emerald-400 text-[10px] font-mono">
                        {pd.shortId}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-gray-500">
                      {pd.isOnline ? 'ONLINE' : 'OFFLINE'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onUnpairDevice(pd.deviceId)}
                  className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  title="Unpair Device"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pairing Modal */}
      {pairModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md glass-panel border border-emerald-500/40 bg-[#06120b]/95 rounded-2xl shadow-2xl p-6 text-gray-100 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                  LINK NEW DEVICE
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close pair modal"
                onClick={() => {
                  setPairModalOpen(false);
                  setRequestStatus(null);
                  setRequestError(null);
                }}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/60 border border-gray-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => setPairMode('generate')}
                className={`py-2 rounded-lg text-center font-bold transition-colors ${
                  pairMode === 'generate'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                SHOW CODE (HOST)
              </button>
              <button
                type="button"
                onClick={() => setPairMode('enter')}
                className={`py-2 rounded-lg text-center font-bold transition-colors ${
                  pairMode === 'enter'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                ENTER CODE (JOIN)
              </button>
            </div>

            {/* Mode 1: Generate Code */}
            {pairMode === 'generate' && (
              <div className="space-y-4 text-center">
                <p className="text-xs text-gray-300">
                  Enter this temporary single-use code on your other device to link dashboards.
                </p>

                {codeLoading ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2 text-emerald-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-xs font-mono">Generating secure pair code...</span>
                  </div>
                ) : activeCodeInfo ? (
                  <div className="p-5 rounded-2xl bg-black/70 border border-emerald-500/40 space-y-3">
                    <div className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-emerald-300 drop-shadow-[0_0_12px_rgba(16,185,129,0.5)] select-all">
                      {activeCodeInfo.code}
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs font-mono text-gray-400">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>EXPIRES IN:</span>
                      <span className={`font-bold ${timeLeft < 60 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {formatTime(timeLeft)}
                      </span>
                    </div>

                    <div className="flex justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(activeCodeInfo.code);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-1.5 hover:bg-emerald-500/25 transition-colors"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleGenerateCode}
                        className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 text-xs font-mono flex items-center gap-1.5 hover:bg-gray-700 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Regenerate</span>
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="text-[11px] font-mono text-gray-400 bg-black/40 p-2.5 rounded-lg border border-gray-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>When requested, an interactive confirmation dialog will appear on this screen.</span>
                </div>
              </div>
            )}

            {/* Mode 2: Enter Code */}
            {pairMode === 'enter' && (
              <form onSubmit={handleRequestPairing} className="space-y-4">
                <p className="text-xs text-gray-300">
                  Enter the 6-character code generated on your host workstation.
                </p>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={enteredCode}
                    onChange={e => setEnteredCode(formatCodeInput(e.target.value))}
                    placeholder="XX-XX-XX"
                    maxLength={8}
                    className="w-full text-center py-3 text-2xl font-mono font-bold tracking-widest rounded-xl bg-black/60 border border-emerald-500/40 text-white placeholder-gray-700 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <span className="text-[11px] text-gray-500 block text-center font-mono">
                    Format: XX-XX-XX (e.g. 7K-89-2P)
                  </span>
                </div>

                {requestStatus && (
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 font-mono flex items-start gap-2">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5" />
                    <span>{requestStatus}</span>
                  </div>
                )}

                {requestError && (
                  <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-xs text-red-300 font-mono flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{requestError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={requestLoading || enteredCode.length < 8}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-800 disabled:text-gray-500 text-black text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {requestLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>REQUEST PAIRING</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
