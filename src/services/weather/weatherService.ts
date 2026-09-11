import { WeatherData, WeatherPreferences } from '../../types/weather';

const WEATHER_CACHE_KEY = 'PERSONAL_DASHBOARD_WEATHER_CACHE';

/**
 * Maps WMO weather codes to human-readable descriptions and icon identifiers.
 */
export function interpretWeatherCode(code: number): { description: string; icon: string } {
  switch (code) {
    case 0:
      return { description: 'Clear Sky', icon: 'Sun' };
    case 1:
      return { description: 'Mainly Clear', icon: 'SunMedium' };
    case 2:
      return { description: 'Partly Cloudy', icon: 'CloudSun' };
    case 3:
      return { description: 'Overcast', icon: 'Cloud' };
    case 45:
    case 48:
      return { description: 'Fog / Mist', icon: 'CloudFog' };
    case 51:
    case 53:
    case 55:
      return { description: 'Drizzle', icon: 'CloudDrizzle' };
    case 61:
    case 63:
    case 65:
      return { description: 'Rain', icon: 'CloudRain' };
    case 71:
    case 73:
    case 75:
      return { description: 'Snow Fall', icon: 'CloudSnow' };
    case 80:
    case 81:
    case 82:
      return { description: 'Rain Showers', icon: 'CloudRainWind' };
    case 95:
    case 96:
    case 99:
      return { description: 'Thunderstorm', icon: 'CloudLightning' };
    default:
      return { description: 'Variable Atmosphere', icon: 'Cloud' };
  }
}

/**
 * Converts wind degrees into standard 16-point compass directions.
 */
export function degreesToCompass(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((degrees % 360) / 22.5) % 16;
  return directions[index];
}

/**
 * Retrieves cached weather from localStorage if available.
 */
export function getCachedWeather(): WeatherData | null {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { ...parsed, isCached: true };
  } catch {
    return null;
  }
}

/**
 * Saves successful weather response to cache.
 */
export function setCachedWeather(data: WeatherData): void {
  try {
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('[Weather] Failed to write cache:', err);
  }
}

/**
 * Fetches real weather data from Open-Meteo API with offline caching & fallback.
 */
export async function fetchWeather(prefs: WeatherPreferences): Promise<WeatherData> {
  const { lat, lon, city, units } = prefs;
  const tempUnit = units === 'imperial' ? 'fahrenheit' : 'celsius';
  const windUnit = units === 'imperial' ? 'mph' : 'kmh';

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&timezone=auto`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Weather API returned status ${res.status}`);
    }

    const json = await res.json();
    const current = json.current || {};
    const daily = json.daily || {};

    const code = Number(current.weather_code ?? 0);
    const { description } = interpretWeatherCode(code);
    const windDir = Number(current.wind_direction_10m ?? 0);

    const weatherData: WeatherData = {
      currentTemp: Math.round(Number(current.temperature_2m ?? 24)),
      minTemp: Math.round(Number(daily.temperature_2m_min?.[0] ?? (current.temperature_2m - 5))),
      maxTemp: Math.round(Number(daily.temperature_2m_max?.[0] ?? (current.temperature_2m + 5))),
      humidity: Math.round(Number(current.relative_humidity_2m ?? 50)),
      rainProbability: Math.round(Number(daily.precipitation_probability_max?.[0] ?? 0)),
      windSpeed: Math.round(Number(current.wind_speed_10m ?? 0)),
      windDirection: windDir,
      windCompass: degreesToCompass(windDir),
      weatherCode: code,
      weatherDescription: description,
      cityName: city || 'Local Station',
      units,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isCached: false,
    };

    setCachedWeather(weatherData);
    return weatherData;
  } catch (err) {
    console.warn('[Weather] Network request failed. Checking cache...', err);
    const cached = getCachedWeather();
    if (cached) {
      return cached;
    }
    throw new Error('Weather data currently unavailable. Check your network connection or station settings.');
  }
}
