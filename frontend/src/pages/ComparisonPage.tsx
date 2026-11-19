import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  Plus,
  X,
  Layers,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { api } from '../api/client';
import { AqiBadge } from '../components/ui/AqiBadge';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { ErrorState } from '../components/ui/ErrorState';
import type { ComparisonItem } from '../types';

export const ComparisonPage: React.FC = () => {
  const [cities, setCities] = useState<string[]>(['Delhi', 'Mumbai', 'Bengaluru', 'Kolkata']);
  const [newCityInput, setNewCityInput] = useState('');
  const [data, setData] = useState<ComparisonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const presets = [
    { label: 'Top Indian Metros', list: ['Delhi', 'Mumbai', 'Bengaluru', 'Kolkata', 'Chennai'] },
    { label: 'North vs South', list: ['Delhi', 'Lucknow', 'Bengaluru', 'Chennai'] },
    { label: 'Global Comparison', list: ['Delhi', 'London', 'Beijing', 'New York', 'Tokyo'] },
  ];

  const fetchComparison = async (cityList: string[]) => {
    if (cityList.length === 0) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.compareCities(cityList);
      setData(res.comparison || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Comparison failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison(cities);
  }, [cities]);

  const handleAddCity = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCityInput.trim();
    if (!trimmed) return;
    if (cities.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setNewCityInput('');
      return;
    }
    if (cities.length >= 6) {
      alert('You can compare up to 6 cities at once.');
      return;
    }
    setCities([...cities, trimmed]);
    setNewCityInput('');
  };

  const handleRemoveCity = (cityToRemove: string) => {
    setCities(cities.filter((c) => c.toLowerCase() !== cityToRemove.toLowerCase()));
  };

  const chartData = data.map((item) => ({
    city: item.city,
    aqi: item.aqi ? Math.round(item.aqi) : 0,
    pm2_5: item.pollutants?.pm2_5 ? Math.round(item.pollutants.pm2_5) : 0,
    pm10: item.pollutants?.pm10 ? Math.round(item.pollutants.pm10) : 0,
    category: item.aqi_category,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & Presets */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-emerald-400" />
            Multi-City Air Quality Benchmarking
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Standardized CPCB evaluation across cities with identical breakpoint interpolation
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Presets:</span>
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => setCities(p.list)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-white transition-all"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Cities Tag Cloud & Add Input */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center gap-2">
        {cities.map((c) => (
          <span
            key={c}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white shadow-sm"
          >
            <span>{c}</span>
            <button
              onClick={() => handleRemoveCity(c)}
              className="p-0.5 hover:text-rose-400 transition-colors"
              title={`Remove ${c}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}

        {cities.length < 6 && (
          <form onSubmit={handleAddCity} className="inline-flex items-center gap-1">
            <input
              type="text"
              value={newCityInput}
              onChange={(e) => setNewCityInput(e.target.value)}
              placeholder="Add city (e.g. Pune)..."
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36"
            />
            <button
              type="submit"
              disabled={!newCityInput.trim()}
              className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs disabled:opacity-40 transition-all"
              title="Add city"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          <LoadingSkeleton className="h-64 rounded-2xl" />
          <LoadingSkeleton className="h-64 rounded-2xl" />
        </div>
      ) : error ? (
        <ErrorState
          title="Comparison Failed"
          message={error}
          onRetry={() => fetchComparison(cities)}
        />
      ) : (
        <>
          {/* Comparative Bar Chart */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  Comparative AQI & PM2.5 Chart
                </h2>
                <p className="text-xs text-slate-400">Comparing overall AQI against primary respirable particulate matter</p>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="city" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const p = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
                            <div className="font-bold text-white text-sm">{p.city}</div>
                            <div className="text-emerald-400 font-mono font-bold">CPCB AQI: {p.aqi}</div>
                            <div className="text-cyan-400 font-mono">PM2.5: {p.pm2_5} µg/m³</div>
                            <div className="text-purple-400 font-mono">PM10: {p.pm10} µg/m³</div>
                            <div className="text-slate-400 text-[10px]">Category: {p.category}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar dataKey="aqi" name="CPCB AQI" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="pm2_5" name="PM2.5 (µg/m³)" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="pm10" name="PM10 (µg/m³)" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Matrix Breakdown Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Comprehensive Cross-City Matrix
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">City</th>
                    <th className="p-3.5">AQI</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Dominant Pollutant</th>
                    <th className="p-3.5">PM2.5</th>
                    <th className="p-3.5">PM10</th>
                    <th className="p-3.5">Temp / Wind</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {data.map((item) => (
                    <tr key={item.city} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3.5 font-bold text-white">{item.city}</td>
                      <td className="p-3.5 font-mono text-base font-extrabold text-emerald-400">
                        {item.aqi ? Math.round(item.aqi) : 'N/A'}
                      </td>
                      <td className="p-3.5">
                        <AqiBadge category={item.aqi_category} size="sm" />
                      </td>
                      <td className="p-3.5 uppercase font-mono text-slate-300">
                        {item.dominant_pollutant ? item.dominant_pollutant.replace('_', '.') : '–'}
                      </td>
                      <td className="p-3.5 font-mono text-slate-200">
                        {item.pollutants?.pm2_5 !== undefined && item.pollutants?.pm2_5 !== null
                          ? `${item.pollutants.pm2_5.toFixed(1)} µg/m³`
                          : 'N/A'}
                      </td>
                      <td className="p-3.5 font-mono text-slate-200">
                        {item.pollutants?.pm10 !== undefined && item.pollutants?.pm10 !== null
                          ? `${item.pollutants.pm10.toFixed(1)} µg/m³`
                          : 'N/A'}
                      </td>
                      <td className="p-3.5 text-slate-400">
                        {item.weather?.temperature !== undefined ? `${item.weather.temperature}°C` : '–'} &bull;{' '}
                        {item.weather?.windspeed !== undefined ? `${item.weather.windspeed} km/h` : '–'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
