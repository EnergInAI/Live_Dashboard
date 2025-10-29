import React, { useEffect, useState } from 'react';
import userMap from '../userMap';
import './Dashboard.css';

interface EnergyPayload {
  Consumption_F: number;
  Generation_F: number;
  Consumption_I: number;
  Consumption_PF: number;
  Consumption_P: number;
  Consumption_V: number;
  Consumption_kWh: number;
  Generation_V: number;
  Generation_kWh: number;
  Generation_P: number;
  Generation_PF: number;
  Generation_I: number;
  timestamp: string;
}

const Dashboard: React.FC = () => {
  const queryParams = new URLSearchParams(window.location.search);
  const deviceId = queryParams.get('deviceId') || '';

  const [username, setUsername] = useState('Guest User');
  const [data, setData] = useState<EnergyPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deviceId) {
      setError('Device ID not provided in URL');
      setLoading(false);
      return;
    }
    setUsername(userMap[deviceId] ?? 'Unknown User');

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
        setData(responseData[0].payload);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [deviceId]);

  if (error) return <div className="error">{error}</div>;
  if (loading) return <div className="loading">Loading data for device: {deviceId}...</div>;
  if (!data) return <div className="no-data">No data available</div>;

  return (
    <div className="dashboard-container">
      {/* Greeting Section */}

<div className="card greeting-card">
  <div className="greeting-layout">
    <div className="greeting-logo">
      <img
        src={`${process.env.PUBLIC_URL}/logo.svg`}
        alt="Organization Logo"
        className="org-logo"
      />
    </div>
    <div className="greeting-info">
      <h1>Welcome, {username}</h1>
      <h3>Device ID: {deviceId}</h3>
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

      <div className="timestamp">Last updated: {data.timestamp}</div>
    </div>
  );
};

interface MetricProps {
  label: string;
  value: number;
  unit?: string;
}

const Metric: React.FC<MetricProps> = ({ label, value, unit }) => (
  <div className="metric-tile">
    <div className="metric-label">{label}</div>
    <div className="metric-value">
      {value} {unit}
    </div>
  </div>
);

export default Dashboard;
