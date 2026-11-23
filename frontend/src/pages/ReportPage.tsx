import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { useCity } from '../context/CityContext';
import { api } from '../api/client';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import type { CitizenReport } from '../types';

export const ReportPage: React.FC = () => {
  const { selectedCity } = useCity();
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // Form states
  const [city, setCity] = useState(selectedCity);
  const [latitude, setLatitude] = useState('28.6139');
  const [longitude, setLongitude] = useState('77.2090');
  const [category, setCategory] = useState('Construction Dust');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const categories = [
    'Construction Dust / Unpaved Roads',
    'Open Garbage / Biomass Burning',
    'Industrial Chimney Emissions',
    'Crop Stubble Burning (Agricultural)',
    'Heavy Vehicular Smog & Traffic',
    'Other Point Pollution Source',
  ];

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const data = await api.listReports();
      setReports(data);
    } catch {
      // ignore
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFormError('File too large. Maximum file size allowed is 5 MB.');
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setFormError('Invalid file format. Please upload JPG, PNG, or WebP images.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toFixed(4));
          setLongitude(pos.coords.longitude.toFixed(4));
        },
        () => {
          alert('Location access denied or unavailable.');
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);

    if (isNaN(latNum) || isNaN(lonNum)) {
      setFormError('Please enter valid numeric latitude and longitude coordinates.');
      return;
    }

    if (description.trim().length < 10) {
      setFormError('Please provide a descriptive incident summary (at least 10 characters).');
      return;
    }

    setSubmitting(true);
    try {
      let photoUrl: string | undefined = undefined;

      // Upload photo first if selected
      if (selectedFile) {
        setUploading(true);
        const uploadRes = await api.uploadPhoto(selectedFile);
        photoUrl = uploadRes.url;
        setUploading(false);
      }

      const fullDesc = `[${category}] ${description.trim()}`;
      await api.createReport({
        city: city.trim() || selectedCity,
        latitude: latNum,
        longitude: lonNum,
        description: fullDesc,
        photo_path: photoUrl,
      });

      setFormSuccess('Report successfully submitted! Our community moderators will review it.');
      setDescription('');
      setSelectedFile(null);
      setFilePreview(null);
      fetchReports();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Top Header */}
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-400" />
          Citizen Air Pollution Reporting Portal
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Crowdsource hyper-local pollution observations, stubble burning, and industrial smoke to empower municipal action.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Incident Submission Form (5 cols) */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-6 border border-slate-800 space-y-5 shadow-2xl">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Log Pollution Incident</h2>
              <p className="text-[11px] text-slate-400">Validated report with photo evidence</p>
            </div>
          </div>

          {formSuccess && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{formSuccess}</span>
            </div>
          )}

          {formError && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* City */}
            <div>
              <label htmlFor="report-city" className="block text-slate-300 font-semibold mb-1">City / Municipality</label>
              <input
                id="report-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="report-lat" className="block text-slate-300 font-semibold mb-1">Latitude</label>
                <input
                  id="report-lat"
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label htmlFor="report-lon" className="block text-slate-300 font-semibold mb-1">Longitude</label>
                <input
                  id="report-lon"
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleUseMyLocation}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <MapPin className="w-3 h-3" />
              Use Current Device Coordinates
            </button>

            {/* Category */}
            <div>
              <label htmlFor="report-category" className="block text-slate-300 font-semibold mb-1">Pollution Category</label>
              <select
                id="report-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="report-description" className="block text-slate-300 font-semibold mb-1">
                Description & Observations
              </label>
              <textarea
                id="report-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                placeholder="Describe visible smoke plume, smell, duration, exact landmark..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label htmlFor="report-photo" className="block text-slate-300 font-semibold mb-1">
                Supporting Photo (Max 5 MB &bull; JPG, PNG, WebP)
              </label>
              <div className="border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-xl p-3 text-center transition-colors">
                {filePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={filePreview}
                      alt="Upload preview"
                      className="h-28 rounded-lg object-cover mx-auto"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview(null);
                      }}
                      className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 text-[10px]"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <label htmlFor="report-photo" className="cursor-pointer block">
                    <ImageIcon className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                    <span className="text-slate-300 font-medium">Click to upload photo evidence</span>
                    <span className="block text-[10px] text-slate-400">JPG, PNG, WebP up to 5MB</span>
                    <input
                      id="report-photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Scientific Truthfulness Disclaimer */}
            <div className="p-2.5 rounded-lg bg-slate-950 text-[10px] text-slate-400 flex items-start gap-1.5 border border-slate-800">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Scientific Disclaimer: Photographic evidence cannot determine quantitative PM2.5 or substitute calibrated environmental sensors. Photos provide spatial corroboration for ground response teams.
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting || uploading}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              {submitting || uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{uploading ? 'Uploading Photo...' : 'Submitting Report...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Incident Report</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Public Incident Feed (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Community Reported Incidents
              </h2>
              <p className="text-xs text-slate-400">Live feed of verified citizen reports</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
              {reports.length} Total Reports
            </span>
          </div>

          {loadingReports ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <LoadingSkeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl text-center text-slate-400 text-xs">
              No pollution incidents have been logged yet. Be the first citizen to report in your neighborhood!
            </div>
          ) : (
            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
              {reports.map((r) => {
                const statusStyles = {
                  submitted: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                  under_review: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                  verified: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                }[r.status] || 'bg-slate-800 text-slate-300';

                return (
                  <div
                    key={r.id}
                    className="glass-card rounded-2xl p-4 border border-slate-800/80 bg-slate-900/60 flex flex-col sm:flex-row gap-4 justify-between"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-white">{r.city}</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase font-bold ${statusStyles}`}
                        >
                          {r.status.replace('_', ' ')}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{r.description}</p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                        <span className="font-mono text-slate-400">
                          {r.latitude.toFixed(3)}°N, {r.longitude.toFixed(3)}°E
                        </span>
                        <span>&bull;</span>
                        <span>{new Date(r.created_at).toLocaleString()}</span>
                      </div>
                    </div>

                    {r.photo_path && (
                      <div className="shrink-0 self-start sm:self-center">
                        <a
                          href={r.photo_path}
                          target="_blank"
                          rel="noreferrer"
                          className="block relative group overflow-hidden rounded-xl border border-slate-700 w-24 h-24"
                        >
                          <img
                            src={r.photo_path}
                            alt="Pollution evidence"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-semibold transition-opacity">
                            View Full
                          </div>
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
