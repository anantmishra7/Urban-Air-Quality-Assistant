import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Map as MapIcon,
  Flame,
  Layers,
} from 'lucide-react';
import { useCity } from '../context/CityContext';
import { api } from '../api/client';
import { AqiBadge } from '../components/ui/AqiBadge';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { ErrorState } from '../components/ui/ErrorState';
import type { HotspotResponse, HotspotPoint } from '../types';

// Fix default Leaflet icon paths in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to dynamically re-center Leaflet map when center coordinates change
const MapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 11);
  }, [center, map]);
  return null;
};

const getMarkerColor = (category: string) => {
  switch (category.toLowerCase()) {
    case 'good':
      return '#10b981';
    case 'satisfactory':
      return '#84cc16';
    case 'moderate':
      return '#eab308';
    case 'poor':
      return '#f97316';
    case 'very poor':
      return '#ef4444';
    case 'severe':
      return '#7f1d1d';
    default:
      return '#64748b';
  }
};

export const MapPage: React.FC = () => {
  const { selectedCity, setSelectedCity } = useCity();
  const [data, setData] = useState<HotspotResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<HotspotPoint | null>(null);

  const majorCities = ['Delhi', 'Mumbai', 'Bengaluru', 'Kolkata', 'Chennai', 'Hyderabad'];

  const loadHotspots = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getHotspots(selectedCity);
      setData(res);
      if (res.hotspots && res.hotspots.length > 0) {
        setSelectedPoint(res.hotspots[0]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not fetch hotspot data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotspots();
  }, [selectedCity]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <LoadingSkeleton className="h-10 w-1/3" />
        <LoadingSkeleton className="h-[500px] rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ErrorState
          title={`Hotspot Mapping Failed for ${selectedCity}`}
          message={error || 'Unable to compute spatial grid points for this location.'}
          onRetry={loadHotspots}
        />
      </div>
    );
  }

  const mapCenter: [number, number] = [data.center.latitude, data.center.longitude];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header & City Quick Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-emerald-400" />
            Pollution Hotspot Detection & Spatial Grid
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Spatial variation across 9 coordinate sectors for <strong className="text-slate-200">{data.city}</strong>
          </p>
        </div>

        {/* Quick Metro Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {majorCities.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCity(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCity.toLowerCase() === c.toLowerCase()
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Map + Hotspot Rankings Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaflet Interactive Map View */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col h-[560px] relative overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              Spatial Heat Grid View
            </span>
            <span className="text-[11px] text-slate-400">
              Circles sized and colored by CPCB AQI severity
            </span>
          </div>

          <div className="flex-1 w-full rounded-xl overflow-hidden border border-slate-800">
            <MapContainer
              center={mapCenter}
              zoom={11}
              scrollWheelZoom={false}
              className="h-full w-full"
            >
              <MapUpdater center={mapCenter} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />

              {data.hotspots.map((pt, idx) => {
                const color = getMarkerColor(pt.aqi_category);
                const radius = pt.aqi ? Math.max(14, Math.min(32, (pt.aqi / 500) * 36)) : 14;

                return (
                  <CircleMarker
                    key={`${pt.label}-${idx}`}
                    center={[pt.latitude, pt.longitude]}
                    pathOptions={{
                      color: color,
                      fillColor: color,
                      fillOpacity: 0.5,
                      weight: 2,
                    }}
                    radius={radius}
                    eventHandlers={{
                      click: () => setSelectedPoint(pt),
                    }}
                  >
                    <Popup>
                      <div className="text-xs space-y-1 p-1">
                        <div className="font-bold text-white text-sm">{pt.label} Sector</div>
                        <div className="font-mono text-emerald-400 font-bold">
                          AQI: {pt.aqi ? Math.round(pt.aqi) : 'N/A'} ({pt.aqi_category})
                        </div>
                        <div className="text-[10px] text-slate-300">
                          PM2.5: {pt.pollutants?.pm2_5 ? `${pt.pollutants.pm2_5.toFixed(1)} µg/m³` : 'N/A'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Coord: {pt.latitude.toFixed(3)}, {pt.longitude.toFixed(3)}
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* Hotspots Ranking & Sector Inspector */}
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-400" />
                Sector Pollution Ranking
              </h2>
              <span className="text-[11px] text-slate-400">Worst &rarr; Best</span>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {data.hotspots.map((pt, rank) => {
                const isSelected = selectedPoint?.label === pt.label;
                const isWorst = rank === 0;

                return (
                  <button
                    key={pt.label}
                    onClick={() => setSelectedPoint(pt)}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-800 border-emerald-500/50 shadow-md'
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                          isWorst ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {rank + 1}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-200">{pt.label}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          PM2.5: {pt.pollutants?.pm2_5 ? Math.round(pt.pollutants.pm2_5) : '–'} µg/m³
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-100">
                        {pt.aqi ? Math.round(pt.aqi) : '–'}
                      </div>
                      <span className="text-[10px] text-slate-400">{pt.aqi_category}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Point Deep Dive */}
          {selectedPoint && (
            <div className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-2 text-xs">
              <div className="font-bold text-white flex items-center justify-between">
                <span>Selected: {selectedPoint.label}</span>
                <AqiBadge category={selectedPoint.aqi_category} aqi={selectedPoint.aqi} size="sm" showNumber />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                <div>PM2.5: {selectedPoint.pollutants?.pm2_5?.toFixed(1) || 'N/A'} µg/m³</div>
                <div>PM10: {selectedPoint.pollutants?.pm10?.toFixed(1) || 'N/A'} µg/m³</div>
                <div>NO₂: {selectedPoint.pollutants?.nitrogen_dioxide?.toFixed(1) || 'N/A'} µg/m³</div>
                <div>SO₂: {selectedPoint.pollutants?.sulphur_dioxide?.toFixed(1) || 'N/A'} µg/m³</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
