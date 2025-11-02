import React, { useEffect, useState } from 'react';
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
  const [data, setData] = useState<EnergyPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [username, setUsername] = useState<string>('Guest User');

  // For net totals (used in NetSummaryCard)
  const [totals, setTotals] = useState({
    net: 0,
    netType: '',
    totalConsumed: 0,
    totalGenerated: 0,
  });

  // Store deviceId in localStorage if available
  useEffect(() => {
    if (urlDeviceId) {
      localStorage.setItem('deviceId', urlDeviceId);
      setDeviceId(urlDeviceId);
    }
  }, [urlDeviceId]);

  // Validate access based on userMap
  useEffect(() => {
    if (!deviceId || !urlToken) {
      setAccessDenied(true);
      return;
    }

    const deviceEntry = userMap[deviceId];
    if (!deviceEntry || deviceEntry.token !== urlToken) {
      setAccessDenied(true);
      return;
    }

    setUsername(deviceEntry.name);
  }, [deviceId, urlToken]);

  // Fetch latest device data
  useEffect(() => {
    if (!deviceId || accessDenied) return;

    fetch(
      `https://lqqhlwp62i.execute-api.ap-south-1.amazonaws.com/prod_v1/devicedata?deviceId=${deviceId}&limit=1`
    )
      .then(async (res) => {
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`API error: ${res.status} ${errText}`);
        }
        return res.json();
      })
      .then((responseData) => {
        if (!Array.isArray(responseData) || responseData.length === 0) {
          setError('No data received from API');
          setLoading(false);
          return;
        }

        const latestData = responseData[0];
        setData(latestData);
        setLoading(false);

        const prefix = deviceId.slice(0, 4).toUpperCase();
        if (prefix === 'ENSN' || prefix === 'ENTN') {
          updateTotals(deviceId, latestData);
          setTotals(getTotals(deviceId));
        }
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [deviceId, accessDenied]);

  // UI States
  if (accessDenied) return <AccessDenied />;
  if (error) return <div className="error"><h3>{error}</h3></div>;
  if (loading) return <div className="loading">Loading data for device: <strong>{deviceId}</strong>...</div>;
  if (!data) return <div className="no-data">No data available</div>;

  // Device type
  const prefix = deviceId?.slice(0, 4)?.toUpperCase() || '';
  const isSolarDevice = prefix === 'ENSN' || prefix === 'ENTN';
  const isNonSolarDevice = prefix === 'ENSS' || prefix === 'ENTA';
  const formattedTimestamp = new Date(data.timestamp as string).toLocaleString();

  return (
    <div className="dashboard-container">
      {/* Greeting Card */}
      <div className="card greeting-card">
        <div className="greeting-layout">
          <div className="greeting-logo">
            <img src="/logo.png" alt="EnergInAI" className="org-logo" />
          </div>
          <div className="greeting-info">
            {isSolarDevice ? (
              <>
                <h1>Welcome, {username}</h1>
                <h3>Device ID: {deviceId}</h3>
              </>
            ) : (
              <>
                <h1>Welcome to your dashboard</h1>
                <h3>Monitor your devices right from your phone.</h3>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ✅ New Net Summary Card — visible only for Solar Devices */}
      {isSolarDevice && (
        <NetSummaryCard
          netEnergy={totals.net}
          totalConsumed={totals.totalConsumed}
          totalGenerated={totals.totalGenerated}
        />
      )}

      {/* Consumption Section */}
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

      {/* Generation Section (Solar only) */}
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

// Metric Component
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
