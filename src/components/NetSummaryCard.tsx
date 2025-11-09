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
  // const isNeutral = !isImport && !isExport;

  const netType = isExport ? 'export' : isImport ? 'import' : 'neutral';
  const headingText = isExport
    ? 'NET EXPORT'
    : isImport
    ? 'NET IMPORT'
    : 'BALANCED';
  const commentText = isExport
    ? 'You are currently exporting power to the grid.'
    : isImport
    ? 'You are currently importing power from the grid.'
    : 'Power flow is balanced.';

  const netValue = Math.abs(instantNet).toFixed(3);

  return (
    <div className="net-summary-card">
      {/* Left Section */}
      <div className="net-card-left">
        <h2 className={`net-heading ${netType}`}>
          {isExport && '↑'} {isImport && '↓'} {headingText}
        </h2>
        <div className="net-value">{netValue} kWh</div>
        <div className="net-comment">{commentText}</div>
      </div>

      {/* Right Section */}
      <div className="net-card-right">
        <div className="net-totals">
          <div className="total-line">
            <div className="total-label orange-text">Total Import Today</div>
            <div className="total-value">{totalImport.toFixed(3)} kWh</div>
          </div>
          <div className="total-line">
            <div className="total-label green-text">Total Export Today</div>
            <div className="total-value">{totalExport.toFixed(3)} kWh</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetSummaryCard;
