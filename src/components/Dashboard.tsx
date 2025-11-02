import React, { useEffect, useState } from 'react';
import userMap from '../userMap';
import AccessDenied from './AccessDenied';
import './Dashboard.css';

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

  useEffect(() => {
    if (urlDeviceId) {
      localStorage.setItem('deviceId', urlDeviceId);
      setDeviceId(urlDeviceId);
    }
  }, [urlDeviceId]);

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
        setData(responseData[0]);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [deviceId, accessDenied]);

  /* ✅ Use your AccessDenied.tsx defaults (no override message) */
  if (accessDenied) return <AccessDenied />;

  if (error)
    return (
      <div className="error">
        <h3>{error}</h3>
      </div>
    );

  if (loading)
    return (
      <div className="loading">
        Loading data for device: <strong>{deviceId}</strong>...
      </div>
    );

  if (!data) return <div className="no-data">No data available</div>;

  // Prefix-based detection
  const devicePrefix = deviceId?.slice(0, 4)?.toUpperCase() || '';
  const isSolarDevice = devicePrefix === 'ENSN' || devicePrefix === 'ENTN';
  const isNonSolarDevice = devicePrefix === 'ENSS' || devicePrefix === 'ENTA';

  const formattedTimestamp = new Date(data.timestamp as string).toLocaleString();
  const dashboardClass = isNonSolarDevice
    ? 'dashboard-container single-section'
    : 'dashboard-container';

  return (
    <div className={dashboardClass}>
      {/* Greeting Section */}
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

      {/* Consumption Metrics */}
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

      {/* Generation Metrics */}
      {isSolarDevice && (
        <div className="card metrics-card">
          <h2 className="section-title generation-title">Generation</h2>
          <div className="metrics-grid">
            <Metric label="Voltage (V)" value={data.Generation_V} unit="V" />
            <Metric label="Current (I)" value={data.Generation_I} unit="A" />
            <Metric label="Power (P)" value={data.Generation_P} unit="W" />
            <Metric
              label="Units (kWh)"
              value={data.Generation_kWh}
              unit="kWh"
            />
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
  const displayValue =
    value === null || value === undefined || value === '' ? '-' : value;
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
