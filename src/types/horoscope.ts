export interface ZodiacSignInfo {
  id: string;
  name: string;
  rashiMarathi: string;
  rashiTranslit: string;
  dateRange: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  rulingPlanet: string;
  symbol: string;
  prediction: string;
  luckyNumber: number;
  luckyColor: string;
  compatibility: string;
  focusArea: string;
}
