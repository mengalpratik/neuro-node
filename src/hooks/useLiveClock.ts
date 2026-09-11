import { useState, useEffect } from 'react';

export interface LiveClockData {
  time12: string; // HH:MM:SS AM/PM
  time24: string; // HH:MM:SS
  hours12: string;
  minutes: string;
  seconds: string;
  ampm: 'AM' | 'PM';
  dateFormatted: string;
  dayOfWeek: string;
  timezone: string;
}

export function formatTime12(date: Date): {
  time12: string;
  time24: string;
  hours12: string;
  minutes: string;
  seconds: string;
  ampm: 'AM' | 'PM';
} {
  const h24 = date.getHours();
  const m = date.getMinutes();
  const s = date.getSeconds();

  const ampm: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
  const h12Num = h24 % 12 || 12;
  const hours12 = h12Num.toString().padStart(2, '0');
  const minutes = m.toString().padStart(2, '0');
  const seconds = s.toString().padStart(2, '0');

  const time12 = `${hours12}:${minutes}:${seconds} ${ampm}`;
  const time24 = `${h24.toString().padStart(2, '0')}:${minutes}:${seconds}`;

  return { time12, time24, hours12, minutes, seconds, ampm };
}

export function useLiveClock(): LiveClockData {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    // Sync precisely to the start of the next second
    const update = () => setNow(new Date());
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const { time12, time24, hours12, minutes, seconds, ampm } = formatTime12(now);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const dayOfWeek = days[now.getDay()];
  const dateFormatted = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';

  return {
    time12,
    time24,
    hours12,
    minutes,
    seconds,
    ampm,
    dateFormatted,
    dayOfWeek,
    timezone,
  };
}
