import React from 'react';
import '../styles/NetSummaryCard.css';

interface NetSummaryCardProps {
  netEnergy: number;       // instantaneous net (last reading window)
  totalImport: number;     // daily import accumulation
  totalExport: number;     // daily export accumulation
  lastUpdated?: string;
}

const NetSummaryCard: React.FC<NetSummaryCardProps> = ({
  netEnergy,
  totalImport,
  totalExport,
  lastUpdated,
}) => {
  const isExporting = netEnergy > 0;
  const isImporting = netEnergy < 0;

  const netLabel = isExporting ? 'NET EXPORT' : isImporting ? 'NET IMPORT' : 'BALANCED';
  const netArrow = isExporting ? '↑' : isImporting ? '↓' : '↔';

  const statusClass = isExporting ? 'export' : isImporting ? 'import' : 'neutral';

  return (
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
          <div className="total-label">Total Import Today</div>
          <div className="total-value">{totalImport.toFixed(2)} kWh</div>
        </div>
        <div className="total-item">
          <div className="total-label">Total Export Today</div>
          <div className="total-value">{totalExport.toFixed(2)} kWh</div>
        </div>
      </div>
    </div>
  );
};

export default NetSummaryCard;
