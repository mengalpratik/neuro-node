import React, { useMemo } from 'react';
import { GlassCard } from '../common/GlassCard';
import { getIndianCalendarInfo } from '../../services/calendar/indianCalendarService';
import { Calendar, Moon, Sparkles } from 'lucide-react';

export const IndianCalendarCard: React.FC = () => {
  const cal = useMemo(() => getIndianCalendarInfo(), []);

  return (
    <GlassCard className="p-5 flex flex-col justify-between relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-gray-400 font-mono mb-2">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <Calendar className="w-3.5 h-3.5" />
          <span className="tracking-widest uppercase font-semibold">भारतीय पंचांग // CALENDAR (LUNISOLAR)</span>
        </span>
        <span className="text-emerald-400/90 font-mono text-[11px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
          शके {cal.shakaYear}
        </span>
      </div>

      {/* Main Marathi Month & Paksha - Primary Hierarchy */}
      <div className="my-1.5 space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <span className="text-2xl sm:text-3xl font-bold text-white tracking-wide block leading-tight">
              {cal.marathiMonth}
            </span>
            <span className="text-xs text-emerald-300/80 font-mono">
              ({cal.marathiMonthEnglish})
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold font-mono block">
              {cal.paksha} पक्ष
            </span>
            <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
              Algorithmic
            </span>
          </div>
        </div>

        <div className="text-xs text-gray-200 font-mono flex items-center justify-between pt-1 border-t border-emerald-500/10">
          <span className="truncate">तिथी: <span className="text-emerald-300 font-semibold">{cal.tithiApprox}</span></span>
          <span className="flex items-center gap-1 text-gray-400 shrink-0">
            <Moon className="w-3 h-3 text-emerald-400" />
            <span>{cal.moonIlluminationPercent}%</span>
          </span>
        </div>
      </div>

      {/* Moon / Amavasya / Purnima status bar */}
      <div className="my-1.5">
        <div className="w-full bg-gray-800/60 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-emerald-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${cal.moonIlluminationPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
          <span className="truncate">{cal.moonPhaseName}</span>
          {cal.isPurnima && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
              पौर्णिमा
            </span>
          )}
          {cal.isAmavasya && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-400/20 text-purple-300 border border-purple-400/40">
              अमावास्या
            </span>
          )}
        </div>
      </div>

      {/* Festival Alert or Upcoming Occasion */}
      <div className="pt-2 border-t border-emerald-500/15 text-xs">
        {cal.festivalToday ? (
          <div className="flex items-center gap-1.5 text-amber-300 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">आज: {cal.festivalToday}</span>
          </div>
        ) : cal.upcomingFestivals.length > 0 ? (
          <div className="flex items-center justify-between text-gray-300">
            <span className="truncate max-w-[170px] text-emerald-300/90">
              {cal.upcomingFestivals[0].marathiName}
            </span>
            <span className="text-[11px] font-mono text-gray-400 shrink-0">
              {cal.upcomingFestivals[0].daysLeft === 0
                ? 'Today'
                : cal.upcomingFestivals[0].daysLeft === 1
                ? 'Tomorrow'
                : `in ${cal.upcomingFestivals[0].daysLeft}d`}
            </span>
          </div>
        ) : (
          <span className="text-gray-500">No major festivals in the next 60 days</span>
        )}
      </div>
    </GlassCard>
  );
};
