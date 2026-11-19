import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number | null | undefined;
  unit?: string;
  subValue?: string;
  statusColor?: string;
  icon?: React.ReactNode;
  infoTooltip?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  subValue,
  statusColor = 'text-slate-100',
  icon,
  infoTooltip,
}) => {
  const displayVal = value !== null && value !== undefined ? value : 'N/A';

  return (
    <div className="glass-card rounded-xl p-4 transition-all duration-200 border border-slate-800/80 hover:border-slate-700 bg-slate-900/60 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between text-slate-400 mb-2">
        <span className="text-xs font-medium tracking-wide uppercase">{label}</span>
        {icon && <div className="text-slate-400/80">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className={`text-2xl font-bold tracking-tight font-mono ${statusColor}`}>
          {displayVal}
        </span>
        {unit && value !== null && value !== undefined && (
          <span className="text-xs text-slate-400 font-sans font-medium">{unit}</span>
        )}
      </div>

      {subValue && (
        <div className="mt-1 text-xs text-slate-400 truncate" title={subValue}>
          {subValue}
        </div>
      )}

      {infoTooltip && (
        <div className="mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-500 leading-tight">
          {infoTooltip}
        </div>
      )}
    </div>
  );
};
