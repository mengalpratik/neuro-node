import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { getHoroscopeDetails } from '../../services/horoscope/horoscopeService';
import { Sparkles, Filter } from 'lucide-react';

interface HoroscopeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HoroscopeModal: React.FC<HoroscopeModalProps> = ({ isOpen, onClose }) => {
  const [selectedElement, setSelectedElement] = useState<string>('All');
  const [selectedSignId, setSelectedSignId] = useState<string>('aries');

  const signs = getHoroscopeDetails();
  const filteredSigns = selectedElement === 'All' 
    ? signs 
    : signs.filter(s => s.element === selectedElement);

  const activeSign = signs.find(s => s.id === selectedSignId) || signs[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="दैनिक राशीभविष्य // HOROSCOPE INSIGHTS"
      maxWidth="max-w-4xl"
      description="Daily astrological planetary guidance and Rashi attributes (Offline Modular Engine)"
    >
      <div className="space-y-5">
        {/* Element Filter pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-emerald-500/20">
          <div className="flex items-center gap-1.5 text-xs font-mono text-gray-400">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <span>Element:</span>
          </div>
          <div className="flex items-center gap-1.5">
            {['All', 'Fire', 'Earth', 'Air', 'Water'].map(elem => (
              <button
                key={elem}
                onClick={() => setSelectedElement(elem)}
                className={`px-2.5 py-1 text-xs rounded-lg font-mono transition-colors ${
                  selectedElement === elem
                    ? 'bg-emerald-500 text-black font-semibold shadow-sm shadow-emerald-500/50'
                    : 'bg-black/40 text-gray-400 hover:text-emerald-300 border border-emerald-500/20'
                }`}
              >
                {elem}
              </button>
            ))}
          </div>
        </div>

        {/* 12 Zodiac Buttons */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {filteredSigns.map(sign => {
            const isSelected = sign.id === selectedSignId;
            return (
              <button
                key={sign.id}
                onClick={() => setSelectedSignId(sign.id)}
                className={`p-2 rounded-xl text-center transition-all duration-150 border ${
                  isSelected
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400'
                    : 'bg-black/30 hover:bg-black/50 border-emerald-500/15 text-gray-300 hover:text-white'
                }`}
              >
                <div className="text-xl leading-none mb-1">{sign.symbol}</div>
                <div className="text-xs font-bold leading-tight truncate">{sign.name}</div>
                <div className="text-[10px] text-emerald-400/80 font-mono truncate">{sign.rashiMarathi}</div>
              </button>
            );
          })}
        </div>

        {/* Selected Sign Highlight Card */}
        {activeSign && (
          <div className="p-5 rounded-2xl bg-black/50 border border-emerald-500/30 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-emerald-500/20">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  {activeSign.symbol}
                </span>
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>{activeSign.name}</span>
                    <span className="text-sm font-normal text-emerald-400">({activeSign.rashiMarathi} / {activeSign.rashiTranslit})</span>
                  </h3>
                  <span className="text-xs text-gray-400 font-mono">{activeSign.dateRange}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {activeSign.element}
                </span>
                <span className="px-2 py-1 rounded bg-black/60 text-gray-300 border border-gray-700">
                  {activeSign.rulingPlanet}
                </span>
              </div>
            </div>

            {/* Daily Insight */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>DAILY ASTROLOGICAL GUIDANCE</span>
              </div>
              <p className="text-sm text-gray-200 leading-relaxed font-sans bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-500/20">
                {activeSign.prediction}
              </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-1">
              <div className="p-2 rounded-lg bg-black/40 border border-emerald-500/15">
                <span className="text-gray-400 block text-[10px]">FOCUS AREA</span>
                <span className="text-emerald-200 font-semibold">{activeSign.focusArea}</span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-emerald-500/15">
                <span className="text-gray-400 block text-[10px]">LUCKY NUMBER</span>
                <span className="text-emerald-300 font-bold text-sm">{activeSign.luckyNumber}</span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-emerald-500/15">
                <span className="text-gray-400 block text-[10px]">LUCKY COLOR</span>
                <span className="text-emerald-200 font-semibold">{activeSign.luckyColor}</span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-emerald-500/15">
                <span className="text-gray-400 block text-[10px]">COMPATIBILITY</span>
                <span className="text-emerald-200 font-semibold">{activeSign.compatibility}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
