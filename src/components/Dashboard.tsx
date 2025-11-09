import React, { useEffect, useState, useRef } from 'react';
import userMap from '../userMap';
import AccessDenied from './AccessDenied';
import NetSummaryCard from './NetSummaryCard';
import '../styles/Dashboard.css';
import { updateTotals } from '../utils/solarAgg'; // <-- only import updateTotals if getTotals unused

interface EnergyPayload {
  latestGeneration_kWh: number;
  latestConsumption_kWh: number;
  timestamp: string;
  [key: string]: number | string | null;
}

const Dashboard: React.FC = () => {
  const [instantNet, setInstantNet] = useState<number>(0);
  const [totalImport, setTotalImport] = useState<number>(0);
  const [totalExport, setTotalExport] = useState<number>(0);
  const [totalGenerated, setTotalGenerated] = useState<number>(0);
  const [totalConsumed, setTotalConsumed] = useState<number>(0);
  const [hasAccess, setHasAccess] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLatestData = async (): Promise<EnergyPayload | null> => {
    try {
      const response = await fetch('/api/latest-energy');
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Failed to fetch energy data:', err);
      return null;
    }
  };

  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      const initial = await fetchLatestData();
      if (initial) {
        const { instantNet, totalImport, totalExport, totalGenerated, totalConsumed } =
          updateTotals(
            Number(initial.latestGeneration_kWh),
            Number(initial.latestConsumption_kWh),
            initial.timestamp
          );

        setInstantNet(instantNet);
        setTotalImport(totalImport);
        setTotalExport(totalExport);
        setTotalGenerated(totalGenerated);
        setTotalConsumed(totalConsumed);
        setLastUpdated(initial.timestamp);
      }
      setLoading(false);
    };

    loadInitial();

    intervalRef.current = setInterval(async () => {
      const latest = await fetchLatestData();
      if (!latest) return;

      const { instantNet, totalImport, totalExport, totalGenerated, totalConsumed } =
        updateTotals(
          Number(latest.latestGeneration_kWh),
          Number(latest.latestConsumption_kWh),
          latest.timestamp
        );

      setInstantNet(instantNet);
      setTotalImport(totalImport);
      setTotalExport(totalExport);
      setTotalGenerated(totalGenerated);
      setTotalConsumed(totalConsumed);
      setLastUpdated(latest.timestamp);
    }, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    const currentUserId = localStorage.getItem('userId');
    const userHasAccess = currentUserId && Object.prototype.hasOwnProperty.call(userMap, currentUserId);
    setHasAccess(!!userHasAccess);
  }, []);

  if (!hasAccess) return <AccessDenied />;
  if (loading) return <div className="loading">Loading Dashboard...</div>;

  return (
    <div className="dashboard-container">
      {/* ... greeting etc unchanged ... */}

      <NetSummaryCard
        instantNet={instantNet}
        totalImport={totalImport}
        totalExport={totalExport}
      />

      {/* ... rest of dashboard unchanged ... */}
    </div>
  );
};

export default Dashboard;
