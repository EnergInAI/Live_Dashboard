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

const NOISE_THRESHOLD = 0.001; // kWh

export function updateTotals(
  latestGen: number,
  latestCons: number,
  timestamp: string
): EnergyTotals {
  const now = new Date(timestamp);
  if (isNaN(now.getTime())) {
    // invalid timestamp -> return current state
    return getTotals();
  }

  // normalize current date in IST for midnight reset
  const currentDate = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });

  // Reset daily totals at midnight IST
  if (lastResetDate && lastResetDate !== currentDate) {
    totalImport = 0;
    totalExport = 0;
    // reset baselines to current values to avoid huge deltas immediately after midnight
    prevGenerated = latestGen;
    prevConsumed = latestCons;
  }
  lastResetDate = currentDate;

  // Avoid processing duplicate timestamps
  if (timestamp === lastTimestamp) {
    return getTotals();
  }
  lastTimestamp = timestamp;

  // Calculate deltas
  let deltaGen = latestGen - prevGenerated;
  let deltaCons = latestCons - prevConsumed;

  // Handle meter rollover (negative delta) by resetting baseline for that meter
  if (deltaGen < 0) {
    deltaGen = 0;
    prevGenerated = latestGen;
  }
  if (deltaCons < 0) {
    deltaCons = 0;
    prevConsumed = latestCons;
  }

  const deltaNet = deltaGen - deltaCons;

  // Apply noise filter
  if (Math.abs(deltaNet) > NOISE_THRESHOLD) {
    if (deltaNet > 0) {
      totalExport += deltaNet;
    } else {
      totalImport += Math.abs(deltaNet);
    }
  }

  // Update prev baselines for next tick
  prevGenerated = latestGen;
  prevConsumed = latestCons;

  const instantNet = latestGen - latestCons;

  return {
    instantNet: parseFloat(instantNet.toFixed(3)),
    totalImport: parseFloat(totalImport.toFixed(3)),
    totalExport: parseFloat(totalExport.toFixed(3)),
    totalGenerated: parseFloat(latestGen.toFixed(3)),
    totalConsumed: parseFloat(latestCons.toFixed(3)),
  };
}

export function getTotals(): EnergyTotals {
  return {
    instantNet: parseFloat((prevGenerated - prevConsumed).toFixed(3)),
    totalImport: parseFloat(totalImport.toFixed(3)),
    totalExport: parseFloat(totalExport.toFixed(3)),
    totalGenerated: parseFloat(prevGenerated.toFixed(3)),
    totalConsumed: parseFloat(prevConsumed.toFixed(3)),
  };
}

export function resetTotals(): void {
  prevGenerated = 0;
  prevConsumed = 0;
  totalImport = 0;
  totalExport = 0;
  lastTimestamp = null;
  lastResetDate = null;
}
