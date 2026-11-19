import React from 'react';
import {
  Info,
  Shield,
  Database,
  FileCheck2,
  AlertTriangle,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Page Title */}
      <div className="pb-4 border-b border-slate-800">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-3 border border-emerald-500/30">
          <Shield className="w-3.5 h-3.5" />
          <span>Hack2Skill PromptWars &bull; Challenge 6</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          About BreatheCity AI & Data Methodology
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Architectural overview, official Indian CPCB AQI calculation methodology, and data provenance.
        </p>
      </div>

      {/* Problem Statement & Solution */}
      <section className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-400" />
          Challenge 6: Urban Air Quality Assistant
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Rapid urbanization, seasonal agricultural biomass burning, vehicular emissions, and industrial activity have made air quality one of the most pressing public health hazards in modern cities. Citizens often struggle to interpret raw particulate concentrations or differentiate between differing AQI standards (such as US EPA vs Indian CPCB).
        </p>
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong>BreatheCity AI</strong> bridges this gap by aggregating live atmospheric telemetries, computing the exact Indian CPCB sub-index for all six primary criteria pollutants, detecting intra-city hotspot gradients, predicting 5-day trajectories, and providing context-aware AI recommendations for sensitive demographics.
        </p>
      </section>

      {/* Official CPCB AQI Methodology */}
      <section className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            Central Pollution Control Board (CPCB) AQI Methodology
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Published by Central Pollution Control Board, Ministry of Environment, Forest and Climate Change (Govt. of India)
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
          <div className="font-semibold text-slate-200">Piecewise Linear Sub-Index Formula:</div>
          <div className="font-mono bg-black/40 p-2.5 rounded-lg text-emerald-300 text-xs overflow-x-auto">
            I_p = [ (I_high - I_low) / (C_high - C_low) ] * (C_p - C_low) + I_low
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Where <em>C_p</em> is the pollutant concentration, <em>C_low</em> &amp; <em>C_high</em> are the breakpoint concentrations corresponding to the index range <em>I_low</em> &amp; <em>I_high</em>. The overall AQI is the maximum sub-index among monitored criteria pollutants: <code className="text-emerald-400">AQI = max(I_1, I_2, ..., I_n)</code>.
          </p>
        </div>

        {/* Breakpoints Reference Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">AQI Category</th>
                <th className="p-3">Index Range</th>
                <th className="p-3">PM2.5 (µg/m³)</th>
                <th className="p-3">PM10 (µg/m³)</th>
                <th className="p-3">NO₂ (µg/m³)</th>
                <th className="p-3">SO₂ (µg/m³)</th>
                <th className="p-3">CO (mg/m³)</th>
                <th className="p-3">O₃ (µg/m³)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              <tr className="hover:bg-slate-900/40">
                <td className="p-3 font-bold text-emerald-400">Good</td>
                <td className="p-3 font-mono text-white">0 – 50</td>
                <td className="p-3 font-mono">0 – 30</td>
                <td className="p-3 font-mono">0 – 50</td>
                <td className="p-3 font-mono">0 – 40</td>
                <td className="p-3 font-mono">0 – 40</td>
                <td className="p-3 font-mono">0 – 1.0</td>
                <td className="p-3 font-mono">0 – 50</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="p-3 font-bold text-lime-400">Satisfactory</td>
                <td className="p-3 font-mono text-white">51 – 100</td>
                <td className="p-3 font-mono">31 – 60</td>
                <td className="p-3 font-mono">51 – 100</td>
                <td className="p-3 font-mono">41 – 80</td>
                <td className="p-3 font-mono">41 – 80</td>
                <td className="p-3 font-mono">1.1 – 2.0</td>
                <td className="p-3 font-mono">51 – 100</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="p-3 font-bold text-amber-400">Moderate</td>
                <td className="p-3 font-mono text-white">101 – 200</td>
                <td className="p-3 font-mono">61 – 90</td>
                <td className="p-3 font-mono">101 – 250</td>
                <td className="p-3 font-mono">81 – 180</td>
                <td className="p-3 font-mono">81 – 380</td>
                <td className="p-3 font-mono">2.1 – 10.0</td>
                <td className="p-3 font-mono">101 – 168</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="p-3 font-bold text-orange-400">Poor</td>
                <td className="p-3 font-mono text-white">201 – 300</td>
                <td className="p-3 font-mono">91 – 120</td>
                <td className="p-3 font-mono">251 – 350</td>
                <td className="p-3 font-mono">181 – 280</td>
                <td className="p-3 font-mono">381 – 800</td>
                <td className="p-3 font-mono">10.1 – 17.0</td>
                <td className="p-3 font-mono">169 – 208</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="p-3 font-bold text-rose-400">Very Poor</td>
                <td className="p-3 font-mono text-white">301 – 400</td>
                <td className="p-3 font-mono">121 – 250</td>
                <td className="p-3 font-mono">351 – 430</td>
                <td className="p-3 font-mono">281 – 400</td>
                <td className="p-3 font-mono">801 – 1600</td>
                <td className="p-3 font-mono">17.1 – 34.0</td>
                <td className="p-3 font-mono">209 – 748</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="p-3 font-bold text-red-500">Severe</td>
                <td className="p-3 font-mono text-white">401 – 500</td>
                <td className="p-3 font-mono">251 – 500</td>
                <td className="p-3 font-mono">431 – 600</td>
                <td className="p-3 font-mono">401 – 800</td>
                <td className="p-3 font-mono">1601 – 2400</td>
                <td className="p-3 font-mono">34.1 – 50.0</td>
                <td className="p-3 font-mono">749 – 1000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Data Sources Attribution */}
      <section className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          Data Sources & Telemetry Pipeline
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="font-bold text-emerald-400">Open-Meteo Air Quality API</div>
            <p className="text-slate-300 leading-relaxed">
              Provides numerical atmospheric chemistry modeling and satellite reanalysis blending CAMS (Copernicus Atmosphere Monitoring Service) and SILAM data at 11 km grid resolution.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="font-bold text-emerald-400">Open-Meteo Weather API</div>
            <p className="text-slate-300 leading-relaxed">
              Provides real-time surface ambient temperature, relative humidity, wind speed, wind direction, and planetary boundary layer variables.
            </p>
          </div>
        </div>
      </section>

      {/* Truthfulness & Scientific Disclaimers */}
      <section className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Honest Disclosures & Scientific Guardrails
        </h2>
        <ul className="space-y-2 text-slate-300 list-disc list-inside">
          <li>
            <strong>No Hardcoded Live Data:</strong> Live measurements are fetched in real-time from open scientific APIs. When an external service is unavailable, missing fields are marked as unavailable rather than fabricating measurements.
          </li>
          <li>
            <strong>Citizen Photos Limitation:</strong> Uploaded photographs provide community evidence of emission events (e.g. burning plumes) but cannot scientifically establish numerical PM2.5 or substitute laser aerosol spectrometers.
          </li>
          <li>
            <strong>Non-Clinical Advisory:</strong> Recommendations from the AI assistant are designed for public environmental safety. They do not constitute individualized clinical diagnoses or prescriptions.
          </li>
        </ul>
      </section>
    </div>
  );
};
