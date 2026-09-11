import { describe, it, expect } from 'vitest';
import { getHoroscopeDetails } from '../services/horoscope/horoscopeService';

describe('Horoscope & Zodiac Data Provider', () => {
  it('provides complete data for all 12 zodiac signs', () => {
    const allSigns = getHoroscopeDetails();
    expect(allSigns.length).toBe(12);

    for (const sign of allSigns) {
      expect(sign.id).toBeDefined();
      expect(sign.name).toBeDefined();
      expect(sign.rashiMarathi).toBeDefined();
      expect(sign.symbol).toBeDefined();
      expect(sign.prediction).toBeDefined();
      expect(sign.prediction.length).toBeGreaterThan(10);
      expect(sign.luckyNumber).toBeGreaterThan(0);
      expect(sign.luckyColor).toBeDefined();
      expect(['Fire', 'Earth', 'Air', 'Water']).toContain(sign.element);
    }
  });

  it('filters details by specific sign id', () => {
    const ariesOnly = getHoroscopeDetails('aries');
    expect(ariesOnly.length).toBe(1);
    expect(ariesOnly[0].name).toBe('Aries');
    expect(ariesOnly[0].rashiMarathi).toBe('मेष');
  });
});
