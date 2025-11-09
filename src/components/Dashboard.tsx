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

  const [deviceId, setDeviceId] = useState(
    urlDeviceId || localStorage.getItem('deviceId')
  );
  const [token, setToken] = useState(
    urlToken || localStorage.getItem('token')
  );
  const [data, setData] = useState<EnergyPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [username, setUsername] = useState('Guest User');
  const [totals, setTotals] = useState({
    totalImport: 0,
    totalExport: 0,
  });

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

  // Access validation against userMap
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

  // Fetch data every 10 seconds, update totals immediately each time
  useEffect(() => {
    if (!deviceId || accessDenied) return;

    const fetchData = async () => {
      try {
        const url = `https://lqqhlwp62i.execute-api.ap-south-1.amazonaws.com/prod_v1/devicedata?deviceId=${deviceId}&limit=1&_ts=${Date.now()}`;
        const res = await fetch(url, { cache: 'no-store' });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`API error: ${res.status} ${errText}`);
        }

        const responseData = await res.json();
        if (!Array.isArray(responseData) || responseData.length === 0) {
          setError('No data received from API');
          setLoading(false);
          return;
        }

        const latestData = responseData[0] as EnergyPayload;
        const newTimestamp = latestData.timestamp;
        const prevTimestamp = lastTimestampRef.current;

        // Only update if we have newer data
        if (
          !prevTimestamp ||
          new Date(newTimestamp).getTime() > new Date(prevTimestamp).getTime()
        ) {
          lastTimestampRef.current = newTimestamp;
          setData(latestData);

          const prefix = deviceId.slice(0, 4).toUpperCase();
          if (prefix === 'ENSN' || prefix === 'ENTN') {
            // Normalize kWh for aggregator
            const normalized = {
              Consumption_kWh:
                (latestData as any)?.Consumption_kWh ??
                (latestData as any)?.CN?.kWh,
              Generation_kWh:
                (latestData as any)?.Generation_kWh ??
                (latestData as any)?.GN?.kWh,
            };

            updateTotals(deviceId, normalized);
            setTotals(getTotals(deviceId));
          }

          setLoading(false);
        }
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
  if (error) return <div className="error-message">{error}</div>;
  if (loading)
    return (
      <div className="loading-container">
        Loading data for device: {deviceId}...
      </div>
    );
  if (!data) return <div>No data available</div>;

  const prefix = deviceId?.slice(0, 4)?.toUpperCase() || '';
  const isSolarDevice = prefix === 'ENSN' || prefix === 'ENTN';
  const isNonSolarDevice = prefix === 'ENSS' || prefix === 'ENTA' || prefix === 'ENSA';
  const formattedTimestamp = new Date(data.timestamp as string).toLocaleString();

  // Calculate instantaneous net (always from latest reading)
  const instantConsumed =
    (data as any)?.Consumption_kWh ?? (data as any)?.CN?.kWh ?? 0;
  const instantGenerated =
    (data as any)?.Generation_kWh ?? (data as any)?.GN?.kWh ?? 0;
  const instantNet = instantGenerated - instantConsumed;

  return (
    <div className="dashboard-container">
      <div className="header">
        {isSolarDevice ? (
          <>
            <h2>Welcome, {username}</h2>
            <p className="device-id">Device ID: {deviceId}</p>
          </>
        ) : (
          <>
            <h2>Welcome to your dashboard</h2>
            <p>Monitor your devices right from your phone.</p>
          </>
        )}
      </div>

      {isSolarDevice && (
        <NetSummaryCard
          instantNet={instantNet}
          totalImport={totals.totalImport}
          totalExport={totals.totalExport}
          lastUpdated={data.timestamp as string}
        />
      )}

      {isNonSolarDevice && <div>Non-solar device detected</div>}

      {/* Consumption */}
      <div className="metric-section">
        <h3>Consumption</h3>
        <Metric
          label="kWh"
          value={(data as any)?.Consumption_kWh ?? (data as any)?.CN?.kWh}
          unit="kWh"
        />
        <Metric
          label="Voltage"
          value={(data as any)?.Consumption_V ?? (data as any)?.CN?.V}
          unit="V"
        />
        <Metric
          label="Current"
          value={(data as any)?.Consumption_A ?? (data as any)?.CN?.A}
          unit="A"
        />
        <Metric
          label="Power"
          value={(data as any)?.Consumption_W ?? (data as any)?.CN?.W}
          unit="W"
        />
        <Metric
          label="Power Factor"
          value={(data as any)?.Consumption_PF ?? (data as any)?.CN?.PF}
        />
        <Metric
          label="Frequency"
          value={(data as any)?.Consumption_Hz ?? (data as any)?.CN?.Hz}
          unit="Hz"
        />
      </div>

      {/* Generation */}
      {isSolarDevice && (
        <div className="metric-section">
          <h3>Generation</h3>
          <Metric
            label="kWh"
            value={(data as any)?.Generation_kWh ?? (data as any)?.GN?.kWh}
            unit="kWh"
          />
          <Metric
            label="Voltage"
            value={(data as any)?.Generation_V ?? (data as any)?.GN?.V}
            unit="V"
          />
          <Metric
            label="Current"
            value={(data as any)?.Generation_A ?? (data as any)?.GN?.A}
            unit="A"
          />
          <Metric
            label="Power"
            value={(data as any)?.Generation_W ?? (data as any)?.GN?.W}
            unit="W"
          />
          <Metric
            label="Power Factor"
            value={(data as any)?.Generation_PF ?? (data as any)?.GN?.PF}
          />
          <Metric
            label="Frequency"
            value={(data as any)?.Generation_Hz ?? (data as any)?.GN?.Hz}
            unit="Hz"
          />
        </div>
      )}

      <div className="footer">
        <p>Last updated: {formattedTimestamp}</p>
      </div>
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
    <div className="metric">
      <span className="metric-label">{label}</span>
      <span className="metric-value">
        {displayValue} {unit}
      </span>
    </div>
  );
};

export default Dashboard;
