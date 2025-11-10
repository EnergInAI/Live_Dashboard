import React from 'react';
import '../styles/NetSummaryCard.css';

interface NetSummaryCardProps {
  netEnergy: number;       // This will be the daily accumulating net value
  totalConsumed: number;   // This is the total consumption for the day
  totalGenerated: number;  // This is the total generation for the day
  lastUpdated?: string;
}

const NetSummaryCard: React.FC<NetSummaryCardProps> = ({
  netEnergy,
  totalConsumed,
  totalGenerated,
  lastUpdated,
}) => {
  // Logic for status (import/export/balanced) remains the same
  const isExporting = netEnergy > 0;
  const isImporting = netEnergy < 0;

  const netLabel = isExporting ? 'NET EXPORT' : isImporting ? 'NET IMPORT' : 'BALANCED';
  const netArrow = isExporting ? '↑' : isImporting ? '↓' : '↔';
  const statusClass = isExporting ? 'export' : isImporting ? 'import' : 'neutral';

  return (
    // The JSX structure and class names are identical to your original file
    <div className={`net-summary-card ${statusClass}`}>
      <h3 className={`net-heading ${statusClass}`}>
        {netArrow} {netLabel}
      </h3>
      <div className="net-value">
        {Math.abs(netEnergy).toFixed(2)} kWh
      </div>
      <p className="net-description">
        {isExporting
          ? 'You are currently exporting power to the grid.'
          : isImporting
          ? 'You are currently drawing power from the grid.'
          : 'Your generation and consumption are balanced.'}
      </p>
      <div className="totals-section">
        <div className="total-item">
          <div className="total-label">Total Consumption Today</div>
          <div className="total-value">{totalConsumed.toFixed(2)} kWh</div>
        </div>
        <div className="total-item">
          <div className="total-label">Total Generation Today</div>
          <div className="total-value">{totalGenerated.toFixed(2)} kWh</div>
        </div>
      </div>
    </div>
  );
};

export default NetSummaryCard;
