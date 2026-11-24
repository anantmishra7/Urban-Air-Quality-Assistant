import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Clock,
  Sun,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useCity } from '../context/CityContext';
import { api } from '../api/client';
import { AqiBadge } from '../components/ui/AqiBadge';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { ErrorState } from '../components/ui/ErrorState';
import type { HourlyForecastItem, DailyForecastItem } from '../types';

export const ForecastPage: React.FC = () => {
  const { selectedCity } = useCity();
  const [dailyData, setDailyData] = useState<DailyForecastItem[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyForecastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function fetchForecasts() {
      setLoading(true);
      setError(null);
      try {
        const [dailyRes, hourlyRes] = await Promise.all([
          api.getDailyForecast(selectedCity),
          api.getHourlyForecast(selectedCity),
        ]);
        if (mounted) {
          setDailyData(dailyRes.daily || []);
          setHourlyData(hourlyRes.hourly || []);
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unable to fetch forecast data.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchForecasts();
    return () => {
      mounted = false;
    };
  }, [selectedCity, reloadKey]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <LoadingSkeleton className="h-10 w-1/4" />
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <LoadingSkeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
        <LoadingSkeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (error || (!dailyData.length && !hourlyData.length)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ErrorState
          title={`Forecast Unavailable for ${selectedCity}`}
          message={error || 'Atmospheric chemistry forecasts for this location are currently unavailable from Open-Meteo.'}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      </div>
    );
  }

  // Calculate projected trend from daily data
  const firstAqi = dailyData[0]?.avg_aqi || 0;
  const lastAqi = dailyData[dailyData.length - 1]?.avg_aqi || 0;
  const aqiDiff = lastAqi - firstAqi;

  let trendLabel = 'Stable';
  let TrendIcon = Minus;
  let trendColor = 'text-slate-300';
  if (aqiDiff < -15) {
    trendLabel = 'Improving (Lower AQI expected)';
    TrendIcon = ArrowDownRight;
    trendColor = 'text-emerald-400';
  } else if (aqiDiff > 15) {
    trendLabel = 'Deteriorating (Higher AQI expected)';
    TrendIcon = ArrowUpRight;
    trendColor = 'text-rose-400';
  }

  // Prepare hourly chart dataset
  const chartData = hourlyData.slice(0, 48).map((item) => {
    const rawTime = item.timestamp;
    const datePart = rawTime.includes('T') ? rawTime.split('T')[0].slice(5) : '';
    const hourPart = rawTime.includes('T') ? rawTime.split('T')[1].slice(0, 5) : rawTime;
    return {
      time: `${datePart} ${hourPart}`,
      aqi: item.aqi ? Math.round(item.aqi) : null,
      pm2_5: item.pollutants?.pm2_5 ? Math.round(item.pollutants.pm2_5) : null,
      pm10: item.pollutants?.pm10 ? Math.round(item.pollutants.pm10) : null,
      category: item.aqi_category,
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            5-Day Air Quality & Particulate Forecast
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Projection for <strong className="text-slate-200">{selectedCity}</strong> &bull; Sourced from Open-Meteo European Atmospheric Chemistry Models
          </p>
        </div>

        {/* Overall trend badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <span className="text-slate-400">5-Day Trajectory:</span>
          <span className={`font-bold flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            {trendLabel}
          </span>
        </div>
      </div>

      {/* 5-Day Daily Forecast Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {dailyData.slice(0, 5).map((item, idx) => {
          const dateObj = new Date(item.date);
          const dayName = idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          return (
            <div
              key={item.date}
              className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-slate-700 bg-slate-900/60 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-sm text-white">{dayName}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{formattedDate}</span>
                </div>

                <div className="my-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black font-mono text-white">
                      {item.avg_aqi ? Math.round(item.avg_aqi) : 'N/A'}
                    </span>
                    <span className="text-xs text-slate-400">Avg AQI</span>
                  </div>
                  <div className="mt-1">
                    <AqiBadge category={item.aqi_category} size="sm" />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-1 text-[11px] text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Range:</span>
                  <span className="font-mono text-slate-300">
                    {item.min_aqi ? Math.round(item.min_aqi) : '–'} &ndash; {item.max_aqi ? Math.round(item.max_aqi) : '–'}
                  </span>
                </div>
                {item.avg_pollutants?.pm2_5 !== undefined && item.avg_pollutants?.pm2_5 !== null && (
                  <div className="flex items-center justify-between">
                    <span>Avg PM2.5:</span>
                    <span className="font-mono text-emerald-300">
                      {Math.round(item.avg_pollutants.pm2_5)} µg/m³
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 48-Hour Hourly Forecast Chart */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              48-Hour High-Resolution Projection (Hourly)
            </h2>
            <p className="text-xs text-slate-400">
              Correlating projected CPCB AQI with PM2.5 and PM10 concentrations
            </p>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} interval={3} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const p = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
                        <div className="font-bold text-slate-200">{p.time}</div>
                        <div className="text-emerald-400 font-mono font-bold">CPCB AQI: {p.aqi}</div>
                        <div className="text-teal-400 font-mono">PM2.5: {p.pm2_5} µg/m³</div>
                        <div className="text-blue-400 font-mono">PM10: {p.pm10} µg/m³</div>
                        {p.category && <div className="text-slate-400 text-[10px]">Status: {p.category}</div>}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              <Line type="monotone" dataKey="aqi" name="CPCB AQI" stroke="#10b981" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="pm2_5" name="PM2.5 (µg/m³)" stroke="#06b6d4" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="pm10" name="PM10 (µg/m³)" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Smart Exposure Window Advice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl glass-panel border border-emerald-500/30 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Sun className="w-4 h-4" />
            Recommended Outdoor Activity Windows
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Atmospheric dispersion tends to be highest in early-to-mid afternoons when surface heating breaks morning inversion layers. Check the hourly graph above to schedule jogging or sports when PM2.5 dips.
          </p>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-rose-500/30 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <ShieldAlert className="w-4 h-4" />
            Peak Pollution Traps to Avoid
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Morning rush hours (07:00 &ndash; 10:00) and late nights (21:00 &ndash; 01:00) frequently suffer from thermal inversion and stagnant calm winds, trapping emissions close to ground level.
          </p>
        </div>
      </div>
    </div>
  );
};
