import React, { useState } from 'react';
import { GlassCard } from '../common/GlassCard';
import { LocalEventReminder } from '../../types/dashboard';
import { groupEventsByTimeline } from '../../services/google/googleIntegrationService';
import { CalendarCheck, Plus, CheckSquare, Square, Trash2, CalendarDays } from 'lucide-react';
import { Modal } from '../common/Modal';

interface GoogleEventsCardProps {
  reminders: LocalEventReminder[];
  isGoogleConfigured: boolean;
  onAddReminder: (reminder: Omit<LocalEventReminder, 'id'>) => void;
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onOpenSettings: () => void;
}

export const GoogleEventsCard: React.FC<GoogleEventsCardProps> = ({
  reminders,
  isGoogleConfigured,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  onOpenSettings,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('12:00');
  const [newCategory, setNewCategory] = useState<'event' | 'reminder' | 'task'>('task');

  const grouped = groupEventsByTimeline(reminders);
  const totalItems = reminders.length;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddReminder({
      title: newTitle.trim(),
      date: newDate,
      time: newTime || undefined,
      category: newCategory,
      completed: false,
    });
    setNewTitle('');
    setIsAddModalOpen(false);
  };

  return (
    <>
      <GlassCard className="p-5 flex flex-col justify-between relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between text-xs text-gray-400 font-mono mb-2">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CalendarCheck className="w-3.5 h-3.5" />
            <span className="tracking-widest uppercase font-semibold">SCHEDULE // EVENTS</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSettings}
              className={`text-[10px] px-2 py-0.5 rounded font-mono border transition-colors ${
                isGoogleConfigured
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-black/50 text-gray-400 border-gray-700 hover:text-emerald-300'
              }`}
              title={isGoogleConfigured ? 'Google Calendar Sync Active' : 'Local Mode // No Google Calendar connected'}
            >
              {isGoogleConfigured ? 'Google Sync' : 'Local Mode'}
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              aria-label="Add event or reminder"
              className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Timeline Event Lists */}
        <div className="my-1 space-y-2 max-h-[145px] overflow-y-auto pr-1">
          {totalItems === 0 ? (
            <div className="py-6 text-center text-xs text-gray-400">
              <CalendarDays className="w-6 h-6 text-gray-600 mx-auto mb-1.5" />
              <span className="block text-gray-400">No planned events or reminders.</span>
              <span className="text-[11px] text-gray-500 block mt-0.5">Click Quick entry to record local tasks.</span>
            </div>
          ) : (
            <>
              {/* TODAY */}
              {grouped.today.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block mb-1">
                    TODAY
                  </span>
                  <div className="space-y-1">
                    {grouped.today.map(item => (
                      <div
                        key={item.id}
                        className="group flex items-center justify-between p-1.5 rounded bg-black/30 hover:bg-black/50 border border-emerald-500/10 text-xs transition-colors"
                      >
                        <button
                          onClick={() => onToggleReminder(item.id)}
                          className="flex items-center gap-2 text-left truncate flex-1"
                        >
                          {item.completed ? (
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-gray-500 shrink-0 hover:text-emerald-400" />
                          )}
                          <span
                            className={`truncate ${
                              item.completed ? 'line-through text-gray-500' : 'text-gray-200'
                            }`}
                          >
                            {item.title}
                          </span>
                        </button>
                        <div className="flex items-center gap-1.5 shrink-0 pl-2">
                          {item.time && (
                            <span className="text-[10px] font-mono text-gray-400">
                              {item.time}
                            </span>
                          )}
                          <button
                            onClick={() => onDeleteReminder(item.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity p-0.5"
                            aria-label="Delete item"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TOMORROW */}
              {grouped.tomorrow.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block mb-1">
                    TOMORROW
                  </span>
                  <div className="space-y-1">
                    {grouped.tomorrow.map(item => (
                      <div
                        key={item.id}
                        className="group flex items-center justify-between p-1.5 rounded bg-black/30 hover:bg-black/50 border border-emerald-500/10 text-xs transition-colors"
                      >
                        <button
                          onClick={() => onToggleReminder(item.id)}
                          className="flex items-center gap-2 text-left truncate flex-1"
                        >
                          {item.completed ? (
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-gray-500 shrink-0 hover:text-cyan-400" />
                          )}
                          <span
                            className={`truncate ${
                              item.completed ? 'line-through text-gray-500' : 'text-gray-200'
                            }`}
                          >
                            {item.title}
                          </span>
                        </button>
                        <div className="flex items-center gap-1.5 shrink-0 pl-2">
                          {item.time && (
                            <span className="text-[10px] font-mono text-gray-400">
                              {item.time}
                            </span>
                          )}
                          <button
                            onClick={() => onDeleteReminder(item.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity p-0.5"
                            aria-label="Delete item"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* UPCOMING */}
              {grouped.upcoming.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold block mb-1">
                    UPCOMING
                  </span>
                  <div className="space-y-1">
                    {grouped.upcoming.map(item => (
                      <div
                        key={item.id}
                        className="group flex items-center justify-between p-1.5 rounded bg-black/30 hover:bg-black/50 border border-emerald-500/10 text-xs transition-colors"
                      >
                        <button
                          onClick={() => onToggleReminder(item.id)}
                          className="flex items-center gap-2 text-left truncate flex-1"
                        >
                          {item.completed ? (
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          )}
                          <span
                            className={`truncate ${
                              item.completed ? 'line-through text-gray-500' : 'text-gray-200'
                            }`}
                          >
                            {item.title}
                          </span>
                        </button>
                        <div className="flex items-center gap-1.5 shrink-0 pl-2">
                          <span className="text-[10px] font-mono text-gray-500">
                            {item.date.slice(5)}
                          </span>
                          <button
                            onClick={() => onDeleteReminder(item.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity p-0.5"
                            aria-label="Delete item"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-emerald-500/15 flex items-center justify-between text-[11px] font-mono text-gray-400">
          <span>{totalItems} active entries</span>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="text-emerald-400 hover:underline flex items-center gap-1"
          >
            + Quick entry
          </button>
        </div>
      </GlassCard>

      {/* Add Reminder Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Schedule New Event / Reminder"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-gray-300 mb-1">
              Title / Description
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. Server maintenance, Doctor appointment"
              autoFocus
              required
              className="w-full px-3 py-2 rounded-lg bg-black/60 border border-emerald-500/30 text-emerald-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">Date</label>
              <input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-black/60 border border-emerald-500/30 text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">Time (Optional)</label>
              <input
                type="time"
                value={newTime}
                onChange={e => setNewTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/60 border border-emerald-500/30 text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-1">Category</label>
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-black/60 border border-emerald-500/30 text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
            >
              <option value="task">Task</option>
              <option value="event">Event</option>
              <option value="reminder">Reminder</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-emerald-500/20">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black transition-colors"
            >
              Save Entry
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};
