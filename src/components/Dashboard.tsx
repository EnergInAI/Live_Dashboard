import React, { useEffect, useState, useRef } from 'react';
import userMap from '../userMap';
import AccessDenied from './AccessDenied';
import NetSummaryCard from './NetSummaryCard';
import '../styles/Dashboard.css';

interface EnergyPayload {
  [key: string]: any; // Using 'any' for simplicity with nested data
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
  const lastTimestampRef = useRef<string | null>(null);

  useEffect(() => {
    if (urlDeviceId) localStorage.setItem('deviceId', urlDeviceId);
    if (urlToken) localStorage.setItem('token', urlToken);
    setDeviceId(urlDeviceId || localStorage.getItem('deviceId'));
    setToken(urlToken || localStorage.getItem('token'));
  }, [urlDeviceId, urlToken]);

  useEffect(() => {
    if (!deviceId || !token) {
      setAccessDenied(true);
      return;
    }
    const deviceEntry = userMap[deviceId];
    if (!deviceEntry || deviceEntry.token !== token) {
      setAccessDenied(true);
      return;
    }
    setUsername(deviceEntry.name);
    setAccessDenied(false);
  }, [deviceId, token]);

  useEffect(() => {
    if (!deviceId || accessDenied) return;

    const fetchData = async () => {
      try {
        const url = `https://lqqhlwp62i.execute-api.ap-south-1.amazonaws.com/prod_v1/devicedata?deviceId=${deviceId}&limit=1&_ts=${Date.now()}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`API error: ${res.status} ${await res.text()}`);
        
        const responseData = await res.json();
        if (!Array.isArray(responseData) || responseData.length === 0) {
          setError('No data received');
          return;
        }

        const latestData = responseData[0] as EnergyPayload;
        if (!lastTimestampRef.current || new Date(latestData.timestamp).getTime() > new Date(lastTimestampRef.current).getTime()) {
          lastTimestampRef.current = latestData.timestamp;
          setData(latestData);
        }
      } catch (err: any) {
        console.error('❌ Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [deviceId, accessDenied]);

  if (accessDenied) return <AccessDenied />;
  if (error) return <div className="error"><h3>{error}</h3></div>;
  if (loading) return <div className="loading">Loading...</div>;
  if (!data) return <div className="no-data">No data available.</div>;

  const isSolarDevice = (deviceId?.slice(0, 4)?.toUpperCase() || '') === 'ENSN' || (deviceId?.slice(0, 4)?.toUpperCase() || '') === 'ENTN';
  const formattedTimestamp = new Date(data.timestamp).toLocaleString();

  // Directly calculate all values from the live 'data' object
  const totalConsumed = data?.Consumption_kWh ?? data?.CN?.kWh ?? 0;
  const totalGenerated = data?.Generation_kWh ?? data?.GN?.kWh ?? 0;
  const netEnergy = totalGenerated - totalConsumed;

  return (
    <div className="dashboard-container">
      <div className="card greeting-card">
        <h1>Welcome, {username}</h1>
        <h3>Device ID: {deviceId}</h3>
      </div>

      {isSolarDevice && (
        <NetSummaryCard
          netEnergy={netEnergy}
          totalConsumed={totalConsumed}
          totalGenerated={totalGenerated}
        />
      )}

      <div className="card metrics-card">
        <h2 className="section-title consumption-title">Consumption</h2>
        <div className="metrics-grid">
          <Metric label="Voltage (V)" value={data.Consumption_V ?? data?.CN?.V} unit="V" />
          <Metric label="Current (I)" value={data.Consumption_I ?? data?.CN?.I} unit="A" />
          <Metric label="Power (P)" value={data.Consumption_P ?? data?.CN?.P} unit="W" />
          <Metric label="Units (kWh)" value={data.Consumption_kWh ?? data?.CN?.kWh} unit="kWh" />
          <Metric label="Power Factor (PF)" value={data.Consumption_PF ?? data?.CN?.PF} />
          <Metric label="Frequency (F)" value={data.Consumption_F ?? data?.CN?.F} unit="Hz" />
        </div>
      </div>

      {isSolarDevice && (
        <div className="card metrics-card">
          <h2 className="section-title generation-title">Generation</h2>
          <div className="metrics-grid">
            <Metric label="Voltage (V)" value={data.Generation_V ?? data?.GN?.V} unit="V" />
            <Metric label="Current (I)" value={data.Generation_I ?? data?.GN?.I} unit="A" />
            <Metric label="Power (P)" value={data.Generation_P ?? data?.GN?.P} unit="W" />
            <Metric label="Units (kWh)" value={data.Generation_kWh ?? data?.GN?.kWh} unit="kWh" />
            <Metric label="Power Factor (PF)" value={data.Generation_PF ?? data?.GN?.PF} />
            <Metric label="Frequency (F)" value={data.Generation_F ?? data?.GN?.F} unit="Hz" />
          </div>
        </div>
      )}
      
      <div className="timestamp">Last updated: {formattedTimestamp}</div>
    </div>
  );
};

const Metric: React.FC<{ label: string; value: any; unit?: string; }> = ({ label, value, unit }) => (
  <div className="metric-tile">
    <div className="metric-label">{label}</div>
    <div className="metric-value">{(value ?? '-') as any} {unit}</div>
  </div>
);

export default Dashboard;
