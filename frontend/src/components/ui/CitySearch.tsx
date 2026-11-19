import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Clock, Loader2 } from 'lucide-react';
import { useCity } from '../../context/CityContext';
import { api } from '../../api/client';
import type { GeocodeLocation } from '../../types';

interface CitySearchProps {
  placeholder?: string;
  onSelect?: (cityName: string) => void;
  className?: string;
  autoFocus?: boolean;
}

export const CitySearch: React.FC<CitySearchProps> = ({
  placeholder = 'Search city (e.g. Delhi, Mumbai, London)...',
  onSelect,
  className = '',
  autoFocus = false,
}) => {
  const { selectedCity, setSelectedCity, recentCities } = useCity();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodeLocation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<number | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedIndex(-1);

    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);

    if (val.trim().length >= 2) {
      setLoading(true);
      debounceTimer.current = window.setTimeout(async () => {
        try {
          const results = await api.geocode(val.trim(), 6);
          setSuggestions(results);
          setIsOpen(true);
        } catch {
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setIsOpen(false);
      setLoading(false);
    }
  };

  const handleSelectCity = (cityName: string) => {
    setSelectedCity(cityName);
    setQuery('');
    setIsOpen(false);
    setSuggestions([]);
    if (onSelect) onSelect(cityName);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const totalItems = suggestions.length > 0 ? suggestions.length : recentCities.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0) {
        if (suggestions.length > 0 && suggestions[selectedIndex]) {
          handleSelectCity(suggestions[selectedIndex].name);
        } else if (recentCities[selectedIndex]) {
          handleSelectCity(recentCities[selectedIndex]);
        }
      } else if (query.trim()) {
        handleSelectCity(query.trim());
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full max-w-md ${className}`}>
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/80 transition-all shadow-inner"
        />
        {loading ? (
          <Loader2 className="absolute right-3.5 w-4 h-4 text-emerald-400 animate-spin" />
        ) : query ? (
          <button
            onClick={() => {
              setQuery('');
              setSuggestions([]);
            }}
            className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {isOpen && (
        <div className="absolute top-full mt-1.5 w-full bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800 backdrop-blur-md">
          {suggestions.length > 0 ? (
            <div className="p-1 max-h-60 overflow-y-auto">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Matching Cities
              </div>
              {suggestions.map((loc, idx) => (
                <button
                  key={`${loc.name}-${loc.latitude}-${idx}`}
                  onClick={() => handleSelectCity(loc.name)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                    selectedIndex === idx ? 'bg-emerald-500/20 text-emerald-300' : 'hover:bg-slate-800/80 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-medium truncate">{loc.name}</span>
                    {(loc.admin1 || loc.country) && (
                      <span className="text-xs text-slate-400 truncate">
                        {[loc.admin1, loc.country].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No matching locations found. Press Enter to search anyway.
            </div>
          ) : recentCities.length > 0 ? (
            <div className="p-1">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-400" />
                Recent & Popular Cities
              </div>
              <div className="grid grid-cols-2 gap-1 p-1">
                {recentCities.map((city, idx) => (
                  <button
                    key={city}
                    onClick={() => handleSelectCity(city)}
                    className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors truncate ${
                      selectedCity.toLowerCase() === city.toLowerCase()
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : selectedIndex === idx
                        ? 'bg-slate-800 text-slate-100'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{city}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
