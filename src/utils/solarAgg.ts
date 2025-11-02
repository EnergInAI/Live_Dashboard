// solarAgg.ts
// Lightweight aggregator for rolling solar totals

interface EnergyData {
  Consumption_kWh?: number;
  Generation_kWh?: number;
}

interface Totals {
  totalConsumed: number;
  totalGenerated: number;
}

// In-memory store keyed by deviceId
const solarTotals: Record<string, Totals> = {};

/**
 * Update rolling totals for a given deviceId using the latest payload.
 * Adds the latest consumption and generation to running totals.
 */
export function updateTotals(deviceId: string, data: EnergyData): void {
  if (!deviceId || !data) return;

  if (!solarTotals[deviceId]) {
    solarTotals[deviceId] = { totalConsumed: 0, totalGenerated: 0 };
  }

  const deviceTotals = solarTotals[deviceId];
  const newConsumption = Number(data.Consumption_kWh) || 0;
  const newGeneration = Number(data.Generation_kWh) || 0;

  // Simple rolling addition (acts like cumulative total since page load)
  deviceTotals.totalConsumed += newConsumption;
  deviceTotals.totalGenerated += newGeneration;

  solarTotals[deviceId] = deviceTotals;
}

/**
 * Get current totals for a deviceId.
 * Returns 0 if not found yet.
 */
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
