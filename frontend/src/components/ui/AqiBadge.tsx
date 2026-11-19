import React from 'react';
import type { AqiCategory } from '../../types';

interface AqiBadgeProps {
  category: AqiCategory | string;
  aqi?: number | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showNumber?: boolean;
}

export const getCategoryStyles = (category: string) => {
  switch (category.toLowerCase()) {
    case 'good':
      return {
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-400',
        border: 'border-emerald-500/40',
        dot: 'bg-emerald-400',
        label: 'Good (0-50)',
        gradient: 'from-emerald-500 to-teal-600',
      };
    case 'satisfactory':
      return {
        bg: 'bg-lime-500/15',
        text: 'text-lime-400',
        border: 'border-lime-500/40',
        dot: 'bg-lime-400',
        label: 'Satisfactory (51-100)',
        gradient: 'from-lime-500 to-green-600',
      };
    case 'moderate':
      return {
        bg: 'bg-amber-500/15',
        text: 'text-amber-400',
        border: 'border-amber-500/40',
        dot: 'bg-amber-400',
        label: 'Moderate (101-200)',
        gradient: 'from-amber-500 to-yellow-600',
      };
    case 'poor':
      return {
        bg: 'bg-orange-500/15',
        text: 'text-orange-400',
        border: 'border-orange-500/40',
        dot: 'bg-orange-400',
        label: 'Poor (201-300)',
        gradient: 'from-orange-500 to-amber-600',
      };
    case 'very poor':
      return {
        bg: 'bg-rose-500/15',
        text: 'text-rose-400',
        border: 'border-rose-500/40',
        dot: 'bg-rose-400',
        label: 'Very Poor (301-400)',
        gradient: 'from-rose-500 to-red-600',
      };
    case 'severe':
      return {
        bg: 'bg-red-950/50',
        text: 'text-red-300',
        border: 'border-red-600/60',
        dot: 'bg-red-500',
        label: 'Severe (401-500)',
        gradient: 'from-red-700 to-rose-950',
      };
    default:
      return {
        bg: 'bg-slate-700/30',
        text: 'text-slate-400',
        border: 'border-slate-600/40',
        dot: 'bg-slate-400',
        label: 'Unavailable',
        gradient: 'from-slate-600 to-slate-800',
      };
  }
};

export const AqiBadge: React.FC<AqiBadgeProps> = ({
  category,
  aqi,
  size = 'md',
  showNumber = false,
}) => {
  const styles = getCategoryStyles(category);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5 font-semibold',
    xl: 'text-lg px-5 py-2 font-bold',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${styles.bg} ${styles.text} ${styles.border} ${sizeClasses} backdrop-blur-sm transition-all`}
    >
      <span className={`w-2 h-2 rounded-full ${styles.dot} animate-pulse`} />
      <span>{category}</span>
      {showNumber && aqi !== undefined && aqi !== null && (
        <span className="font-mono ml-1 px-1.5 py-0.2 rounded bg-black/30 text-xs">
          AQI {Math.round(aqi)}
        </span>
      )}
    </span>
  );
};
