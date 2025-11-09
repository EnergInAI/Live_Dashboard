interface Aggregates {
  baseConsumed: number;
  baseGenerated: number;
  prevConsumed: number;     // NEW: Track previous reading
  prevGenerated: number;    // NEW: Track previous reading
  totalConsumed: number;
  totalGenerated: number;
  totalImport: number;      // NEW: Daily cumulative import
  totalExport: number;      // NEW: Daily cumulative export
  net: number;
  netType: string;
  lastUpdateDate: string;
  lastTimestamp: number;    // NEW: Prevent duplicate processing
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
  const { c, g } = readKWh(data);
  const currentDate = getCurrentDateIST();
  const currentTimestamp = Date.now();

  // Reset on new day or first reading
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
      netType: '',
      lastUpdateDate: currentDate,
      lastTimestamp: currentTimestamp,
    };
    return;
  }

  const agg = deviceTotals[deviceId];

  // Prevent duplicate processing
  if (currentTimestamp <= agg.lastTimestamp) return;

  // Calculate deltas since last reading
  const deltaConsumed = c - agg.prevConsumed;
  const deltaGenerated = g - agg.prevGenerated;

  // Handle meter rollover
  if (deltaConsumed < 0 || deltaGenerated < 0) {
    agg.baseConsumed = c;
    agg.baseGenerated = g;
    agg.prevConsumed = c;
    agg.prevGenerated = g;
    return;
  }

  // Ignore noise (< 0.001 kWh)
  if (Math.abs(deltaConsumed) >= 0.001 || Math.abs(deltaGenerated) >= 0.001) {
    const deltaNet = deltaGenerated - deltaConsumed;

    // Accumulate import or export
    if (deltaNet > 0) {
      agg.totalExport += deltaNet;
    } else if (deltaNet < 0) {
      agg.totalImport += Math.abs(deltaNet);
    }
  }

  // Update daily totals (from baseline)
  agg.totalConsumed = Math.max(0, c - agg.baseConsumed);
  agg.totalGenerated = Math.max(0, g - agg.baseGenerated);
  agg.net = agg.totalGenerated - agg.totalConsumed;
  agg.netType = agg.net > 0 ? 'export' : agg.net < 0 ? 'import' : 'neutral';

  // Update previous readings
  agg.prevConsumed = c;
  agg.prevGenerated = g;
  agg.lastTimestamp = currentTimestamp;
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
      netType: '',
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
