// ✅ /src/utils/solarAgg.ts — delta-based + daily reset + persistence

interface Totals {
  totalImport: number;
  totalExport: number;
  net: number;
  netType: string;
  lastResetDate: string;
  lastConsumption?: number;
  lastGeneration?: number;
}

const STORAGE_KEY = "solarTotals_v2";
let totalsMap: Record<string, Totals> = {};

// ---------- Load persisted totals on startup ----------
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) totalsMap = JSON.parse(saved);
} catch (err) {
  console.warn("⚠️ Could not load stored solar totals:", err);
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(totalsMap));
  } catch (err) {
    console.warn("⚠️ Failed to persist solar totals:", err);
  }
}

function isNewDay(lastDate: string): boolean {
  const now = new Date();
  const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const istToday = istNow.toISOString().split("T")[0];
  return istToday !== lastDate;
}

// ---------- Core update logic ----------
export function updateTotals(
  deviceId: string,
  payload: { Consumption_kWh?: number; Generation_kWh?: number }
) {
  if (!deviceId) return;

  const now = new Date();
  const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const today = istNow.toISOString().split("T")[0];

  let current = totalsMap[deviceId] || {
    totalImport: 0,
    totalExport: 0,
    net: 0,
    netType: "",
    lastResetDate: today,
    lastConsumption: undefined,
    lastGeneration: undefined,
  };

  // Reset at midnight (IST)
  if (isNewDay(current.lastResetDate)) {
    current = {
      totalImport: 0,
      totalExport: 0,
      net: 0,
      netType: "",
      lastResetDate: today,
    };
  }

  const consumption = payload.Consumption_kWh ?? 0;
  const generation = payload.Generation_kWh ?? 0;

  // Calculate deltas vs last readings
  const deltaConsumption =
    current.lastConsumption !== undefined
      ? Math.max(0, consumption - current.lastConsumption)
      : 0;
  const deltaGeneration =
    current.lastGeneration !== undefined
      ? Math.max(0, generation - current.lastGeneration)
      : 0;

  // Accumulate daily totals
  current.totalImport += deltaConsumption;
  current.totalExport += deltaGeneration;

  // Store last readings for next delta calc
  current.lastConsumption = consumption;
  current.lastGeneration = generation;

  // Compute instantaneous net (current reading difference)
  const netNow = generation - consumption;
  current.net = netNow;
  current.netType =
    netNow > 0
      ? "Exporting to Grid"
      : netNow < 0
      ? "Importing from Grid"
      : "Neutral";

  totalsMap[deviceId] = current;
  saveToStorage();
}

// ---------- Read-only accessor ----------
export function getTotals(deviceId: string) {
  return (
    totalsMap[deviceId] || {
      totalImport: 0,
      totalExport: 0,
      net: 0,
      netType: "",
      lastResetDate: new Date().toISOString().split("T")[0],
    }
  );
}
