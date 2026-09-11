import { GeocodingResult } from '../../types/weather';

/**
 * Searches for geographical coordinates of a city using Open-Meteo's free Geocoding API.
 * Requires zero API keys.
 */
export async function searchCities(query: string): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=5&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Geocoding HTTP ${res.status}`);
    }
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((item: Record<string, unknown>) => ({
      name: String(item.name || ''),
      latitude: Number(item.latitude || 0),
      longitude: Number(item.longitude || 0),
      country: item.country ? String(item.country) : undefined,
      admin1: item.admin1 ? String(item.admin1) : undefined,
    }));
  } catch (err) {
    console.warn('[Geocoding] City search failed:', err);
    return [];
  }
}
