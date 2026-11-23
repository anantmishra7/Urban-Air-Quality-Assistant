import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CityProvider } from './context/CityContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LoadingSkeleton } from './components/ui/LoadingSkeleton';

// Code splitting via React.lazy for improved initial load efficiency
const LandingPage = React.lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const AssistantPage = React.lazy(() => import('./pages/AssistantPage').then((m) => ({ default: m.AssistantPage })));
const MapPage = React.lazy(() => import('./pages/MapPage').then((m) => ({ default: m.MapPage })));
const ForecastPage = React.lazy(() => import('./pages/ForecastPage').then((m) => ({ default: m.ForecastPage })));
const ComparisonPage = React.lazy(() => import('./pages/ComparisonPage').then((m) => ({ default: m.ComparisonPage })));
const ReportPage = React.lazy(() => import('./pages/ReportPage').then((m) => ({ default: m.ReportPage })));
const AboutPage = React.lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));

const RouteFallback: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 py-16 space-y-4">
    <LoadingSkeleton className="h-10 w-1/4 rounded-xl" />
    <LoadingSkeleton className="h-64 rounded-2xl" />
  </div>
);

export const App: React.FC = () => {
  return (
    <CityProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
          <Navbar />
          <main className="flex-1">
            <Suspense fallback={<RouteFallback />}>
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
            </Suspense>
          </main>
          <Footer />
        </div>
      </Router>
    </CityProvider>
  );
};

export default App;
