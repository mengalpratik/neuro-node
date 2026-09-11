import React from 'react';
import { useLiveClock } from '../../hooks/useLiveClock';
import { GlassCard } from '../common/GlassCard';
import { Clock as ClockIcon } from 'lucide-react';

export const LiveClockCard: React.FC = () => {
  const { hours12, minutes, seconds, ampm, dateFormatted, dayOfWeek, timezone } = useLiveClock();

  return (
    <GlassCard className="p-5 flex flex-col justify-between relative overflow-hidden group">
      {/* Top Meta */}
      <div className="flex items-center justify-between text-xs text-gray-400 font-mono mb-2">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <ClockIcon className="w-3.5 h-3.5 animate-pulse" />
          <span className="tracking-widest uppercase font-semibold">CHRONO // LIVE</span>
        </span>
        <span className="truncate max-w-[120px] text-gray-500">{timezone}</span>
      </div>

      {/* Main Clock Display: HH:MM:SS AM/PM with tabular-nums to prevent jitter */}
      <div className="my-2">
        <div className="flex items-baseline gap-1 font-mono tracking-tight select-none tabular-nums">
          <span className="text-4xl sm:text-5xl font-bold text-white tracking-wider tabular-nums">
            {hours12}:{minutes}
          </span>
          <span className="text-2xl sm:text-3xl font-semibold text-emerald-400 tabular-nums">
            :{seconds}
          </span>
          <span className="ml-2 text-xs sm:text-sm font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 tracking-wider">
            {ampm}
          </span>
        </div>
      </div>

      {/* Date & Day of Week */}
      <div className="pt-2 border-t border-emerald-500/15 flex items-center justify-between text-xs sm:text-sm">
        <span className="font-medium text-emerald-100">{dayOfWeek}</span>
        <span className="font-mono text-gray-300">{dateFormatted}</span>
      </div>
    </GlassCard>
  );
};
