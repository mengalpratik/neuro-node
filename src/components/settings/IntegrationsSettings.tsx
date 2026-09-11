import React, { useState } from 'react';
import { GoogleIntegrationSettings } from '../../types/dashboard';
import { GoogleIntegrationManager } from '../../services/google/googleIntegrationService';
import { ShieldCheck, Key, CheckCircle, Info } from 'lucide-react';

interface IntegrationsSettingsProps {
  settings: GoogleIntegrationSettings;
  onUpdateGoogle: (partial: Partial<GoogleIntegrationSettings>) => void;
}

export const IntegrationsSettings: React.FC<IntegrationsSettingsProps> = ({
  settings,
  onUpdateGoogle,
}) => {
  const [clientId, setClientId] = useState(settings.clientId || '');
  const [savedMsg, setSavedMsg] = useState(false);

  const status = GoogleIntegrationManager.getStatusDescription(settings.clientId);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateGoogle({
      clientId: clientId.trim(),
      enabled: clientId.trim().length > 10,
    });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const handleDisconnect = () => {
    setClientId('');
    onUpdateGoogle({
      clientId: '',
      enabled: false,
    });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Security Architecture Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-mono font-bold text-emerald-300 block">
            ZERO-KNOWLEDGE SECURITY GUARANTEE
          </span>
          <p className="text-gray-300 leading-relaxed">
            All dashboard integrations run 100% client-side. No API keys, OAuth client IDs, or session tokens are ever hardcoded in the codebase, transmitted to an external server, or exposed in exported backup files.
          </p>
        </div>
      </div>

      {/* Google Calendar Status */}
      <div className="p-3.5 rounded-xl bg-black/40 border border-gray-800 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-gray-400">STATUS:</span>
          <span
            className={`font-bold uppercase px-2 py-0.5 rounded text-[11px] ${
              status.status === 'configured'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            {status.status}
          </span>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed font-mono">
          {status.message}
        </p>
      </div>

      {/* Client ID Form */}
      <form onSubmit={handleSave} className="space-y-3">
        <div>
          <label className="text-xs font-mono text-gray-300 block mb-1 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-emerald-400" />
            <span>Google OAuth 2.0 Client ID (Optional)</span>
          </label>
          <input
            type="text"
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            placeholder="e.g. 123456789-abcdefg.apps.googleusercontent.com"
            className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-black/50 border border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          />
          <span className="text-[11px] text-gray-500 block mt-1">
            Leave blank to run in pure local offline mode.
          </span>
        </div>

        <div className="flex items-center justify-between pt-1">
          {savedMsg ? (
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Updated configuration.
            </span>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            {(settings.clientId || clientId) && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-3 py-1.5 text-xs font-mono rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                Disconnect
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-mono font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </form>

      {/* Setup Guide Accordion / Info */}
      <div className="p-3 rounded-xl bg-black/20 border border-gray-800/80 text-xs text-gray-400 space-y-1.5">
        <div className="flex items-center gap-1.5 text-emerald-400/90 font-mono font-semibold">
          <Info className="w-3.5 h-3.5" />
          <span>How to enable Google Calendar sync:</span>
        </div>
        <ol className="list-decimal list-inside space-y-1 text-[11px] text-gray-400">
          <li>Create a project in the Google Cloud Console.</li>
          <li>Configure an OAuth consent screen and create an OAuth 2.0 Web Client ID.</li>
          <li>Add your local dashboard origin (<code className="text-emerald-300">http://localhost:5173</code>) to Authorized JavaScript origins.</li>
          <li>Paste the Client ID above.</li>
        </ol>
      </div>
    </div>
  );
};
