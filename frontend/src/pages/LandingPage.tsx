import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wind,
  Shield,
  Bot,
  MapPin,
  TrendingUp,
  GitCompare,
  FileText,
  ArrowRight,
  Activity,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { useCity } from '../context/CityContext';
import { CitySearch } from '../components/ui/CitySearch';
import { api } from '../api/client';
import { AqiBadge } from '../components/ui/AqiBadge';
import type { AqiData } from '../types';

const FEATURED_METROS = ['Delhi', 'Mumbai', 'Bengaluru', 'Kolkata', 'Chennai'];

export const LandingPage: React.FC = () => {
  const { setSelectedCity } = useCity();
  const navigate = useNavigate();
  const [metroData, setMetroData] = useState<{ city: string; aqi: number | null; category: string }[]>([]);
  const [loadingMetros, setLoadingMetros] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadMetros() {
      try {
        const promises = FEATURED_METROS.map(async (city) => {
          try {
            const data: AqiData = await api.getAqi(city);
            return { city, aqi: data.aqi, category: data.aqi_category };
          } catch {
            return { city, aqi: null, category: 'unknown' };
          }
        });
        const results = await Promise.all(promises);
        if (isMounted) {
          setMetroData(results);
          setLoadingMetros(false);
        }
      } catch {
        if (isMounted) setLoadingMetros(false);
      }
    }
    loadMetros();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    navigate('/dashboard');
  };

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20 px-4 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6 shadow-sm">
          <Shield className="w-3.5 h-3.5" />
          <span>Hack2Skill PromptWars &bull; Challenge 6: Urban Air Quality Assistant</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Understand Your Air.{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Protect Your Future.
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
          Real-time urban air quality intelligence powered by official Indian CPCB methodology,
          Open-Meteo atmospheric telemetry, spatial hotspot detection, and context-aware AI health guidance.
        </p>

        {/* Central Search Bar */}
        <div className="max-w-xl mx-auto mb-10 shadow-2xl">
          <CitySearch
            placeholder="Search any city worldwide (e.g. Delhi, Mumbai, Bengaluru)..."
            onSelect={handleCitySelect}
          />
        </div>

        {/* Live Metro AQI Quick Ticker */}
        <div className="mt-8">
          <div className="text-xs uppercase font-semibold text-slate-400 mb-3 tracking-wider">
            Live Quick Glance &bull; Major Metros
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {loadingMetros
              ? FEATURED_METROS.map((c) => (
                  <div
                    key={c}
                    className="h-10 w-28 bg-slate-900/80 rounded-xl border border-slate-800 animate-pulse"
                  />
                ))
              : metroData.map((item) => (
                  <button
                    key={item.city}
                    onClick={() => handleCitySelect(item.city)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 transition-all text-xs text-slate-200 shadow-md group"
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-white">{item.city}</span>
                    <AqiBadge category={item.category} aqi={item.aqi} size="sm" showNumber />
                  </button>
                ))}
          </div>
        </div>
      </section>

      {/* Feature Modules Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Engineered for Transparency & Impact
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Comprehensive suite of modules addressing urban air pollution from raw telemetry to citizen action.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <Link
            to="/dashboard"
            className="glass-panel p-6 rounded-2xl hover:border-emerald-500/40 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Wind className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                CPCB AQI Dashboard
                <ArrowRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Real-time computation of Indian National AQI from 6 criteria pollutants (PM2.5, PM10, CO, NO₂, SO₂, O₃) with sub-indices and health implications.
              </p>
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <span>Explore Dashboard</span>
              <span>&rarr;</span>
            </div>
          </Link>

          {/* Feature 2 */}
          <Link
            to="/assistant"
            className="glass-panel p-6 rounded-2xl hover:border-emerald-500/40 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                AI Health Assistant
                <ArrowRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Context-aware conversational advisor. Answers questions on outdoor exercise safety, N95 mask guidance, child and elderly precautions, and indoor air purification.
              </p>
            </div>
            <div className="text-[11px] text-teal-400 font-semibold flex items-center gap-1">
              <span>Ask AI Assistant</span>
              <span>&rarr;</span>
            </div>
          </Link>

          {/* Feature 3 */}
          <Link
            to="/map"
            className="glass-panel p-6 rounded-2xl hover:border-emerald-500/40 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                Hotspot Detection Map
                <ArrowRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Spatial analysis comparing center city against surrounding coordinates. Identifies areas with comparatively severe pollution gradients.
              </p>
            </div>
            <div className="text-[11px] text-blue-400 font-semibold flex items-center gap-1">
              <span>View Map</span>
              <span>&rarr;</span>
            </div>
          </Link>

          {/* Feature 4 */}
          <Link
            to="/forecast"
            className="glass-panel p-6 rounded-2xl hover:border-emerald-500/40 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                5-Day AQI Forecast
                <ArrowRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Detailed hourly PM2.5, PM10 projections and daily summaries. Plan outdoor sports, travel, and activities around peak pollution hours.
              </p>
            </div>
            <div className="text-[11px] text-purple-400 font-semibold flex items-center gap-1">
              <span>View Forecasts</span>
              <span>&rarr;</span>
            </div>
          </Link>

          {/* Feature 5 */}
          <Link
            to="/compare"
            className="glass-panel p-6 rounded-2xl hover:border-emerald-500/40 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <GitCompare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                Multi-City Comparison
                <ArrowRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Side-by-side comparative benchmarking for up to 10 cities. Comparative bar charts, weather conditions, and relative pollution rank.
              </p>
            </div>
            <div className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
              <span>Compare Cities</span>
              <span>&rarr;</span>
            </div>
          </Link>

          {/* Feature 6 */}
          <Link
            to="/report"
            className="glass-panel p-6 rounded-2xl hover:border-emerald-500/40 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                Citizen Reporting Portal
                <ArrowRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Empower citizens to submit localized pollution complaints (stubble burning, industrial fumes, road dust) with validated photo evidence.
              </p>
            </div>
            <div className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
              <span>Report Incident</span>
              <span>&rarr;</span>
            </div>
          </Link>
        </div>
      </section>

      {/* CPCB AQI Scale Guide */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">CPCB Indian National AQI Scale</h3>
              <p className="text-xs text-slate-400">
                Official breakpoints published by the Central Pollution Control Board (Ministry of Environment, Forest and Climate Change)
              </p>
            </div>
            <Link
              to="/about"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Full Methodology & Breakpoints</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { cat: 'Good', range: '0 – 50', color: 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300', desc: 'Minimal health impact' },
              { cat: 'Satisfactory', range: '51 – 100', color: 'border-lime-500/50 bg-lime-950/30 text-lime-300', desc: 'Minor breathing discomfort' },
              { cat: 'Moderate', range: '101 – 200', color: 'border-amber-500/50 bg-amber-950/30 text-amber-300', desc: 'Discomfort to sensitive groups' },
              { cat: 'Poor', range: '201 – 300', color: 'border-orange-500/50 bg-orange-950/30 text-orange-300', desc: 'Breathing discomfort on exposure' },
              { cat: 'Very Poor', range: '301 – 400', color: 'border-rose-500/50 bg-rose-950/30 text-rose-300', desc: 'Respiratory illness on exposure' },
              { cat: 'Severe', range: '401 – 500', color: 'border-red-700/60 bg-red-950/50 text-red-200', desc: 'Respiratory effects on all groups' },
            ].map((scale) => (
              <div key={scale.cat} className={`p-3 rounded-xl border ${scale.color} space-y-1`}>
                <div className="font-bold text-xs">{scale.cat}</div>
                <div className="font-mono text-sm font-bold text-white">{scale.range}</div>
                <div className="text-[10px] text-slate-400 leading-snug">{scale.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Methodology Banner */}
      <section className="max-w-5xl mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1 text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Real Atmospheric Telemetry
          </span>
          <span>&bull;</span>
          <span className="flex items-center gap-1 text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> No Fake Live Data
          </span>
          <span>&bull;</span>
          <span className="flex items-center gap-1 text-slate-300">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Non-Clinical Public Advisory
          </span>
        </div>
      </section>
    </div>
  );
};
