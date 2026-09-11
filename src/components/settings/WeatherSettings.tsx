import React, { useState } from 'react';
import { GeocodingResult, WeatherPreferences } from '../../types/weather';
import { searchCities } from '../../services/weather/geocoding';
import { MapPin, Search, Navigation, Check } from 'lucide-react';

interface WeatherSettingsProps {
  weather: WeatherPreferences;
  onUpdateWeather: (partial: Partial<WeatherPreferences>) => void;
}

export const WeatherSettings: React.FC<WeatherSettingsProps> = ({
  weather,
  onUpdateWeather,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setGeoMsg(null);
    try {
      const results = await searchCities(searchQuery);
      setSuggestions(results);
      if (results.length === 0) {
        setGeoMsg('No matching locations found.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCity = (res: GeocodingResult) => {
    onUpdateWeather({
      city: res.name + (res.country ? `, ${res.country}` : ''),
      lat: res.latitude,
      lon: res.longitude,
    });
    setSuggestions([]);
    setSearchQuery('');
    setGeoMsg(`Station set to ${res.name}.`);
  };

  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      setGeoMsg('Geolocation is not supported by your browser.');
      return;
    }
    setGeoMsg('Acquiring satellite coordinates...');
    navigator.geolocation.getCurrentPosition(
      pos => {
        onUpdateWeather({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          city: 'Auto GPS Station',
          autoDetect: true,
        });
        setGeoMsg('Coordinates acquired successfully!');
      },
      err => {
        setGeoMsg(`Location error: ${err.message}`);
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Current Station display */}
      <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/20 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono text-gray-400 block uppercase">
            Active Station
          </span>
          <span className="text-sm font-mono font-bold text-white flex items-center gap-1.5 mt-0.5">
            <MapPin className="w-4 h-4 text-emerald-400" />
            {weather.city || 'Coordinates Station'}
          </span>
          <span className="text-xs font-mono text-gray-500 block">
            {weather.lat.toFixed(4)}° N, {weather.lon.toFixed(4)}° E
          </span>
        </div>

        <button
          type="button"
          onClick={handleAutoDetect}
          className="px-3 py-1.5 text-xs font-mono rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Auto GPS</span>
        </button>
      </div>

      {/* City Search */}
      <div className="space-y-2">
        <label className="text-xs font-mono text-gray-300 block">
          Search City / Region (Worldwide Telemetry)
        </label>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="e.g. Pune, Mumbai, London, Tokyo, New York"
              className="w-full pl-8 pr-3 py-2 text-xs font-mono rounded-lg bg-black/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-3 py-2 text-xs font-mono rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold disabled:opacity-50 transition-colors"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {geoMsg && (
          <p className="text-xs text-emerald-400 font-mono mt-1">{geoMsg}</p>
        )}

        {/* Search Suggestions List */}
        {suggestions.length > 0 && (
          <div className="rounded-xl border border-emerald-500/30 bg-black/90 overflow-hidden divide-y divide-gray-800">
            {suggestions.map((res, i) => (
              <button
                key={i}
                onClick={() => handleSelectCity(res)}
                className="w-full text-left px-3 py-2 hover:bg-emerald-500/15 flex items-center justify-between transition-colors"
              >
                <div>
                  <span className="text-xs font-mono text-white font-medium block">
                    {res.name}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {[res.admin1, res.country].filter(Boolean).join(', ')}
                  </span>
                </div>
                <span className="text-xs text-emerald-400 font-mono">Select</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Units Selector */}
      <div className="pt-3 border-t border-gray-800">
        <label className="text-xs font-mono text-gray-300 block mb-2">
          Measurement Units
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onUpdateWeather({ units: 'metric' })}
            className={`p-2.5 rounded-xl text-left border flex items-center justify-between transition-all ${
              weather.units === 'metric'
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-semibold'
                : 'bg-black/30 hover:bg-black/50 border-gray-800 text-gray-400'
            }`}
          >
            <div>
              <span className="text-xs font-mono block">Metric</span>
              <span className="text-[10px] text-gray-500">Celsius (°C), km/h</span>
            </div>
            {weather.units === 'metric' && <Check className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={() => onUpdateWeather({ units: 'imperial' })}
            className={`p-2.5 rounded-xl text-left border flex items-center justify-between transition-all ${
              weather.units === 'imperial'
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-semibold'
                : 'bg-black/30 hover:bg-black/50 border-gray-800 text-gray-400'
            }`}
          >
            <div>
              <span className="text-xs font-mono block">Imperial</span>
              <span className="text-[10px] text-gray-500">Fahrenheit (°F), mph</span>
            </div>
            {weather.units === 'imperial' && <Check className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>
    </div>
  );
};
