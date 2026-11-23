import type {
  AqiData,
  HourlyForecastItem,
  DailyForecastItem,
  HotspotResponse,
  ComparisonItem,
  CitizenReport,
  GeocodeLocation,
  AssistantAnswerResponse,
} from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson && errJson.detail) {
        errorMsg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  async getAqi(city: string): Promise<AqiData> {
    const res = await fetch(`${API_BASE}/aqi/?city=${encodeURIComponent(city)}`);
    return handleResponse<AqiData>(res);
  },

  async getHourlyForecast(city: string): Promise<{ city: string; hourly: HourlyForecastItem[] }> {
    const res = await fetch(`${API_BASE}/forecast/hourly?city=${encodeURIComponent(city)}`);
    const data = await handleResponse<{ city: string; hourly_aqi?: HourlyForecastItem[]; hourly?: HourlyForecastItem[] }>(res);
    return {
      city: data.city,
      hourly: data.hourly_aqi || data.hourly || [],
    };
  },

  async getDailyForecast(city: string): Promise<{ city: string; daily: DailyForecastItem[] }> {
    const res = await fetch(`${API_BASE}/forecast/daily?city=${encodeURIComponent(city)}`);
    const data = await handleResponse<{ city: string; daily_aqi?: DailyForecastItem[]; daily?: DailyForecastItem[] }>(res);
    return {
      city: data.city,
      daily: data.daily_aqi || data.daily || [],
    };
  },

  async getHotspots(city: string): Promise<HotspotResponse> {
    const res = await fetch(`${API_BASE}/hotspot/?city=${encodeURIComponent(city)}`);
    return handleResponse<HotspotResponse>(res);
  },

  async compareCities(cities: string[]): Promise<{ count: number; comparison: ComparisonItem[]; errors?: string[] }> {
    const query = cities.map((c) => encodeURIComponent(c.trim())).join(',');
    const res = await fetch(`${API_BASE}/compare/?cities=${query}`);
    return handleResponse<{ count: number; comparison: ComparisonItem[]; errors?: string[] }>(res);
  },

  async askAssistant(city: string, question: string): Promise<AssistantAnswerResponse> {
    const res = await fetch(
      `${API_BASE}/assistant/answer?city=${encodeURIComponent(city)}&question=${encodeURIComponent(question)}`
    );
    return handleResponse<AssistantAnswerResponse>(res);
  },

  async geocode(query: string, count = 5): Promise<GeocodeLocation[]> {
    if (!query.trim()) return [];
    try {
      const res = await fetch(`${API_BASE}/geocode/?q=${encodeURIComponent(query)}&count=${count}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.results || [];
    } catch {
      return [];
    }
  },

  async listReports(city?: string): Promise<CitizenReport[]> {
    const url = city ? `${API_BASE}/report/?city=${encodeURIComponent(city)}` : `${API_BASE}/report/`;
    const res = await fetch(url);
    return handleResponse<CitizenReport[]>(res);
  },

  async createReport(payload: {
    city: string;
    latitude: number;
    longitude: number;
    description: string;
    photo_path?: string;
  }): Promise<CitizenReport> {
    const res = await fetch(`${API_BASE}/report/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<CitizenReport>(res);
  },

  async uploadPhoto(file: File): Promise<{ filename: string; url: string; size_bytes: number }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<{ filename: string; url: string; size_bytes: number }>(res);
  },
};
