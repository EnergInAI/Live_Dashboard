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
  const isExporting = instantNet > 0.001;
  const isImporting = instantNet < -0.001;

  const headingClass = isExporting ? 'export' : isImporting ? 'import' : 'neutral';

  const directionText = isExporting ? 'Net Exporting' : isImporting ? 'Net Importing' : 'Balanced';

  const comment = isExporting
    ? 'Excess generation sent to grid'
    : isImporting
    ? 'Drawing energy from grid'
    : 'Perfect balance between load and generation';

  return (
    <div className="net-summary-card">
      <div className="net-card-left">
        <h2 className={`net-heading ${headingClass}`}>{directionText}</h2>
        <div className="net-value">{Math.abs(instantNet).toFixed(3)} kWh</div>
        <div className="net-comment">{comment}</div>
      </div>

      <div className="net-card-right">
        <div className="net-totals">
          <div className="total-line">
            <span className="total-label orange-text">Total Import Today</span>
            <span className="total-value">{totalImport.toFixed(3)} kWh</span>
          </div>
          <div className="total-line">
            <span className="total-label green-text">Total Export Today</span>
            <span className="total-value">{totalExport.toFixed(3)} kWh</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetSummaryCard;
