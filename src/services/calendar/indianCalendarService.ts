import { IndianCalendarInfo } from '../../types/calendar';
import { calculateMoonPhase } from './moonPhase';

export interface IndianFestival {
  name: string;
  marathiName: string;
  date: string; // YYYY-MM-DD
  description: string;
}

// Major Indian & Maharashtra festivals for 2025, 2026, and 2027
const FESTIVAL_DATABASE: IndianFestival[] = [
  // 2025
  { name: 'Makar Sankranti', marathiName: 'मकर संक्रांती', date: '2025-01-14', description: 'Sun enters Capricorn (Makara), harvest festival' },
  { name: 'Maha Shivratri', marathiName: 'महाशिवरात्री', date: '2025-02-26', description: 'Honoring Lord Shiva, night of cosmic dance' },
  { name: 'Holi', marathiName: 'होळी / धुलिवंदन', date: '2025-03-14', description: 'Festival of colors and spring harvest' },
  { name: 'Gudi Padwa', marathiName: 'गुढीपाडवा', date: '2025-03-30', description: 'Marathi New Year, start of Chaitra Navratri' },
  { name: 'Ram Navami', marathiName: 'राम नवमी', date: '2025-04-06', description: 'Birth of Lord Rama' },
  { name: 'Ashadhi Ekadashi', marathiName: 'आषाढी एकादशी', date: '2025-07-06', description: 'Pandharpur Wari culmination, Pandurang worship' },
  { name: 'Nag Panchami', marathiName: 'नागपंचमी', date: '2025-07-30', description: 'Worship of serpent deities in Shravan' },
  { name: 'Raksha Bandhan', marathiName: 'रक्षाबंधन / नारळी पौर्णिमा', date: '2025-08-09', description: 'Sibling bond celebration and coconut offering to the sea' },
  { name: 'Ganesh Chaturthi', marathiName: 'गणेशोत्सव / गणेश चतुर्थी', date: '2025-08-27', description: 'Arrival of Lord Ganesha, 10-day state festival' },
  { name: 'Anant Chaturdashi', marathiName: 'अनंत चतुर्दशी', date: '2025-09-06', description: 'Ganesh Visarjan day' },
  { name: 'Dussehra / Vijayadashami', marathiName: 'दसरा / विजयादशमी', date: '2025-10-02', description: 'Triumph of good over evil, Shami tree worship' },
  { name: 'Diwali / Laxmi Pujan', marathiName: 'दिवाळी / लक्ष्मीपूजन', date: '2025-10-20', description: 'Festival of lights, prosperity and joy' },
  { name: 'Bhaubeej', marathiName: 'भाऊबीज', date: '2025-10-23', description: 'Celebration of brother-sister bond' },

  // 2026
  { name: 'Makar Sankranti', marathiName: 'मकर संक्रांती', date: '2026-01-14', description: 'Sun enters Capricorn, distribution of Tilgul' },
  { name: 'Maha Shivratri', marathiName: 'महाशिवरात्री', date: '2026-02-15', description: 'Veneration of Lord Shiva' },
  { name: 'Holi', marathiName: 'होळी / धुलिवंदन', date: '2026-03-03', description: 'Holika Dahan and colors' },
  { name: 'Gudi Padwa', marathiName: 'गुढीपाडवा', date: '2026-03-19', description: 'Shalivahana Shaka New Year 1948 begins' },
  { name: 'Ram Navami', marathiName: 'राम नवमी', date: '2026-03-27', description: 'Celebration of Lord Rama birth' },
  { name: 'Ashadhi Ekadashi', marathiName: 'आषाढी एकादशी', date: '2026-07-25', description: 'Mahavishnu starts Yoga Nidra, Pandharpur Yatra' },
  { name: 'Nag Panchami', marathiName: 'नागपंचमी', date: '2026-08-18', description: 'Shravan month reverence for nature' },
  { name: 'Raksha Bandhan', marathiName: 'रक्षाबंधन / नारळी पौर्णिमा', date: '2026-08-28', description: 'Celebration of brother-sister bond' },
  { name: 'Ganesh Chaturthi', marathiName: 'गणेशोत्सव / गणेश चतुर्थी', date: '2026-09-14', description: 'Lord Ganesha arrival, Maharashtra grand festival' },
  { name: 'Anant Chaturdashi', marathiName: 'अनंत चतुर्दशी', date: '2026-09-24', description: 'Immersion of Ganesha idols' },
  { name: 'Navratri Begins', marathiName: 'घटस्थापना / नवरात्र', date: '2026-10-11', description: 'Nine nights of Goddess Durga' },
  { name: 'Dussehra / Vijayadashami', marathiName: 'दसरा / विजयादशमी', date: '2026-10-20', description: 'Simolanghan and blessing exchanges with Apta leaves' },
  { name: 'Diwali / Laxmi Pujan', marathiName: 'दिवाळी / लक्ष्मीपूजन', date: '2026-11-08', description: 'Festival of lights and wealth' },
  { name: 'Bhaubeej', marathiName: 'भाऊबीज', date: '2026-11-11', description: 'Diwali sibling celebration' },
  { name: 'Tulsi Vivah', marathiName: 'तुळशी विवाह', date: '2026-11-21', description: 'Ceremonial marriage of Tulsi to Vishnu' },

  // 2027
  { name: 'Makar Sankranti', marathiName: 'मकर संक्रांती', date: '2027-01-14', description: 'Sun enters Makara, Kite flying & Tilgul' },
  { name: 'Maha Shivratri', marathiName: 'महाशिवरात्री', date: '2027-03-06', description: 'Holy night of Lord Shiva' },
  { name: 'Holi', marathiName: 'होळी / धुळवड', date: '2027-03-22', description: 'Festival of spring colors' },
  { name: 'Gudi Padwa', marathiName: 'गुढीपाडवा', date: '2027-04-07', description: 'Shalivahana Shaka New Year 1949 begins' },
  { name: 'Ganesh Chaturthi', marathiName: 'गणेश चतुर्थी', date: '2027-09-04', description: 'Lord Ganesha celebration' },
  { name: 'Diwali / Laxmi Pujan', marathiName: 'दिवाळी / लक्ष्मीपूजन', date: '2027-10-29', description: 'Grand festival of lamps' },
];

