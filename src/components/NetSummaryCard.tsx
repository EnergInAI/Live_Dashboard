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
  const isExport = instantNet > 0.001;
  const isImport = instantNet < -0.001;

  const netTypeText = isExport
    ? 'NET EXPORT'
    : isImport
    ? 'NET IMPORT'
    : 'BALANCED';

  const netClass = isExport
    ? 'net-export'
    : isImport
    ? 'net-import'
    : 'net-neutral';

  const netSubtext = isExport
    ? 'You are currently exporting power to the grid.'
    : isImport
    ? 'You are currently importing power from the grid.'
    : 'Power flow is balanced.';

  const netValue = Math.abs(instantNet).toFixed(3);

  return (
    <div className="card net-summary-card">
      <div className="net-summary-header">
        <div className={`net-status ${netClass}`}>
          <h2>{netTypeText}</h2>
          <h3>{netValue} kWh</h3>
          <p>{netSubtext}</p>
        </div>
        <div className="net-summary-totals">
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
