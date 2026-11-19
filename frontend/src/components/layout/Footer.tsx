import React from 'react';
import { Wind, Shield, Database, HeartHandshake, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/90 text-slate-400 text-xs py-10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Wind className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-slate-100 text-sm">BreatheCity AI</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Hack2Skill
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              Understand Your Air. Protect Your Future. A full-stack intelligent Urban Air Quality Assistant built for{' '}
              <strong className="text-slate-200">Hack2Skill PromptWars – Challenge 6</strong>.
              Delivering verified CPCB Indian AQI calculations, spatial hotspot detection, citizen reporting, and context-aware health recommendations.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Transparent open data &bull; No fabricated live readings</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <div className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
              Quick Navigation
            </div>
            <ul className="space-y-1.5">
              <li>
                <Link to="/dashboard" className="hover:text-emerald-400 transition-colors">
                  Live AQI Dashboard
                </Link>
              </li>
              <li>
                <Link to="/assistant" className="hover:text-emerald-400 transition-colors">
                  AI Health Assistant
                </Link>
              </li>
              <li>
                <Link to="/map" className="hover:text-emerald-400 transition-colors">
                  City Hotspot Map
                </Link>
              </li>
              <li>
                <Link to="/forecast" className="hover:text-emerald-400 transition-colors">
                  5-Day AQI Forecast
                </Link>
              </li>
              <li>
                <Link to="/compare" className="hover:text-emerald-400 transition-colors">
                  Multi-City Comparison
                </Link>
              </li>
              <li>
                <Link to="/report" className="hover:text-emerald-400 transition-colors">
                  Citizen Reporting Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Data Sources & Methodology */}
          <div className="space-y-2">
            <div className="font-semibold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              Data Sources
            </div>
            <ul className="space-y-1.5 text-[11px]">
              <li className="flex items-center gap-1">
                <span>Open-Meteo Air Quality API</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
              </li>
              <li className="flex items-center gap-1">
                <span>Open-Meteo Weather API</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
              </li>
              <li className="flex items-center gap-1">
                <span>CPCB National AQI Standard</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
              </li>
              <li className="flex items-center gap-1">
                <span>OpenStreetMap & Leaflet</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom disclaimer */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />
            <span>
              Disclaimer: BreatheCity AI provides public environmental guidance based on open atmospheric models and should not replace clinical medical devices.
            </span>
          </div>
          <div>&copy; {new Date().getFullYear()} BreatheCity AI. MIT Licensed.</div>
        </div>
      </div>
    </footer>
  );
};
