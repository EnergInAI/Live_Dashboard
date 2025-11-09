// utils/solarAgg.ts

let prevGenerated = 0;
let prevConsumed = 0;
let totalImport = 0;
let totalExport = 0;
let lastTimestamp: string | null = null;
let lastResetDate: string | null = null;

interface EnergyTotals {
  instantNet: number;
  totalImport: number;
  totalExport: number;
  totalGenerated: number;
  totalConsumed: number;
}

/**
 * Updates instantaneous net flow and daily grid import/export accumulation.
 * Called periodically (~10s) by the dashboard.
 */
export function updateTotals(
  latestGen: number,
  latestCons: number,
  timestamp: string
): EnergyTotals {
  // --- Normalize + validate inputs ---
  const now = new Date(timestamp);
  if (isNaN(now.getTime())) {
    console.warn('Invalid timestamp passed to updateTotals:', timestamp);
    return getTotals();
  }

  const currentDate = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });

  // --- Reset daily totals at midnight IST ---
  if (lastResetDate && lastResetDate !== currentDate) {
    totalImport = 0;
    totalExport = 0;
    prevGenerated = latestGen;
    prevConsumed = latestCons;
  }
  lastResetDate = currentDate;

  // --- Avoid duplicate data updates ---
  if (timestamp === lastTimestamp) {
    return getTotals();
  }
  lastTimestamp = timestamp;

  // --- Compute deltas (handle rollovers) ---
  let deltaGen = latestGen - prevGenerated;
  let deltaCons = latestCons - prevConsumed;

  if (deltaGen < 0) {
    console.warn('Generator rollover detected, resetting baseline.');
    deltaGen = 0;
    prevGenerated = latestGen;
  }

  if (deltaCons < 0) {
    console.warn('Consumption rollover detected, resetting baseline.');
    deltaCons = 0;
    prevConsumed = latestCons;
  }

  const deltaNet = deltaGen - deltaCons;

  // --- Filter out noise (e.g., inverter jitter) ---
  if (Math.abs(deltaNet) > 0.001) {
    if (deltaNet > 0) totalExport += deltaNet;
    else totalImport += Math.abs(deltaNet);
  }

  // --- Update previous readings ---
  prevGenerated = latestGen;
  prevConsumed = latestCons;

  const instantNet = latestGen - latestCons;

  // --- Return updated totals (rounded) ---
  return {
    instantNet: parseFloat(instantNet.toFixed(3)),
    totalImport: parseFloat(totalImport.toFixed(3)),
    totalExport: parseFloat(totalExport.toFixed(3)),
    totalGenerated: parseFloat(latestGen.toFixed(3)),
    totalConsumed: parseFloat(latestCons.toFixed(3)),
  };
}

/**
 * Returns the most recently stored totals (safe getter for dashboard load).
 */
export function getTotals(): EnergyTotals {
  return {
    instantNet: parseFloat((prevGenerated - prevConsumed).toFixed(3)),
    totalImport: parseFloat(totalImport.toFixed(3)),
    totalExport: parseFloat(totalExport.toFixed(3)),
    totalGenerated: parseFloat(prevGenerated.toFixed(3)),
    totalConsumed: parseFloat(prevConsumed.toFixed(3)),
  };
}

/**
 * Resets all totals (manual override if needed).
 */
export function resetTotals(): void {
  prevGenerated = 0;
  prevConsumed = 0;
  totalImport = 0;
  totalExport = 0;
  lastTimestamp = null;
  lastResetDate = null;
}
