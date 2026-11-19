import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Data Temporarily Unavailable',
  message = 'We could not fetch live air quality data. Please check your connection or try another city.',
  onRetry,
  compact = false,
}) => {
  if (compact) {
    return (
      <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-lg text-rose-300 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{message}</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="p-1 hover:bg-rose-900/40 rounded transition-colors text-rose-200"
            title="Retry"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-8 text-center max-w-lg mx-auto my-8 border border-rose-800/30 bg-slate-900/80 shadow-2xl">
      <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-100 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 mb-6 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-sm transition-all shadow-md hover:shadow-lg hover:border-slate-600 border border-slate-700"
        >
          <RefreshCw className="w-4 h-4 text-emerald-400" />
          Try Again
        </button>
      )}
    </div>
  );
};
