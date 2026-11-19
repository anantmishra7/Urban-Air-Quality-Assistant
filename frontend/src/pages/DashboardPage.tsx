import React, { useEffect, useState } from 'react';
import {
  Wind,
  RefreshCw,
  Clock,
  Thermometer,
  Compass,
  AlertTriangle,
  Shield,
  Activity,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useCity } from '../context/CityContext';
import { api } from '../api/client';
import { AqiBadge, getCategoryStyles } from '../components/ui/AqiBadge';
import { StatCard } from '../components/ui/StatCard';
import { DashboardSkeleton } from '../components/ui/LoadingSkeleton';
import { ErrorState } from '../components/ui/ErrorState';
import type { AqiData, HourlyForecastItem } from '../types';

export const DashboardPage: React.FC = () => {
  const { selectedCity } = useCity();
  const [data, setData] = useState<AqiData | null>(null);
  const [hourlySeries, setHourlySeries] = useState<HourlyForecastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trendMetric, setTrendMetric] = useState<'aqi' | 'pm2_5' | 'pm10'>('aqi');

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [aqiRes, forecastRes] = await Promise.all([
        api.getAqi(selectedCity),
        api.getHourlyForecast(selectedCity).catch(() => ({ city: selectedCity, hourly: [] })),
      ]);
      setData(aqiRes);
      setHourlySeries(forecastRes.hourly || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch AQI data';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCity]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ErrorState
          title={`Could not fetch data for ${selectedCity}`}
          message={error || 'No air quality metrics available.'}
          onRetry={() => loadData(true)}
        />
      </div>
    );
  }

  const categoryStyles = getCategoryStyles(data.aqi_category);
  const aqiVal = data.aqi !== null ? Math.round(data.aqi) : 'N/A';

  // Format 24-hr chart data
  const chartData = hourlySeries.slice(0, 24).map((item) => {
    const timeStr = item.timestamp.includes('T') ? item.timestamp.split('T')[1].slice(0, 5) : item.timestamp;
    return {
      time: timeStr,
      aqi: item.aqi !== null ? Math.round(item.aqi) : null,
      pm2_5: item.pollutants?.pm2_5 !== null && item.pollutants?.pm2_5 !== undefined ? Math.round(item.pollutants.pm2_5) : null,
      pm10: item.pollutants?.pm10 !== null && item.pollutants?.pm10 !== undefined ? Math.round(item.pollutants.pm10) : null,
      category: item.aqi_category,
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header & Refresh Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {data.city}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              {data.latitude.toFixed(2)}°N, {data.longitude.toFixed(2)}°E
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Updated: {new Date(data.last_updated).toLocaleTimeString()}
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              {data.source}
            </span>
          </div>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-xs font-semibold text-slate-200 transition-all hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* Main AQI Hero & Health Guidance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Big AQI Status Card */}
        <div className={`glass-panel rounded-2xl p-6 border ${categoryStyles.border} bg-gradient-to-b from-slate-900/90 to-slate-950 flex flex-col justify-between shadow-2xl relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                CPCB National AQI
              </span>
              <AqiBadge category={data.aqi_category} size="md" />
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-6xl font-black font-mono tracking-tight text-white">
                {aqiVal}
              </span>
              <span className="text-xs text-slate-400 font-sans">Index</span>
            </div>

            <div className="text-sm font-semibold text-slate-200 mb-4">
              Status:{' '}
              <span className={categoryStyles.text}>{data.aqi_category}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 space-y-2 text-xs">
            {data.dominant_pollutant && (
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Dominant Pollutant:</span>
                <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-300 uppercase">
                  {data.dominant_pollutant.replace('_', '.')}
                </span>
              </div>
            )}
            <div className="text-[11px] text-slate-400 leading-tight">
              Calculated via official CPCB piecewise linear sub-index interpolation.
            </div>
          </div>
        </div>

        {/* Health Implications & Sensitive Groups Advisory */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2 border border-slate-800/80 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Health Implications & Actionable Guidance</h3>
                <p className="text-[11px] text-slate-400">Tailored to current {data.aqi_category} air conditions</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 leading-relaxed">
              <p className="font-medium">{data.health_implications}</p>
            </div>

            {/* Practical Advice Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                <div className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-emerald-400" />
                  Outdoor Activities & Sports
                </div>
                <p className="text-[11px] text-slate-400">
                  {data.aqi_category === 'Good' || data.aqi_category === 'Satisfactory'
                    ? 'Safe for all normal outdoor exercise and sports activities.'
                    : data.aqi_category === 'Moderate'
                    ? 'Limit long intense running outdoors; shift high-cardio workouts inside.'
                    : 'Avoid strenuous outdoor activities. Use indoor gyms with active ventilation.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                <div className="font-bold text-slate-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Children & Sensitive Groups
                </div>
                <p className="text-[11px] text-slate-400">
                  {data.aqi_category === 'Good'
                    ? 'No special restrictions needed for children or elderly.'
                    : data.aqi_category === 'Satisfactory' || data.aqi_category === 'Moderate'
                    ? 'Children and elderly should reduce prolonged outdoor playtime.'
                    : 'Children, seniors, and asthmatics must remain indoors with air filtration.'}
                </p>
              </div>
            </div>
          </div>

          {/* Weather Ribbon */}
          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-mono font-bold text-white">
                  {data.weather?.temperature !== undefined ? `${data.weather.temperature}°C` : 'N/A'}
                </span>
                <span className="text-slate-400">Temp</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-teal-400" />
                <span className="font-mono font-bold text-white">
                  {data.weather?.windspeed !== undefined ? `${data.weather.windspeed} km/h` : 'N/A'}
                </span>
                <span className="text-slate-400">Wind</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-mono font-bold text-white">
                  {data.weather?.winddirection !== undefined ? `${data.weather.winddirection}°` : 'N/A'}
                </span>
                <span className="text-slate-400">Dir</span>
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Open-Meteo Weather Sensor Feed
            </div>
          </div>
        </div>
      </div>

      {/* 6 Pollutants Detailed Breakdown Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Pollutant Concentration & Sub-Index Matrix
          </h2>
          <span className="text-xs text-slate-400">
            All concentrations in µg/m³ (CO in mg/m³)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* PM2.5 */}
          <StatCard
            label="PM2.5"
            value={data.pollutants.pm2_5 !== null && data.pollutants.pm2_5 !== undefined ? data.pollutants.pm2_5.toFixed(1) : 'N/A'}
            unit="µg/m³"
            subValue={`Sub-Index: ${data.sub_indices?.pm2_5 ?? 'N/A'}`}
            infoTooltip="Fine particulate matter ≤ 2.5 µm that penetrates deep into lungs."
            statusColor={data.sub_indices?.pm2_5 && data.sub_indices.pm2_5 > 200 ? 'text-rose-400' : 'text-slate-100'}
          />

          {/* PM10 */}
          <StatCard
            label="PM10"
            value={data.pollutants.pm10 !== null && data.pollutants.pm10 !== undefined ? data.pollutants.pm10.toFixed(1) : 'N/A'}
            unit="µg/m³"
            subValue={`Sub-Index: ${data.sub_indices?.pm10 ?? 'N/A'}`}
            infoTooltip="Coarse particulate matter ≤ 10 µm from dust, roads, and construction."
            statusColor={data.sub_indices?.pm10 && data.sub_indices.pm10 > 200 ? 'text-rose-400' : 'text-slate-100'}
          />

          {/* NO2 */}
          <StatCard
            label="NO₂"
            value={data.pollutants.nitrogen_dioxide !== null && data.pollutants.nitrogen_dioxide !== undefined ? data.pollutants.nitrogen_dioxide.toFixed(1) : 'N/A'}
            unit="µg/m³"
            subValue={`Sub-Index: ${data.sub_indices?.nitrogen_dioxide ?? 'N/A'}`}
            infoTooltip="Nitrogen Dioxide from vehicular combustion and diesel exhausts."
          />

          {/* SO2 */}
          <StatCard
            label="SO₂"
            value={data.pollutants.sulphur_dioxide !== null && data.pollutants.sulphur_dioxide !== undefined ? data.pollutants.sulphur_dioxide.toFixed(1) : 'N/A'}
            unit="µg/m³"
            subValue={`Sub-Index: ${data.sub_indices?.sulphur_dioxide ?? 'N/A'}`}
            infoTooltip="Sulphur Dioxide emitted by thermal power plants and refineries."
          />

          {/* CO */}
          <StatCard
            label="CO"
            value={data.pollutants.carbon_monoxide !== null && data.pollutants.carbon_monoxide !== undefined ? (data.pollutants.carbon_monoxide / 1000).toFixed(2) : 'N/A'}
            unit="mg/m³"
            subValue={`Sub-Index: ${data.sub_indices?.carbon_monoxide ?? 'N/A'}`}
            infoTooltip="Carbon Monoxide from incomplete combustion in vehicles and burning."
          />

          {/* O3 */}
          <StatCard
            label="Ozone (O₃)"
            value={data.pollutants.ozone !== null && data.pollutants.ozone !== undefined ? data.pollutants.ozone.toFixed(1) : 'N/A'}
            unit="µg/m³"
            subValue={`Sub-Index: ${data.sub_indices?.ozone ?? 'N/A'}`}
            infoTooltip="Ground-level photochemical smog formed by NOx and sunlight."
          />
        </div>
      </div>

      {/* 24-Hour Trend Interactive Chart */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              24-Hour Air Quality Progression
            </h2>
            <p className="text-xs text-slate-400">Hourly trend analysis and diurnal variation</p>
          </div>

          {/* Metric Selector Tabs */}
          <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs self-start sm:self-auto">
            <button
              onClick={() => setTrendMetric('aqi')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                trendMetric === 'aqi' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              CPCB AQI
            </button>
            <button
              onClick={() => setTrendMetric('pm2_5')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                trendMetric === 'pm2_5' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              PM2.5 (µg/m³)
            </button>
            <button
              onClick={() => setTrendMetric('pm10')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                trendMetric === 'pm10' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              PM10 (µg/m³)
            </button>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const p = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                          <div className="font-semibold text-slate-300">{p.time} hrs</div>
                          <div className="text-emerald-400 font-mono font-bold">
                            {trendMetric.toUpperCase()}: {p[trendMetric]}
                          </div>
                          {p.category && (
                            <div className="text-slate-400 text-[10px]">Category: {p.category}</div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={trendMetric}
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorMetric)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-xs text-slate-400">
            Hourly progression data is unavailable for this location.
          </div>
        )}
      </div>
    </div>
  );
};
