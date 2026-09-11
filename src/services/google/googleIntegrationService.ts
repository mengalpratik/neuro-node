import { LocalEventReminder } from '../../types/dashboard';

export interface GroupedEvents {
  today: LocalEventReminder[];
  tomorrow: LocalEventReminder[];
  upcoming: LocalEventReminder[];
}

/**
 * Organizes reminders and events into Today, Tomorrow, and Upcoming buckets.
 */
export function groupEventsByTimeline(reminders: LocalEventReminder[]): GroupedEvents {
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const today: LocalEventReminder[] = [];
  const tomorrowList: LocalEventReminder[] = [];
  const upcoming: LocalEventReminder[] = [];

  // Sort reminders chronologically
  const sorted = [...reminders].sort((a, b) => {
    const timeA = `${a.date} ${a.time || '00:00'}`;
    const timeB = `${b.date} ${b.time || '00:00'}`;
    return timeA.localeCompare(timeB);
  });

  for (const item of sorted) {
    if (item.date === todayStr) {
      today.push(item);
    } else if (item.date === tomorrowStr) {
      tomorrowList.push(item);
    } else if (item.date > tomorrowStr) {
      upcoming.push(item);
    }
  }

  return {
    today,
    tomorrow: tomorrowList,
    upcoming,
  };
}

/**
 * State & connection manager for optional Google Services integration.
 * Adheres strictly to security standards: zero hardcoded secrets or API tokens.
 */
export class GoogleIntegrationManager {
  public static isConfigured(clientId?: string): boolean {
    return Boolean(clientId && clientId.trim().length > 10);
  }

  public static getStatusDescription(clientId?: string): {
    status: 'unconfigured' | 'configured' | 'connected';
    message: string;
  } {
    if (!clientId || clientId.trim().length === 0) {
      return {
        status: 'unconfigured',
        message: 'Google Calendar integration is optional and currently unconfigured. Local reminders are active.',
      };
    }
    return {
      status: 'configured',
      message: 'OAuth Client ID configured. Ready to link with Google Calendar via Google Identity Services.',
    };
  }
}
