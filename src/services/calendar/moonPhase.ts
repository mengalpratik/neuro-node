/**
 * Astronomical Moon Phase & Tithi calculation engine.
 * Pure mathematical calculation without requiring third-party libraries or internet connectivity.
 */

// Known reference New Moon: 2000-01-06 18:14 UTC
const KNOWN_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0);
const LUNAR_MONTH_DAYS = 29.53058867;
const LUNAR_MONTH_MS = LUNAR_MONTH_DAYS * 86400000;

export interface MoonCalculation {
  ageDays: number;
  illuminationPercent: number;
  phaseName: string;
  isAmavasya: boolean;
  isPurnima: boolean;
  paksha: 'Shukla' | 'Krishna';
  tithiNumber: number; // 1 to 15
  tithiName: string;
}

const TITHI_NAMES = [
  'Pratipada (प्रतिपदा)',
  'Dwitiya (द्वितीया)',
  'Tritiya (तृतीया)',
  'Chaturthi (चतुर्थी)',
  'Panchami (पंचमी)',
  'Shashthi (षष्ठी)',
  'Saptami (सप्तमी)',
  'Ashtami (अष्टमी)',
  'Navami (नवमी)',
  'Dashami (दशमी)',
  'Ekadashi (एकादशी)',
  'Dwadashi (द्वादशी)',
  'Trayodashi (त्रयोदशी)',
  'Chaturdashi (चतुर्दशी)',
  'Purnima / Amavasya',
];

export function calculateMoonPhase(date: Date = new Date()): MoonCalculation {
  const timeMs = date.getTime();
  const diffMs = timeMs - KNOWN_NEW_MOON_MS;
  const cycles = diffMs / LUNAR_MONTH_MS;
  const currentCycleFraction = cycles - Math.floor(cycles);
  const ageDays = currentCycleFraction * LUNAR_MONTH_DAYS;

  // Illumination calculation based on angle
  const angle = currentCycleFraction * 2 * Math.PI;
  const illuminationPercent = Math.round(((1 - Math.cos(angle)) / 2) * 100);

  // Amavasya is New Moon (age close to 0 or 29.53)
  // Purnima is Full Moon (age close to 14.76)
  const isAmavasya = ageDays <= 1.0 || ageDays >= 28.53;
  const isPurnima = ageDays >= 13.76 && ageDays <= 15.76;

  let phaseName = 'New Moon (अमावास्या)';
  if (isAmavasya) {
    phaseName = 'New Moon / Amavasya (अमावास्या)';
  } else if (isPurnima) {
    phaseName = 'Full Moon / Purnima (पौर्णिमा)';
  } else if (ageDays < 6.8) {
    phaseName = 'Waxing Crescent (शुक्ल प्रतिपदा - षष्ठी)';
  } else if (ageDays < 8.2) {
    phaseName = 'First Quarter (शुक्ल अष्टमी)';
  } else if (ageDays < 13.76) {
    phaseName = 'Waxing Gibbous (शुक्ल नवमी - चतुर्दशी)';
  } else if (ageDays < 21.5) {
    phaseName = 'Waning Gibbous (कृष्ण प्रतिपदा - षष्ठी)';
  } else if (ageDays < 23.0) {
    phaseName = 'Third Quarter (कृष्ण अष्टमी)';
  } else {
    phaseName = 'Waning Crescent (कृष्ण नवमी - चतुर्दशी)';
  }

  // Paksha: Shukla (Waxing) is 0 to ~14.76 days, Krishna (Waning) is ~14.76 to 29.53 days
  const paksha: 'Shukla' | 'Krishna' = ageDays < 14.765 ? 'Shukla' : 'Krishna';

  // Tithi calculation (each tithi is approx 12 degrees or 0.984 days)
  const tithiIndex = Math.min(14, Math.floor((ageDays % (LUNAR_MONTH_DAYS / 2)) / (LUNAR_MONTH_DAYS / 30)));
  const tithiNumber = tithiIndex + 1;
  let tithiName = TITHI_NAMES[tithiIndex] || 'Pratipada';
  if (tithiNumber === 15) {
    tithiName = paksha === 'Shukla' ? 'Purnima (पौर्णिमा)' : 'Amavasya (अमावास्या)';
  }

  return {
    ageDays: Math.round(ageDays * 10) / 10,
    illuminationPercent,
    phaseName,
    isAmavasya,
    isPurnima,
    paksha,
    tithiNumber,
    tithiName,
  };
}
