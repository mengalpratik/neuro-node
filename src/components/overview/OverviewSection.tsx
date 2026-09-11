import React, { useState } from 'react';
import { LiveClockCard } from './LiveClockCard';
import { IndianCalendarCard } from './IndianCalendarCard';
import { WeatherCard } from './WeatherCard';
import { GoogleEventsCard } from './GoogleEventsCard';
import { HoroscopeModal } from './HoroscopeModal';
import { LocalEventReminder, WeatherPreferences } from '../../types/dashboard';
import { Sparkles, Compass } from 'lucide-react';

interface OverviewSectionProps {
  weatherPreferences: WeatherPreferences;
  reminders: LocalEventReminder[];
  isGoogleConfigured: boolean;
  onAddReminder: (reminder: Omit<LocalEventReminder, 'id'>) => void;
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onOpenSettings: () => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  weatherPreferences,
  reminders,
  isGoogleConfigured,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  onOpenSettings,
}) => {
  const [isHoroscopeOpen, setIsHoroscopeOpen] = useState(false);

  return (
    <section className="space-y-3" aria-label="System Overview and Metrics">
      {/* Sub-header with quick actions including the required Horoscope button */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
          <Compass className="w-4 h-4 animate-spin-slow text-emerald-400" />
          <span className="font-semibold tracking-wider uppercase">COMMAND TELEMETRY // OVERVIEW</span>
        </div>

        {/* Dedicated Horoscope Trigger Button */}
        <button
          onClick={() => setIsHoroscopeOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400 shadow-sm transition-all duration-150"
          title="Open daily zodiac / Rashi insights"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>राशीभविष्य / Horoscope</span>
        </button>
      </div>

      {/* Responsive Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <LiveClockCard />
        <IndianCalendarCard />
        <WeatherCard preferences={weatherPreferences} />
        <GoogleEventsCard
          reminders={reminders}
          isGoogleConfigured={isGoogleConfigured}
          onAddReminder={onAddReminder}
          onToggleReminder={onToggleReminder}
          onDeleteReminder={onDeleteReminder}
          onOpenSettings={onOpenSettings}
        />
      </div>

      {/* Isolated Horoscope Modal */}
      <HoroscopeModal
        isOpen={isHoroscopeOpen}
        onClose={() => setIsHoroscopeOpen(false)}
      />
    </section>
  );
};
