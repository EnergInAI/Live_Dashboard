import React from 'react';
import '../styles/NetSummaryCard.css';

interface NetSummaryCardProps {
  instantNet: number;      // Real-time net (Generation - Consumption)
  totalImport: number;     // Daily cumulative import from grid (kWh)
  totalExport: number;     // Daily cumulative export to grid (kWh)
  lastUpdated?: string;    // Timestamp of latest reading
}

const NetSummaryCard: React.FC<NetSummaryCardProps> = ({
  instantNet,
  totalImport,
  totalExport,
  lastUpdated,
}) => {
  // Determine current energy flow status
  const isExporting = instantNet > 0;
  const isImporting = instantNet < 0;
  const isBalanced = Math.abs(instantNet) < 0.01; // Within 10W threshold

  const netLabel = isBalanced
    ? 'BALANCED'
    : isExporting
    ? 'NET EXPORT'
    : 'NET IMPORT';

  const netArrow = isBalanced ? '↔' : isExporting ? '↑' : '↓';

  // Determine color class for card styling
  const statusClass = isBalanced
    ? 'neutral'
    : isExporting
    ? 'export'
    : 'import';

  // Status message
  const statusMessage = isBalanced
    ? 'Your generation and consumption are currently balanced.'
    : isExporting
    ? 'You are currently exporting power to the grid.'
    : 'You are currently drawing power from the grid.';

  return (
    <div className={`net-summary-card ${statusClass}`}>
      <div className="net-header">
        <h3 className={statusClass}>
          {netArrow} {netLabel}
        </h3>
      </div>

      <div className="instant-net">
        <div className="net-value">
          {Math.abs(instantNet).toFixed(3)} kWh
        </div>
        <div className="net-description">{statusMessage}</div>
      </div>

      <div className="daily-totals">
        <div className="total-card import-card">
          <div className="total-label">Total Import Today</div>
          <div className="total-value">{totalImport.toFixed(2)} kWh</div>
        </div>

        <div className="total-card export-card">
          <div className="total-label">Total Export Today</div>
          <div className="total-value">{totalExport.toFixed(2)} kWh</div>
        </div>
      </div>
    </div>
  );
};

export default NetSummaryCard;
