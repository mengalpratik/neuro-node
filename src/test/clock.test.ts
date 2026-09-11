import { describe, it, expect } from 'vitest';
import { formatTime12 } from '../hooks/useLiveClock';

describe('Live Clock Formatting', () => {
  it('formats midnight correctly in 12-hour format as 12:MM:SS AM', () => {
    const midnight = new Date(2026, 8, 8, 0, 5, 9);
    const formatted = formatTime12(midnight);

    expect(formatted.hours12).toBe('12');
    expect(formatted.minutes).toBe('05');
    expect(formatted.seconds).toBe('09');
    expect(formatted.ampm).toBe('AM');
    expect(formatted.time12).toBe('12:05:09 AM');
  });

  it('formats noon correctly in 12-hour format as 12:MM:SS PM', () => {
    const noon = new Date(2026, 8, 8, 12, 0, 0);
    const formatted = formatTime12(noon);

    expect(formatted.hours12).toBe('12');
    expect(formatted.minutes).toBe('00');
    expect(formatted.seconds).toBe('00');
    expect(formatted.ampm).toBe('PM');
    expect(formatted.time12).toBe('12:00:00 PM');
  });

  it('formats evening time correctly in 12-hour format', () => {
    const evening = new Date(2026, 8, 8, 19, 45, 30);
    const formatted = formatTime12(evening);

    expect(formatted.hours12).toBe('07');
    expect(formatted.minutes).toBe('45');
    expect(formatted.seconds).toBe('30');
    expect(formatted.ampm).toBe('PM');
    expect(formatted.time12).toBe('07:45:30 PM');
    expect(formatted.time24).toBe('19:45:30');
  });
});