interface MarathiMonthBoundary {
  name: string;
  translit: string;
  startMonthDay: number; // (month * 100) + day
}

// Ordered chronologically from Jan 1 (001) to Dec 31 (1131)
const GREGORIAN_MARATHI_BOUNDARIES: MarathiMonthBoundary[] = [
  { name: 'पौष', translit: 'Pausha', startMonthDay: 0 }, // Jan 1 - Jan 20
  { name: 'माघ', translit: 'Magha', startMonthDay: 21 }, // Jan 21
  { name: 'फाल्गुन', translit: 'Phalguna', startMonthDay: 120 }, // Feb 20 (1 * 100 + 20)
  { name: 'चैत्र', translit: 'Chaitra', startMonthDay: 222 }, // Mar 22 (2 * 100 + 22)
  { name: 'वैशाख', translit: 'Vaishakha', startMonthDay: 321 }, // Apr 21 (3 * 100 + 21)
  { name: 'ज्येष्ठ', translit: 'Jyeshtha', startMonthDay: 422 }, // May 22 (4 * 100 + 22)
  { name: 'आषाढ', translit: 'Ashadha', startMonthDay: 522 }, // Jun 22 (5 * 100 + 22)
  { name: 'श्रावण', translit: 'Shravana', startMonthDay: 623 }, // Jul 23 (6 * 100 + 23)
  { name: 'भाद्रपद', translit: 'Bhadrapada', startMonthDay: 723 }, // Aug 23 (7 * 100 + 23)
  { name: 'अश्विन', translit: 'Ashwin', startMonthDay: 823 }, // Sep 23 (8 * 100 + 23)
  { name: 'कार्तिक', translit: 'Kartika', startMonthDay: 923 }, // Oct 23 (9 * 100 + 23)
  { name: 'मार्गशीर्ष', translit: 'Margashirsha', startMonthDay: 1022 }, // Nov 22 (10 * 100 + 22)
  { name: 'पौष', translit: 'Pausha', startMonthDay: 1122 }, // Dec 22 (11 * 100 + 22)
];

export function getIndianCalendarInfo(date: Date = new Date()): IndianCalendarInfo {
  const moon = calculateMoonPhase(date);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Shaka Era Year calculation
  // Shaka year starts around mid-March (Gudi Padwa, approx March 22)
  let shakaYear = year - 78;
  if (month < 2 || (month === 2 && day < 22)) {
    shakaYear = year - 79;
  }

  // Determine current Marathi Month using chronological boundary lookup
  const currentKey = month * 100 + day;
  let marathiMonthObj = GREGORIAN_MARATHI_BOUNDARIES[0];
  for (let i = GREGORIAN_MARATHI_BOUNDARIES.length - 1; i >= 0; i--) {
    if (currentKey >= GREGORIAN_MARATHI_BOUNDARIES[i].startMonthDay) {
      marathiMonthObj = GREGORIAN_MARATHI_BOUNDARIES[i];
      break;
    }
  }

  // Check for festival today
  const dateStr = date.toISOString().split('T')[0];
  const festivalMatch = FESTIVAL_DATABASE.find(f => f.date === dateStr);
  const festivalToday = festivalMatch 
    ? `${festivalMatch.name} (${festivalMatch.marathiName})` 
    : null;

  // Upcoming festivals
  const todayTime = new Date(year, month, day).getTime();
  const upcomingFestivals = FESTIVAL_DATABASE
    .map(f => {
      const fDate = new Date(f.date);
      const diffDays = Math.round((fDate.getTime() - todayTime) / 86400000);
      return {
        ...f,
        daysLeft: diffDays,
      };
    })
    .filter(f => f.daysLeft >= 0 && f.daysLeft <= 60)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 3);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return {
    gregorianDate: `${day} ${months[month]} ${year}`,
    dayOfWeek: daysOfWeek[date.getDay()],
    marathiMonth: marathiMonthObj.name,
    marathiMonthEnglish: marathiMonthObj.translit,
    shakaYear,
    paksha: moon.paksha,
    tithiApprox: moon.tithiName,
    moonPhaseName: moon.phaseName,
    moonIlluminationPercent: moon.illuminationPercent,
    isAmavasya: moon.isAmavasya,
    isPurnima: moon.isPurnima,
    festivalToday,
    upcomingFestivals,
  };
}
