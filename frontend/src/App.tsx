import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CityProvider } from './context/CityContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { AssistantPage } from './pages/AssistantPage';
import { MapPage } from './pages/MapPage';
import { ForecastPage } from './pages/ForecastPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { ReportPage } from './pages/ReportPage';
import { AboutPage } from './pages/AboutPage';

export const App: React.FC = () => {
  return (
    <CityProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/assistant" element={<AssistantPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/forecast" element={<ForecastPage />} />
              <Route path="/compare" element={<ComparisonPage />} />
              <Route path="/report" element={<ReportPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </CityProvider>
  );
};

export default App;
