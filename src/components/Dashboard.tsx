import React, { useEffect, useState, useRef } from 'react';
import userMap from '../userMap';
import AccessDenied from './AccessDenied';
import NetSummaryCard from './NetSummaryCard';
import '../styles/Dashboard.css';
import { updateTotals, getTotals } from '../utils/solarAgg';

interface EnergyPayload {
  [key: string]: number | string | null;
  timestamp: string;
}

const Dashboard: React.FC = () => {
  const queryParams = new URLSearchParams(window.location.search);
  const urlDeviceId = queryParams.get('deviceId');
  const urlToken = queryParams.get('token');

  const [deviceId, setDeviceId] = useState<string | null>(
    urlDeviceId || localStorage.getItem('deviceId')
  );
  const [token, setToken] = useState<string | null>(
    urlToken || localStorage.getItem('token')
  );
  const [data, setData] = useState<EnergyPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [username, setUsername] = useState<string>('Guest User');

  const [dailyNet, setDailyNet] = useState<number>(0);
  const [totalConsumed, setTotalConsumed] = useState<number>(0);
  const [totalGenerated, setTotalGenerated] = useState<number>(0);

  const lastTimestampRef = useRef<string | null>(null);

  // Persist URL params in localStorage
  useEffect(() => {
    if (urlDeviceId) {
      localStorage.setItem('deviceId', urlDeviceId);
      setDeviceId(urlDeviceId);
    }
    if (urlToken) {
      localStorage.setItem('token', urlToken);
      setToken(urlToken);
    }
  }, [urlDeviceId, urlToken]);

  // Access validation using userMap
  useEffect(() => {
    if (!deviceId || !token) {
      setAccessDenied(true);
      return;
    }
    const entry = userMap[deviceId];
    if (!entry || entry.token !== token) {
      setAccessDenied(true);
      return;
    }
    setUsername(entry.name);
    setAccessDenied(false);
  }, [deviceId, token]);

  // Fetch latest readings every 10s and update daily totals
  useEffect(() => {
    if (!deviceId || accessDenied) return;

    const fetchData = async () => {
      try {
        const url = `https://lqqhlwp62i.execute-api.ap-south-1.amazonaws.com/prod_v1/devicedata?deviceId=${deviceId}&limit=1&_ts=${Date.now()}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const responseData = await res.json();

        if (!Array.isArray(responseData) || responseData.length === 0) {
          setError('No data received from API');
          setLoading(false);
          return;
        }

        const latestData = responseData[0] as EnergyPayload;
        const newTimestamp = latestData.timestamp;
        const prevTimestamp = lastTimestampRef.current;

        // update only if new data
        if (!prevTimestamp || new Date(newTimestamp).getTime() > new Date(prevTimestamp).getTime()) {
          lastTimestampRef.current = newTimestamp;
          setData(latestData);

          const prefix = deviceId.slice(0, 4).toUpperCase();
          if (prefix === 'ENSN' || prefix === 'ENTN') {
            const currentGen =
              (latestData as any)?.Generation_kWh ?? (latestData as any)?.GN?.kWh ?? 0;
            const currentCons =
              (latestData as any)?.Consumption_kWh ?? (latestData as any)?.CN?.kWh ?? 0;

            // Update daily totals in aggregator
            updateTotals(deviceId, {
              Generation_kWh: currentGen,
              Consumption_kWh: currentCons,
            });

            const totals = getTotals(deviceId);
            setDailyNet(totals.net);
            setTotalConsumed(totals.totalConsumed);
            setTotalGenerated(totals.totalGenerated);
          }
        }

        setLoading(false);
      } catch (err: any) {
        console.error('❌ Fetch error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [deviceId, accessDenied]);

  if (accessDenied) return <AccessDenied />;
  if (error) return <div className="error"><h3>{error}</h3></div>;
  if (loading)
    return (
      <div className="loading">
        Loading data for device: <strong>{deviceId}</strong>...
      </div>
    );
  if (!data) return <div className="no-data">No data available</div>;

  const prefix = deviceId?.slice(0, 4)?.toUpperCase() || '';
  const isSolarDevice = prefix === 'ENSN' || prefix === 'ENTN';
  const isNonSolarDevice = prefix === 'ENSS' || prefix === 'ENTA' || prefix === 'ENSA';
  const formattedTimestamp = new Date(data.timestamp as string).toLocaleString();

  return (
    <div className="dashboard-container">
      <div className="card greeting-card">
        <div className="greeting-layout">
          <div className="greeting-logo">
            <img src="/logo.png" alt="EnergInAI" className="org-logo" />
          </div>
          <div className="greeting-info">
            <h1>Welcome, {username}</h1>
            <h3>Device ID: {deviceId}</h3>
          </div>
        </div>
      </div>

      {isSolarDevice && (
        <NetSummaryCard
          instantNet={dailyNet}
          totalConsumed={totalConsumed}
          totalGenerated={totalGenerated}
        />
      )}
      {isNonSolarDevice && <div style={{ marginBottom: '16px' }} />}

      {/* Consumption */}
      <div className="card metrics-card">
        <h2 className="section-title consumption-title">Consumption</h2>
        <div className="metrics-grid">
          <Metric label="Voltage (V)" value={data.Consumption_V} unit="V" />
          <Metric label="Current (I)" value={data.Consumption_I} unit="A" />
          <Metric label="Power (P)" value={data.Consumption_P} unit="W" />
          <Metric label="Units (kWh)" value={data.Consumption_kWh} unit="kWh" />
          <Metric label="Power Factor (PF)" value={data.Consumption_PF} />
          <Metric label="Frequency (F)" value={data.Consumption_F} unit="Hz" />
        </div>
      </div>

      {/* Generation */}
      {isSolarDevice && (
        <div className="card metrics-card">
          <h2 className="section-title generation-title">Generation</h2>
          <div className="metrics-grid">
            <Metric label="Voltage (V)" value={data.Generation_V} unit="V" />
            <Metric label="Current (I)" value={data.Generation_I} unit="A" />
            <Metric label="Power (P)" value={data.Generation_P} unit="W" />
            <Metric label="Units (kWh)" value={data.Generation_kWh} unit="kWh" />
            <Metric label="Power Factor (PF)" value={data.Generation_PF} />
            <Metric label="Frequency (F)" value={data.Generation_F} unit="Hz" />
          </div>
        </div>
      )}

      <div className="timestamp">Last updated: {formattedTimestamp}</div>
    </div>
  );
};

interface MetricProps {
  label: string;
  value: number | string | null | undefined;
  unit?: string;
}

const Metric: React.FC<MetricProps> = ({ label, value, unit }) => {
  const displayValue = value === null || value === undefined || value === '' ? '-' : value;
  return (
    <div className="metric-tile">
      <div className="metric-label">{label}</div>
      <div className="metric-value">
        {displayValue} {unit}
      </div>
    </div>
  );
};

export default Dashboard;
