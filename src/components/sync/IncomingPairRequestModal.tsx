import React, { useState } from 'react';
import { PairRequestInfo } from '../../types/dashboard';
import { ShieldAlert, Smartphone, Check, X, Loader2 } from 'lucide-react';

interface IncomingPairRequestModalProps {
  request: PairRequestInfo;
  onRespond: (requestId: string, approved: boolean) => Promise<any>;
  onClose: () => void;
}

export const IncomingPairRequestModal: React.FC<IncomingPairRequestModalProps> = ({
  request,
  onRespond,
  onClose,
}) => {
  const [submitting, setSubmitting] = useState(false);

  const handleAction = async (approved: boolean) => {
    try {
      setSubmitting(true);
      await onRespond(request.requestId, approved);
    } catch (err) {
      console.error('[NEURO//NODE] Pair response error:', err);
    } finally {
      setSubmitting(false);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pair-request-title"
    >
      <div className="w-full max-w-md glass-panel border border-emerald-500/50 bg-[#07130c]/95 rounded-2xl shadow-2xl p-6 text-gray-100 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-emerald-500/20 pb-4">
          <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 id="pair-request-title" className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              INCOMING PAIRING REQUEST
            </h3>
            <span className="text-xs text-gray-400 font-mono">Explicit human authorization required</span>
          </div>
        </div>

        {/* Device Info Card */}
        <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/30 space-y-3">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white truncate">
                {request.requesterDevice.deviceName || 'Remote Device'}
              </div>
              <div className="text-[11px] font-mono text-emerald-400/80">
                IDENTIFIER: {request.requesterDevice.shortId}
              </div>
            </div>
          </div>
          <div className="text-[11px] font-mono text-gray-400 border-t border-gray-800 pt-2 flex items-center justify-between">
            <span>REQUEST TIME:</span>
            <span className="text-gray-300">Just now</span>
          </div>
        </div>

        {/* Security explanation */}
        <p className="text-xs text-gray-300 leading-relaxed">
          A device entered your temporary pairing code. Approving will link this device into your synchronized group, enabling encrypted multi-device state convergence.
        </p>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleAction(false)}
            className="px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <X className="w-4 h-4" />
            <span>REJECT</span>
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleAction(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>ALLOW & LINK</span>
          </button>
        </div>
      </div>
    </div>
  );
};
