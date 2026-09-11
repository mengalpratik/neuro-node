export interface IndianCalendarInfo {
  gregorianDate: string; // e.g. "8 September 2026"
  dayOfWeek: string; // e.g. "Tuesday"
  marathiMonth: string; // e.g. "भाद्रपद" (Bhadrapada)
  marathiMonthEnglish: string; // e.g. "Bhadrapada"
  shakaYear: number; // e.g. 1948
  paksha: 'Shukla' | 'Krishna';
  tithiApprox: string; // e.g. "Dwadashi"
  moonPhaseName: string; // e.g. "Waning Crescent", "Full Moon", "New Moon"
  moonIlluminationPercent: number; // 0 to 100
  isAmavasya: boolean;
  isPurnima: boolean;
  festivalToday: string | null;
  upcomingFestivals: {
    name: string;
    marathiName: string;
    date: string;
    daysLeft: number;
    description: string;
  }[];
}
