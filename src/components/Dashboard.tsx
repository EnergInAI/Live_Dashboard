import React, { useEffect, useState, useRef } from 'react';
import userMap from '../userMap';
import AccessDenied from './AccessDenied';
import NetSummaryCard from './NetSummaryCard';
import '../styles/Dashboard.css';
import { updateTotals } from '../utils/solarAgg';

interface EnergyPayload {
  latestGeneration_kWh: number;
  latestConsumption_kWh: number;
  timestamp: string;
  [key: string]: number | string | null;
}

const Dashboard: React.FC = () => {
  const [energyData, setEnergyData] = useState<EnergyPayload | null>(null);
  const [instantNet, setInstantNet] = useState<number>(0);
  const [totalImport, setTotalImport] = useState<number>(0);
  const [totalExport, setTotalExport] = useState<number>(0);
  const [totalGenerated, setTotalGenerated] = useState<number>(0);
  const [totalConsumed, setTotalConsumed] = useState<number>(0);
  const [hasAccess, setHasAccess] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // use number | null for browser setInterval id
  const intervalRef = useRef<number | null>(null);

  const fetchLatestData = async (): Promise<EnergyPayload | null> => {
    try {
      const response = await fetch('/api/latest-energy'); // adapt endpoint if needed
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      return data as EnergyPayload;
    } catch (err) {
      // keep error reporting minimal; acceptable in CI
      return null;
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      const initial = await fetchLatestData();
      if (initial) {
        setEnergyData(initial);

        const totals = updateTotals(
          Number(initial.latestGeneration_kWh),
          Number(initial.latestConsumption_kWh),
          initial.timestamp
        );

        setInstantNet(totals.instantNet);
        setTotalImport(totals.totalImport);
        setTotalExport(totals.totalExport);
        setTotalGenerated(totals.totalGenerated);
        setTotalConsumed(totals.totalConsumed);
        setLastUpdated(initial.timestamp);
      }
      setLoading(false);
    };

    loadInitialData();

    // Poll every 10 seconds
    intervalRef.current = window.setInterval(async () => {
      const latest = await fetchLatestData();
      if (!latest) return;

      setEnergyData(latest);

      const totals = updateTotals(
        Number(latest.latestGeneration_kWh),
        Number(latest.latestConsumption_kWh),
        latest.timestamp
      );

      setInstantNet(totals.instantNet);
      setTotalImport(totals.totalImport);
      setTotalExport(totals.totalExport);
      setTotalGenerated(totals.totalGenerated);
      setTotalConsumed(totals.totalConsumed);
      setLastUpdated(latest.timestamp);
    }, 10000);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Access check (uses userMap object)
  useEffect(() => {
    const currentUserId = localStorage.getItem('userId');
    const userHasAccess =
      !!currentUserId && Object.prototype.hasOwnProperty.call(userMap, currentUserId);
    setHasAccess(!!userHasAccess);
  }, []);

  if (!hasAccess) {
    return <AccessDenied />;
  }

  if (loading) {
    return <div className="loading">Loading Dashboard...</div>;
  }

  if (!energyData) {
    return <div className="no-data">No data available</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Greeting Section */}
      <div className="greeting-card">
        <div className="greeting-layout">
          <div className="greeting-logo">
            <img src="/logo.svg" alt="Organization Logo" className="org-logo" />
          </div>
          <div className="greeting-info">
            <h1>Welcome to your dashboard</h1>
            <h3>Monitor your devices right from your phone.</h3>
          </div>
        </div>
      </div>

      {/* Net Summary Card */}
      <NetSummaryCard
        instantNet={instantNet}
        totalImport={totalImport}
        totalExport={totalExport}
      />

      {/* Consumption Summary */}
      <div className="card">
        <h2 className="section-title consumption-title">Consumption Summary</h2>
        <div className="metrics-grid">
          <div className="metric-tile">
            <div className="metric-label">Total Consumed Today</div>
            <div className="metric-value">{totalConsumed.toFixed(3)} kWh</div>
          </div>
          <div className="metric-tile">
            <div className="metric-label">Average Load</div>
            <div className="metric-value">{(totalConsumed / 24).toFixed(2)} kW</div>
          </div>
          <div className="metric-tile">
            <div className="metric-label">Peak Usage</div>
            <div className="metric-value">{(totalConsumed * 1.2).toFixed(2)} kW</div>
          </div>
        </div>
      </div>

      {/* Generation Summary */}
      <div className="card">
        <h2 className="section-title generation-title">Generation Summary</h2>
        <div className="metrics-grid">
          <div className="metric-tile">
            <div className="metric-label">Total Generated Today</div>
            <div className="metric-value">{totalGenerated.toFixed(3)} kWh</div>
          </div>
          <div className="metric-tile">
            <div className="metric-label">System Efficiency</div>
            <div className="metric-value">
              {((totalGenerated / (totalConsumed + 0.001)) * 100).toFixed(2)}%
            </div>
          </div>
          <div className="metric-tile">
            <div className="metric-label">CO₂ Offset</div>
            <div className="metric-value">{(totalGenerated * 0.85).toFixed(2)} kg</div>
          </div>
        </div>
      </div>

      {/* Timestamp */}
      <div className="timestamp">
        Last Updated:{' '}
        {new Date(lastUpdated).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
        })}
      </div>
    </div>
  );
};

export default Dashboard;
