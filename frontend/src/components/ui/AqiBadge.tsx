import React from 'react';
import type { AqiCategory } from '../../types';
import { getCategoryStyles } from '../../utils/aqiStyles';

interface AqiBadgeProps {
  category: AqiCategory | string;
  aqi?: number | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showNumber?: boolean;
}

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
