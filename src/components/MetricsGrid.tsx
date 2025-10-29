import React from 'react';
import MetricCard from './MetricCard';

interface MetricsGridProps {
  metrics: Record<string, number>;
}

const units: Record<string, string> = {
  F: 'Hz',
  I: 'A',
  PF: '',
  P: 'W',
  V: 'V',
  kWh: 'kWh',
};

const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Object.entries(metrics).map(([key, value]) => (
        <MetricCard key={key} label={key} value={value} unit={units[key] || ''} />
      ))}
    </div>
  );
};

export default MetricsGrid;
