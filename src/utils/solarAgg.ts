// solarAgg.ts
// Correct incremental energy tracking with delta computation

interface EnergyData {
  timestamp?: string;
  Consumption_kWh?: number;
  Generation_kWh?: number;
}

interface Totals {
  lastTimestamp?: string;
  lastConsumption?: number;
  lastGeneration?: number;
  totalConsumed: number;
  totalGenerated: number;
}

const solarTotals: Record<string, Totals> = {};

export function updateTotals(deviceId: string, data: EnergyData): void {
  if (!deviceId || !data) return;

  const newTimestamp = data.timestamp || '';
  const newConsumption = Number(data.Consumption_kWh) || 0;
  const newGeneration = Number(data.Generation_kWh) || 0;

  if (!solarTotals[deviceId]) {
    // First time entry — initialize
    solarTotals[deviceId] = {
      lastTimestamp: newTimestamp,
      lastConsumption: newConsumption,
      lastGeneration: newGeneration,
      totalConsumed: 0,
      totalGenerated: 0,
    };
    return;
  }

  const deviceTotals = solarTotals[deviceId];

  // Ignore identical timestamps (no new reading)
  if (newTimestamp === deviceTotals.lastTimestamp) return;

  // Compute delta since last reading
  const deltaC = Math.max(0, newConsumption - (deviceTotals.lastConsumption || 0));
  const deltaG = Math.max(0, newGeneration - (deviceTotals.lastGeneration || 0));

  // Add deltas to running totals
  deviceTotals.totalConsumed += deltaC;
  deviceTotals.totalGenerated += deltaG;

  // Update last known values
  deviceTotals.lastConsumption = newConsumption;
  deviceTotals.lastGeneration = newGeneration;
  deviceTotals.lastTimestamp = newTimestamp;

  solarTotals[deviceId] = deviceTotals;
}

export function getTotals(deviceId: string): {
  totalConsumption: number;
  totalGeneration: number;
} {
  const totals = solarTotals[deviceId];
  if (!totals) {
    return { totalConsumption: 0, totalGeneration: 0 };
  }

  return {
    totalConsumption: totals.totalConsumed,
    totalGeneration: totals.totalGenerated,
  };
}
