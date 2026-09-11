import React from 'react';
import { ShieldCheck, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full mt-auto py-6 px-4 sm:px-8 xl:px-10 2xl:px-12 border-t border-emerald-500/15 text-xs font-mono text-gray-500">
      <div className="w-full max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div className="space-y-1">
          <div className="flex items-center justify-center md:justify-start gap-2 text-emerald-400/90 font-bold tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>NEURO//NODE // LOCAL-FIRST PERSONAL HOME INTERFACE</span>
          </div>
          <p className="text-[11px] text-gray-400/90 font-mono">
            Built with love by <span className="text-emerald-300 font-semibold">Mengal Pratik (Neuro)</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-gray-500 text-[11px]">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/30 border border-emerald-500/20 text-emerald-400/80">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>NEURO//NODE OS v1.0.0</span>
          </span>
          <span>•</span>
          <span>CLIENT ISOLATED</span>
          <span>•</span>
          <span>DATA PERSISTED IN LOCALSTORAGE</span>
        </div>
      </div>
    </footer>
  );
};
