interface Aggregates {
  baseConsumed: number;
  baseGenerated: number;
  prevConsumed: number;      // NEW
  prevGenerated: number;     // NEW
  totalConsumed: number;
  totalGenerated: number;
  totalImport: number;       // NEW
  totalExport: number;       // NEW
  net: number;
  netType: string;
  lastUpdateDate: string;
  lastTimestamp: number;     // NEW
}

const deviceTotals: Record<string, Aggregates> = {};

function getCurrentDateIST(): string {
  const date = new Date();
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const istTime = new Date(utc + 330 * 60000);
  return istTime.toISOString().slice(0, 10);
}

function readKWh(data: any) {
  const c =
    parseFloat(
      data?.Consumption_kWh ??
      data?.CN?.kWh ??
      data?.consumption_kWh ??
      ''
    ) || 0;
  const g =
    parseFloat(
      data?.Generation_kWh ??
      data?.GN?.kWh ??
      data?.generation_kWh ??
      ''
    ) || 0;
  return { c, g };
}

export function updateTotals(deviceId: string, data: any) {
  if (!deviceId || !data) return;

  const { c, g } = readKWh(data);
  const currentDate = getCurrentDateIST();
  const now = Date.now();

  // First reading today or new day -> set baseline
  if (!deviceTotals[deviceId] || deviceTotals[deviceId].lastUpdateDate !== currentDate) {
    deviceTotals[deviceId] = {
      baseConsumed: c,
      baseGenerated: g,
      prevConsumed: c,
      prevGenerated: g,
      totalConsumed: 0,
      totalGenerated: 0,
      totalImport: 0,
      totalExport: 0,
      net: 0,
      netType: 'neutral',
      lastUpdateDate: currentDate,
      lastTimestamp: now,
    };
    return;
  }

  const agg = deviceTotals[deviceId];

  // Avoid duplicate/back-in-time updates
  if (now <= agg.lastTimestamp) return;

  // Deltas from previous reading
  const dC = c - agg.prevConsumed;
  const dG = g - agg.prevGenerated;

  // Handle meter resets/rollover
  if (dC < 0 || dG < 0) {
    agg.baseConsumed = c;
    agg.baseGenerated = g;
    agg.prevConsumed = c;
    agg.prevGenerated = g;
    agg.lastTimestamp = now;
    return;
  }

  // Ignore tiny noise under 1 Wh
  const EPS = 0.001;
  if (Math.abs(dC) >= EPS || Math.abs(dG) >= EPS) {
    const dNet = dG - dC;
    if (dNet > 0) {
      agg.totalExport += dNet;
    } else if (dNet < 0) {
      agg.totalImport += Math.abs(dNet);
    }
  }

  // Update daily consumed/generated from baseline
  agg.totalConsumed = Math.max(0, c - agg.baseConsumed);
  agg.totalGenerated = Math.max(0, g - agg.baseGenerated);
  agg.net = agg.totalGenerated - agg.totalConsumed;
  agg.netType = agg.net > 0 ? 'export' : agg.net < 0 ? 'import' : 'neutral';

  // Move prev pointers
  agg.prevConsumed = c;
  agg.prevGenerated = g;
  agg.lastTimestamp = now;
}

export function getTotals(deviceId: string) {
  const agg = deviceTotals[deviceId];
  if (!agg || agg.lastUpdateDate !== getCurrentDateIST()) {
    return {
      totalConsumed: 0,
      totalGenerated: 0,
      totalImport: 0,
      totalExport: 0,
      net: 0,
      netType: 'neutral',
    };
  }
  return {
    totalConsumed: agg.totalConsumed,
    totalGenerated: agg.totalGenerated,
    totalImport: Math.max(0, agg.totalImport),
    totalExport: Math.max(0, agg.totalExport),
    net: agg.net,
    netType: agg.netType,
  };
}
