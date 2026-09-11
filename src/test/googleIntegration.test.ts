import { describe, it, expect } from 'vitest';
import {
  groupEventsByTimeline,
  GoogleIntegrationManager,
} from '../services/google/googleIntegrationService';
import { LocalEventReminder } from '../types/dashboard';

describe('Google Calendar & Reminders Integration', () => {
  it('correctly organizes reminders into Today, Tomorrow, and Upcoming', () => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const future = new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0];

    const reminders: LocalEventReminder[] = [
      { id: '1', title: 'Task Today', date: today, category: 'task' },
      { id: '2', title: 'Event Tomorrow', date: tomorrow, category: 'event' },
      { id: '3', title: 'Future Milestone', date: future, category: 'reminder' },
    ];

    const grouped = groupEventsByTimeline(reminders);
    expect(grouped.today.length).toBe(1);
    expect(grouped.today[0].title).toBe('Task Today');

    expect(grouped.tomorrow.length).toBe(1);
    expect(grouped.tomorrow[0].title).toBe('Event Tomorrow');

    expect(grouped.upcoming.length).toBe(1);
    expect(grouped.upcoming[0].title).toBe('Future Milestone');
  });

  it('reports unconfigured status when no OAuth client id is present', () => {
    expect(GoogleIntegrationManager.isConfigured('')).toBe(false);
    expect(GoogleIntegrationManager.isConfigured(undefined)).toBe(false);

    const desc = GoogleIntegrationManager.getStatusDescription('');
    expect(desc.status).toBe('unconfigured');
    expect(desc.message).toContain('Local reminders are active');

    const configured = GoogleIntegrationManager.getStatusDescription('123456789-test.apps.googleusercontent.com');
    expect(configured.status).toBe('configured');
  });
});
