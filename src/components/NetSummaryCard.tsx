import React from 'react';
import '../styles/NetSummaryCard.css';

interface NetSummaryCardProps {
  instantNet: number;
  totalConsumed: number;
  totalGenerated: number;
}

const NetSummaryCard: React.FC<NetSummaryCardProps> = ({
  instantNet,
  totalConsumed,
  totalGenerated,
}) => {
  const isExport = instantNet > 0.001;
  const isImport = instantNet < -0.001;

  const netType = isExport ? 'export' : isImport ? 'import' : 'neutral';
  const headingText = isExport
    ? 'NET EXPORT'
    : isImport
    ? 'NET IMPORT'
    : 'BALANCED';
  const commentText = isExport
    ? 'You have exported power to the grid.'
    : isImport
    ? 'You have imported power from the grid.'
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
            <div className="total-label orange-text">Total Consumption Today</div>
            <div className="total-value">{totalConsumed.toFixed(3)} kWh</div>
          </div>
          <div className="total-line">
            <div className="total-label green-text">Total Generation Today</div>
            <div className="total-value">{totalGenerated.toFixed(3)} kWh</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetSummaryCard;
