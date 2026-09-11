import React, { useState, useEffect, useCallback } from 'react';
import { GlassCard } from '../common/GlassCard';
import { WeatherData, WeatherPreferences } from '../../types/weather';
import { fetchWeather, getCachedWeather } from '../../services/weather/weatherService';
import {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudLightning,
  CloudSnow,
  CloudDrizzle,
  CloudFog,
  Wind,
  Droplets,
  Umbrella,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface WeatherCardProps {
  preferences: WeatherPreferences;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ preferences }) => {
  const [weather, setWeather] = useState<WeatherData | null>(() => getCachedWeather());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchWeather(preferences);
      setWeather(data);
    } catch (err) {
      setError((err as Error).message || 'Unable to update weather');
    } finally {
      setIsLoading(false);
    }
  }, [preferences]);

  useEffect(() => {
    loadData();
    // Refresh every 30 minutes
    const interval = setInterval(loadData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Weather Icon resolution
  const renderWeatherIcon = (iconName: string) => {
    const props = { className: 'w-7 h-7 text-emerald-400' };
    switch (iconName) {
      case 'Sun':
        return <Sun {...props} className="w-7 h-7 text-amber-400 animate-spin-slow" />;
      case 'SunMedium':
      case 'CloudSun':
        return <CloudSun {...props} className="w-7 h-7 text-amber-300" />;
      case 'Cloud':
        return <Cloud {...props} className="w-7 h-7 text-slate-300" />;
      case 'CloudRain':
      case 'CloudRainWind':
        return <CloudRain {...props} className="w-7 h-7 text-cyan-400" />;
      case 'CloudDrizzle':
        return <CloudDrizzle {...props} className="w-7 h-7 text-cyan-300" />;
      case 'CloudLightning':
        return <CloudLightning {...props} className="w-7 h-7 text-amber-400 animate-bounce" />;
      case 'CloudSnow':
        return <CloudSnow {...props} className="w-7 h-7 text-blue-200" />;
      case 'CloudFog':
        return <CloudFog {...props} className="w-7 h-7 text-gray-400" />;
      default:
        return <CloudSun {...props} />;
    }
  };

  const tempSymbol = preferences.units === 'imperial' ? '°F' : '°C';
  const speedUnit = preferences.units === 'imperial' ? 'mph' : 'km/h';

  return (
    <GlassCard className="p-5 flex flex-col justify-between relative overflow-hidden">
      {/* Header with Truthful Telemetry */}
      <div className="flex items-center justify-between text-xs font-mono mb-2">
        <span className={`flex items-center gap-1.5 ${
          !weather && error 
            ? 'text-amber-400' 
            : weather?.isCached 
            ? 'text-cyan-400' 
            : 'text-emerald-400'
        }`}>
          <Wind className="w-3.5 h-3.5" />
          <span className="tracking-widest uppercase font-semibold">
            {!weather && error 
              ? 'METEOROLOGY // OFFLINE' 
              : weather?.isCached 
              ? 'METEOROLOGY // CACHED' 
              : 'METEOROLOGY // LIVE'}
          </span>
        </span>
        <div className="flex items-center gap-2">
          {weather?.isCached && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Offline Cache
            </span>
          )}
          <button
            onClick={loadData}
            disabled={isLoading}
            aria-label="Refresh weather data"
            className="text-gray-400 hover:text-emerald-300 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content or Error/Loading */}
      {weather ? (
        <>
          <div className="flex items-center justify-between my-1">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-bold text-white font-mono">
                  {weather.currentTemp}
                </span>
                <span className="text-emerald-400 text-lg font-semibold">{tempSymbol}</span>
              </div>
              <p className="text-xs font-medium text-emerald-300/90 mt-0.5">
                {weather.weatherDescription}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-500/20">
              {renderWeatherIcon(weather.weatherDescription)}
            </div>
          </div>

          {/* Meteorological Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-emerald-500/15 text-[11px] font-mono">
            {/* Range */}
            <div>
              <span className="text-gray-400 block text-[10px]">MIN / MAX</span>
              <span className="text-gray-200">
                {weather.minTemp}° / {weather.maxTemp}°
              </span>
            </div>

            {/* Humidity */}
            <div className="flex flex-col">
              <span className="text-gray-400 text-[10px] flex items-center gap-0.5">
                <Droplets className="w-2.5 h-2.5 text-cyan-400" /> HUMID
              </span>
              <span className="text-cyan-300 font-semibold">{weather.humidity}%</span>
            </div>

            {/* Rain Probability */}
            <div className="flex flex-col">
              <span className="text-gray-400 text-[10px] flex items-center gap-0.5">
                <Umbrella className="w-2.5 h-2.5 text-blue-400" /> PRECIP
              </span>
              <span className="text-blue-300 font-semibold">{weather.rainProbability}%</span>
            </div>
          </div>

          {/* Wind & Station footer */}
          <div className="pt-2 flex items-center justify-between text-xs font-mono text-gray-400">
            <span className="truncate max-w-[130px] text-gray-300">{weather.cityName}</span>
            <span className="flex items-center gap-1 text-emerald-300/80">
              <Wind className="w-3 h-3 text-emerald-400" />
              <span>
                {weather.windSpeed} {speedUnit} {weather.windCompass}
              </span>
            </span>
          </div>
        </>
      ) : error ? (
        <div className="my-auto py-3 space-y-2 text-center">
          <AlertCircle className="w-6 h-6 text-amber-400 mx-auto opacity-80" />
          <p className="text-xs text-gray-300 leading-relaxed">{error}</p>
          <button
            onClick={loadData}
            className="text-xs text-emerald-400 underline hover:text-emerald-300"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <div className="my-auto py-6 text-center text-xs text-gray-400">
          Fetching meteorological telemetry...
        </div>
      )}
    </GlassCard>
  );
};
