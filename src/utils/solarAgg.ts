// src/utils/solarAgg.ts

interface Totals {
  totalImport: number;
  totalExport: number;
  lastTimestamp: string | null;
  lastResetDate: string | null;
}

const totalsMap: Record<string, Totals> = {};

// Helper: get today's date key (IST)
const getTodayKey = (): string => {
  const now = new Date();
  now.setHours(now.getHours() + 5); // adjust UTC → IST (approx)
  now.setMinutes(now.getMinutes() + 30);
  return now.toISOString().split('T')[0];
};

// ✅ Load saved totals from localStorage
const loadTotals = (deviceId: string): Totals => {
  const stored = localStorage.getItem(`totals_${deviceId}`);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      totalsMap[deviceId] = parsed;
      return parsed;
    } catch {
      console.warn('⚠️ Failed to parse saved totals');
    }
  }
  // fallback
  return {
    totalImport: 0,
    totalExport: 0,
    lastTimestamp: null,
    lastResetDate: getTodayKey(),
  };
};

// ✅ Save updated totals to localStorage
const saveTotals = (deviceId: string, totals: Totals) => {
  localStorage.setItem(`totals_${deviceId}`, JSON.stringify(totals));
};

// ✅ Initialize device totals on load
export const getTotals = (deviceId: string): Totals => {
  if (!totalsMap[deviceId]) {
    totalsMap[deviceId] = loadTotals(deviceId);
  }
  return totalsMap[deviceId];
};

// ✅ Update totals incrementally
export const updateTotals = (
  deviceId: string,
  data: { Consumption_kWh?: number; Generation_kWh?: number; timestamp?: string }
) => {
  const totals = getTotals(deviceId);
  const today = getTodayKey();

  // Reset if new day
  if (totals.lastResetDate !== today) {
    totals.totalImport = 0;
    totals.totalExport = 0;
    totals.lastResetDate = today;
  }

  const cons = data.Consumption_kWh ?? 0;
  const gen = data.Generation_kWh ?? 0;

  const diff = gen - cons;

  // Update net import/export
  if (diff > 0) {
    totals.totalExport += diff;
  } else {
    totals.totalImport += Math.abs(diff);
  }

  totals.lastTimestamp = data.timestamp || new Date().toISOString();

  // Save persistently
  saveTotals(deviceId, totals);

  return totals;
};
