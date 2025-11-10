// ✅ /src/utils/solarAgg.ts — Daily net, consumption & generation tracking with midnight reset

interface Totals {
  totalImport: number;
  totalExport: number;
  totalConsumed: number;
  totalGenerated: number;
  net: number;
  netType: string;
  lastResetDate: string;
  lastConsumption: number;
  lastGeneration: number;
  baseConsumption: number;
  baseGeneration: number;
}

const STORAGE_KEY = "solarTotals_v2";
let totalsMap: Record<string, Totals> = {};

// Load persisted totals on startup
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

export function updateTotals(
  deviceId: string,
  payload: { Consumption_kWh?: number; Generation_kWh?: number }
) {
  if (!deviceId) return;

  const now = new Date();
  const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const today = istNow.toISOString().split("T")[0];

  const consumption = payload.Consumption_kWh ?? 0;
  const generation = payload.Generation_kWh ?? 0;

  let current = totalsMap[deviceId];

  // Initialize or reset at midnight
  if (!current || isNewDay(current.lastResetDate)) {
    totalsMap[deviceId] = {
      totalImport: 0,
      totalExport: 0,
      totalConsumed: 0,
      totalGenerated: 0,
      net: 0,
      netType: "neutral",
      lastResetDate: today,
      lastConsumption: consumption,
      lastGeneration: generation,
      baseConsumption: consumption,
      baseGeneration: generation,
    };
    saveToStorage();
    return;
  }

  // Calculate deltas for import/export tracking
  const deltaConsumption = Math.max(0, consumption - current.lastConsumption);
  const deltaGeneration = Math.max(0, generation - current.lastGeneration);

  current.totalImport += deltaConsumption;
  current.totalExport += deltaGeneration;

  // Calculate daily totals from baseline
  current.totalConsumed = Math.max(0, consumption - current.baseConsumption);
  current.totalGenerated = Math.max(0, generation - current.baseGeneration);

  // Net = generation - consumption (daily accumulating)
  current.net = current.totalGenerated - current.totalConsumed;
  current.netType =
    current.net > 0.001
      ? "export"
      : current.net < -0.001
      ? "import"
      : "neutral";

  // Update last readings for next delta
  current.lastConsumption = consumption;
  current.lastGeneration = generation;

  totalsMap[deviceId] = current;
  saveToStorage();
}

export function getTotals(deviceId: string): Totals {
  const defaultTotals: Totals = {
    totalImport: 0,
    totalExport: 0,
    totalConsumed: 0,
    totalGenerated: 0,
    net: 0,
    netType: "neutral",
    lastResetDate: new Date().toISOString().split("T")[0],
    lastConsumption: 0,
    lastGeneration: 0,
    baseConsumption: 0,
    baseGeneration: 0,
  };

  return totalsMap[deviceId] || defaultTotals;
}
