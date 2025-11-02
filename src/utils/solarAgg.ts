// src/utils/solarAgg.ts

interface Aggregates {
  totalConsumed: number;
  totalGenerated: number;
  net: number;
  netType: string;
}

// Store per-device aggregates
const deviceTotals: Record<string, Aggregates> = {};

export function updateTotals(deviceId: string, data: any) {
  if (!deviceTotals[deviceId]) {
    deviceTotals[deviceId] = {
      totalConsumed: 0,
      totalGenerated: 0,
      net: 0,
      netType: '',
    };
  }

  const consumption = parseFloat(data?.Consumption_kWh) || 0;
  const generation = parseFloat(data?.Generation_kWh) || 0;

  deviceTotals[deviceId].totalConsumed += consumption;
  deviceTotals[deviceId].totalGenerated += generation;

  const net = deviceTotals[deviceId].totalGenerated - deviceTotals[deviceId].totalConsumed;

  deviceTotals[deviceId].net = net;
  deviceTotals[deviceId].netType = net > 0 ? 'export' : net < 0 ? 'import' : 'neutral';
}

export function getTotals(deviceId: string) {
  // ✅ Always return full shape expected by Dashboard
  return (
    deviceTotals[deviceId] || {
      totalConsumed: 0,
      totalGenerated: 0,
      net: 0,
      netType: '',
    }
  );
}
