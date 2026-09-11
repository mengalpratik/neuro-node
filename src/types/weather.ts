export type { WeatherPreferences } from './dashboard';

export interface WeatherData {
  currentTemp: number;
  minTemp: number;
  maxTemp: number;
  humidity: number;
  rainProbability: number;
  windSpeed: number;
  windDirection: number;
  windCompass: string;
  weatherCode: number;
  weatherDescription: string;
  cityName: string;
  units: 'metric' | 'imperial';
  lastUpdated: string;
  isCached: boolean;
}

export interface WeatherState {
  data: WeatherData | null;
  isLoading: boolean;
  error: string | null;
}

export interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}
