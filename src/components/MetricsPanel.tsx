import React from 'react';
import MetricsGrid from './MetricsGrid';

interface MetricsPanelProps {
  title: string;
  color: 'blue' | 'green';
  metrics: Record<string, number>;
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({ title, color, metrics }) => {
  const colorMap = {
    blue: 'border-blue-500 text-blue-600',
    green: 'border-green-500 text-green-600',
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6 w-full max-w-3xl mb-6">
      <h2
        className={`text-xl font-semibold border-b-2 pb-2 mb-4 ${
          colorMap[color]
        }`}
      >
        {title}
      </h2>
      <MetricsGrid metrics={metrics} />
    </div>
  );
};

export default MetricsPanel;
