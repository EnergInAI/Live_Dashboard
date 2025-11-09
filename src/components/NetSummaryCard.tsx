import React from 'react';
import '../styles/NetSummaryCard.css';

interface NetSummaryCardProps {
  instantNet: number;
  totalImport: number;
  totalExport: number;
}

const NetSummaryCard: React.FC<NetSummaryCardProps> = ({
  instantNet,
  totalImport,
  totalExport,
}) => {
  const isImport = instantNet < -0.001;
  const isExport = instantNet > 0.001;
  const isNeutral = !isImport && !isExport;

  const netText = isImport
    ? 'Importing from Grid'
    : isExport
    ? 'Exporting to Grid'
    : 'Balanced';

  const netClass = isImport
    ? 'net-import'
    : isExport
    ? 'net-export'
    : 'net-neutral';

  const netValue = Math.abs(instantNet).toFixed(3);

  return (
    <div className="card net-summary-card">
      <h2 className="section-title">Net Energy Flow</h2>
      <div className="net-summary-content">
        <div className={`net-value ${netClass}`}>
          {netValue} kWh
          <span className="net-status-text"> ({netText})</span>
        </div>
        <div className="net-totals">
          <div className="net-total">
            <div className="label">Total Import Today</div>
            <div className="value">{totalImport.toFixed(3)} kWh</div>
          </div>
          <div className="net-total">
            <div className="label">Total Export Today</div>
            <div className="value">{totalExport.toFixed(3)} kWh</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetSummaryCard;
