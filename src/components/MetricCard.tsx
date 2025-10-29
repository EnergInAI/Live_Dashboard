import React from 'react';

interface MetricCardProps {
  label: string;
  value: number;
  unit?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, unit }) => {
  return (
    <div className="bg-gray-50 rounded-xl p-4 text-center shadow-sm hover:shadow-md transition">
      <div className="text-gray-500 text-sm">{label}</div>
      <div className="text-xl font-semibold text-gray-800 mt-1">
        {value} {unit}
      </div>
    </div>
  );
};

export default MetricCard;
