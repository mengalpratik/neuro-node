import { describe, it, expect, beforeEach } from 'vitest';
import {
  degreesToCompass,
  interpretWeatherCode,
  getCachedWeather,
  setCachedWeather,
} from '../services/weather/weatherService';
import { WeatherData } from '../types/weather';

describe('Weather Service Telemetry & Caching', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('converts degrees into standard compass directions', () => {
    expect(degreesToCompass(0)).toBe('N');
    expect(degreesToCompass(90)).toBe('E');
    expect(degreesToCompass(180)).toBe('S');
    expect(degreesToCompass(270)).toBe('W');
    expect(degreesToCompass(45)).toBe('NE');
    expect(degreesToCompass(225)).toBe('SW');
  });

  it('interprets WMO weather codes into descriptions and icons', () => {
    expect(interpretWeatherCode(0).description).toBe('Clear Sky');
    expect(interpretWeatherCode(0).icon).toBe('Sun');
    expect(interpretWeatherCode(3).description).toBe('Overcast');
    expect(interpretWeatherCode(61).icon).toBe('CloudRain');
    expect(interpretWeatherCode(95).icon).toBe('CloudLightning');
  });

  it('caches and retrieves weather data in localStorage', () => {
    expect(getCachedWeather()).toBeNull();

    const sampleWeather: WeatherData = {
      currentTemp: 26,
      minTemp: 21,
      maxTemp: 31,
      humidity: 62,
      rainProbability: 15,
      windSpeed: 12,
      windDirection: 90,
      windCompass: 'E',
      weatherCode: 1,
      weatherDescription: 'Mainly Clear',
      cityName: 'Pune Station',
      units: 'metric',
      lastUpdated: '10:00 AM',
      isCached: false,
    };

    setCachedWeather(sampleWeather);
    const retrieved = getCachedWeather();

    expect(retrieved).toBeDefined();
    expect(retrieved?.cityName).toBe('Pune Station');
    expect(retrieved?.currentTemp).toBe(26);
    expect(retrieved?.isCached).toBe(true);
  });
});
