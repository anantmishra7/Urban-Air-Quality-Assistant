import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Wind,
  Bot,
  Map,
  TrendingUp,
  GitCompare,
  FileText,
  Info,
  Menu,
  X,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { useCity } from '../../context/CityContext';
import { CitySearch } from '../ui/CitySearch';

export const Navbar: React.FC = () => {
  const { selectedCity } = useCity();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: Wind },
    { name: 'AI Assistant', path: '/assistant', icon: Bot, badge: 'AI' },
    { name: 'Hotspot Map', path: '/map', icon: Map },
    { name: '5-Day Forecast', path: '/forecast', icon: TrendingUp },
    { name: 'Compare', path: '/compare', icon: GitCompare },
    { name: 'Citizen Reports', path: '/report', icon: FileText },
    { name: 'About & Data', path: '/about', icon: Info },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Tagline */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Wind className="w-5 h-5 text-emerald-400 group-hover:rotate-6 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">BreatheCity</span>
                <span className="text-emerald-400 font-mono font-bold text-xs bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">AI</span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-0.5 font-medium hidden sm:block">
                Understand Your Air. Protect Your Future.
              </p>
            </div>
          </Link>

          {/* Desktop Search Bar */}
          <div className="hidden lg:block w-72">
            <CitySearch placeholder="Change city..." />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Active City Pill & Mobile Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearchModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 hover:border-emerald-500/50 text-xs font-medium text-slate-200 transition-colors shadow-sm"
              title="Click to change city"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold text-white max-w-[100px] truncate">{selectedCity}</span>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-slate-950/95 px-4 pt-3 pb-6 space-y-3">
            <div className="pb-2">
              <CitySearch
                placeholder="Search city..."
                onSelect={() => setMobileMenuOpen(false)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 text-emerald-400" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Quick Search Modal for Mobile/Desktop */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Select Active City
              </h3>
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <CitySearch
              autoFocus
              onSelect={() => setShowSearchModal(false)}
            />
            <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Uses official Indian CPCB breakpoints & Open-Meteo live air metrics</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
