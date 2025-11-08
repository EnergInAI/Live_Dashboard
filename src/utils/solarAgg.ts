// src/utils/solarAgg.ts

interface Aggregates {
  lastConsumed: number;     // last recorded Consumption_kWh
  lastGenerated: number;    // last recorded Generation_kWh
  totalConsumed: number;    // cumulative total
  totalGenerated: number;   // cumulative total
  net: number;
  netType: string;
}

// Store per-device aggregates
const deviceTotals: Record<string, Aggregates> = {};

export function updateTotals(deviceId: string, data: any) {
  const consumption = parseFloat(data?.Consumption_kWh) || 0;
  const generation = parseFloat(data?.Generation_kWh) || 0;

  if (!deviceTotals[deviceId]) {
    // Initialize device entry
    deviceTotals[deviceId] = {
      lastConsumed: consumption,
      lastGenerated: generation,
      totalConsumed: 0,
      totalGenerated: 0,
      net: 0,
      netType: '',
    };
    return; // first reading just initializes last values
  }

  const totals = deviceTotals[deviceId];

  // Only add positive differences (incremental energy)
  if (consumption > totals.lastConsumed) {
    totals.totalConsumed += consumption - totals.lastConsumed;
    totals.lastConsumed = consumption;
  }

  if (generation > totals.lastGenerated) {
    totals.totalGenerated += generation - totals.lastGenerated;
    totals.lastGenerated = generation;
  }

  // Update net values
  totals.net = totals.totalGenerated - totals.totalConsumed;
  totals.netType =
    totals.net > 0 ? 'export' : totals.net < 0 ? 'import' : 'neutral';
}

export function getTotals(deviceId: string) {
  // Always return a full object shape
  const totals = deviceTotals[deviceId];
  return totals
    ? {
        totalConsumed: totals.totalConsumed,
        totalGenerated: totals.totalGenerated,
        net: totals.net,
        netType: totals.netType,
      }
    : {
        totalConsumed: 0,
        totalGenerated: 0,
        net: 0,
        netType: '',
      };
}
