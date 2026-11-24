import React, { createContext, useContext, useState, useEffect } from 'react';

interface CityContextType {
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  recentCities: string[];
  addRecentCity: (city: string) => void;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

const DEFAULT_CITY = 'Delhi';
const RECENT_KEY = 'breathecity_recent_cities';

export const CityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCity, setSelectedCityState] = useState<string>(() => {
    return localStorage.getItem('breathecity_city') || DEFAULT_CITY;
  });

  const [recentCities, setRecentCities] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      return stored ? JSON.parse(stored) : ['Delhi', 'Mumbai', 'Bengaluru', 'Kolkata', 'Chennai'];
    } catch {
      return ['Delhi', 'Mumbai', 'Bengaluru', 'Kolkata', 'Chennai'];
    }
  });

  const setSelectedCity = (city: string) => {
    const trimmed = city.trim();
    if (!trimmed) return;
    setSelectedCityState(trimmed);
    localStorage.setItem('breathecity_city', trimmed);
    addRecentCity(trimmed);
  };

  const addRecentCity = (city: string) => {
    const trimmed = city.trim();
    if (!trimmed) return;
    setRecentCities((prev) => {
      const filtered = prev.filter((c) => c.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 6);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    localStorage.setItem('breathecity_city', selectedCity);
  }, [selectedCity]);

  return (
    <CityContext.Provider
      value={{
        selectedCity,
        setSelectedCity,
        recentCities,
        addRecentCity,
      }}
    >
      {children}
    </CityContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCity = (): CityContextType => {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
};
