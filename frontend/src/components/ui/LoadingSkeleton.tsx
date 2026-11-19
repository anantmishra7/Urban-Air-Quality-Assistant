import React from 'react';

export const LoadingSkeleton: React.FC<{ className?: string }> = ({ className = 'h-6 w-full' }) => {
  return (
    <div
      className={`animate-pulse bg-slate-800/60 rounded-lg ${className}`}
      role="status"
      aria-label="Loading content..."
    />
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 bg-slate-800/50 rounded-xl w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-64 bg-slate-800/40 rounded-2xl md:col-span-1" />
        <div className="h-64 bg-slate-800/40 rounded-2xl md:col-span-2" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 bg-slate-800/30 rounded-xl" />
        ))}
      </div>
      <div className="h-72 bg-slate-800/30 rounded-2xl" />
    </div>
  );
};
