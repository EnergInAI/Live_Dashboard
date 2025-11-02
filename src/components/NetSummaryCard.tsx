import React from 'react';
import './Dashboard.css'; // Reuse your existing styles for colors, cards, fonts, etc.

interface NetSummaryCardProps {
  netEnergy: number;          // Net energy (kWh) = Generation - Consumption
  totalConsumed: number;      // Total Consumption (kWh)
  totalGenerated: number;     // Total Generation (kWh)
  lastUpdated?: string;       // Optional: timestamp string (optional display later)
}

const NetSummaryCard: React.FC<NetSummaryCardProps> = ({
  netEnergy,
  totalConsumed,
  totalGenerated,
  lastUpdated,
}) => {
  // Determine status and color scheme
  const isExporting = netEnergy > 0;
  const isImporting = netEnergy < 0;
  const netLabel = isExporting ? 'NET EXPORT' : isImporting ? 'NET IMPORT' : 'BALANCED';
  const netArrow = isExporting ? '↑' : isImporting ? '↓' : '↔';

  // Determine color class for card heading
  const statusClass = isExporting
    ? 'export'
    : isImporting
    ? 'import'
    : 'neutral';

  return (
    <div className="card net-summary-card">
      <div className="net-card-left">
        <h2 className={`net-heading ${statusClass}`}>
          {netArrow} {netLabel}
        </h2>
        <div className="net-value">
          {Math.abs(netEnergy).toFixed(2)} kWh
        </div>
        <p className="net-comment">
          {isExporting
            ? 'You are currently exporting power to the grid.'
            : isImporting
            ? 'You are currently drawing power from the grid.'
            : 'Your generation and consumption are balanced.'}
        </p>
      </div>

      <div className="net-card-right">
        <div className="net-totals">
          <div className="total-line">
            <span className="total-label orange-text">Total Consumed</span>
            <span className="total-value">{totalConsumed.toFixed(2)} kWh</span>
          </div>
          <div className="total-line">
            <span className="total-label green-text">Total Generated</span>
            <span className="total-value">{totalGenerated.toFixed(2)} kWh</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetSummaryCard;
