import { describe, it, expect } from 'vitest';
import { getIndianCalendarInfo } from '../services/calendar/indianCalendarService';
import { calculateMoonPhase } from '../services/calendar/moonPhase';

describe('Indian Calendar & Astronomical Moon Phase Engine', () => {
  it('calculates Shalivahana Shaka year accurately', () => {
    // September 2026 is Shaka 1948
    const sep2026 = new Date(2026, 8, 8);
    const info = getIndianCalendarInfo(sep2026);
    expect(info.shakaYear).toBe(1948);

    // January 2026 (before Gudi Padwa) is Shaka 1947
    const jan2026 = new Date(2026, 0, 15);
    const janInfo = getIndianCalendarInfo(jan2026);
    expect(janInfo.shakaYear).toBe(1947);
  });

  it('determines Marathi months correctly', () => {
    // September corresponds to Bhadrapada / Ashwin
    const sepDate = new Date(2026, 8, 8);
    const sepInfo = getIndianCalendarInfo(sepDate);
    expect(sepInfo.marathiMonthEnglish).toBe('Bhadrapada');
    expect(sepInfo.marathiMonth).toBe('भाद्रपद');
  });

  it('calculates moon illumination and valid paksha', () => {
    const moon = calculateMoonPhase(new Date(2026, 8, 8));
    expect(moon.illuminationPercent).toBeGreaterThanOrEqual(0);
    expect(moon.illuminationPercent).toBeLessThanOrEqual(100);
    expect(['Shukla', 'Krishna']).toContain(moon.paksha);
    expect(typeof moon.isAmavasya).toBe('boolean');
    expect(typeof moon.isPurnima).toBe('boolean');
    expect(moon.tithiName).toBeDefined();
  });

  it('accurately matches known festivals when date arrives', () => {
    // Makar Sankranti 2026: 2026-01-14
    const sankrantiDate = new Date('2026-01-14T10:00:00Z');
    const sankrantiInfo = getIndianCalendarInfo(sankrantiDate);
    expect(sankrantiInfo.festivalToday).toContain('Makar Sankranti');
  });
});
