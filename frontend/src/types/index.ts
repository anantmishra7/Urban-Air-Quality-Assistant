export type AqiCategory =
  | 'Good'
  | 'Satisfactory'
  | 'Moderate'
  | 'Poor'
  | 'Very Poor'
  | 'Severe'
  | 'unknown';

export interface Pollutants {
  pm2_5?: number | null;
  pm10?: number | null;
  carbon_monoxide?: number | null;
  nitrogen_dioxide?: number | null;
  sulphur_dioxide?: number | null;
  ozone?: number | null;
}

export interface WeatherData {
  temperature?: number;
  windspeed?: number;
  winddirection?: number;
  weathercode?: number;
  time?: string;
  is_day?: number;
}

export interface AqiData {
  city: string;
  latitude: number;
  longitude: number;
  aqi: number | null;
  sub_indices: Record<string, number>;
  dominant_pollutant: string | null;
  aqi_category: AqiCategory;
  health_implications: string;
  pollutants: Pollutants;
  weather: WeatherData;
  last_updated: string;
  source: string;
}

export interface HourlyForecastItem {
  timestamp: string;
  aqi: number | null;
  aqi_category: string;
  dominant_pollutant?: string;
  pollutants: Pollutants;
  sub_indices?: Record<string, number>;
}

export interface DailyForecastItem {
  date: string;
  avg_aqi: number | null;
  max_aqi: number | null;
  min_aqi: number | null;
  aqi_category: string;
  avg_pollutants: Pollutants;
  data_points: number;
}

export interface HotspotPoint {
  label: string;
  latitude: number;
  longitude: number;
  aqi: number | null;
  aqi_category: string;
  dominant_pollutant?: string;
  pollutants: Pollutants;
}

export interface HotspotResponse {
  city: string;
  center: { latitude: number; longitude: number };
  grid_size_degrees: number;
  points_count: number;
  hotspots: HotspotPoint[];
}

export interface CitizenReport {
  id: number;
  city: string;
  latitude: number;
  longitude: number;
  description: string;
  photo_path?: string | null;
  status: 'submitted' | 'under_review' | 'verified';
  created_at: string;
}

export interface ComparisonItem {
  city: string;
  latitude?: number;
  longitude?: number;
  aqi: number | null;
  aqi_category: string;
  dominant_pollutant?: string;
  pollutants: Pollutants;
  weather?: WeatherData;
  health_implications?: string;
  last_updated?: string;
}

export interface GeocodeLocation {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
  population?: number;
}

export interface AssistantAnswerResponse {
  city: string;
  question: string;
  answer: string;
  aqi_category: string;
  confidence?: string;
  context_used?: {
    aqi?: number | null;
    dominant_pollutant?: string | null;
    weather?: WeatherData;
  };
}
