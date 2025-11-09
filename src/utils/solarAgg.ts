interface Aggregates {
  baseConsumed: number;
  baseGenerated: number;
  prevConsumed: number;
  prevGenerated: number;
  totalImport: number;
  totalExport: number;
  lastUpdateDate: string;
  lastTimestamp: number;
}

const deviceTotals: Record<string, Aggregates> = {};

function getCurrentDateIST(): string {
  const date = new Date();
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const istTime = new Date(utc + 330 * 60000);
  return istTime.toISOString().slice(0, 10);
}

function readKWh(data: any): { c: number; g: number; isValid: boolean } {
  try {
    const c = parseFloat(
      data?.Consumption_kWh ?? data?.CN?.kWh ?? data?.consumption_kWh ?? ''
    );
    const g = parseFloat(
      data?.Generation_kWh ?? data?.GN?.kWh ?? data?.generation_kWh ?? ''
    );

    const cValid = !isNaN(c) && isFinite(c) && c >= 0;
    const gValid = !isNaN(g) && isFinite(g) && g >= 0;

    return {
      c: cValid ? c : 0,
      g: gValid ? g : 0,
      isValid: cValid || gValid,
    };
  } catch {
    return { c: 0, g: 0, isValid: false };
  }
}

export function updateTotals(deviceId: string, data: any): boolean {
  if (!deviceId || !data) return false;

  const { c, g, isValid } = readKWh(data);
  if (!isValid) return false;

  const currentDate = getCurrentDateIST();
  const currentTimestamp = Date.now();

  // Reset on new day
  if (!deviceTotals[deviceId] || deviceTotals[deviceId].lastUpdateDate !== currentDate) {
    deviceTotals[deviceId] = {
      baseConsumed: c,
      baseGenerated: g,
      prevConsumed: c,
      prevGenerated: g,
      totalImport: 0,
      totalExport: 0,
      lastUpdateDate: currentDate,
      lastTimestamp: currentTimestamp,
    };
    return true;
  }

  const agg = deviceTotals[deviceId];

  // Prevent duplicates
  if (currentTimestamp <= agg.lastTimestamp) return false;

  const deltaConsumed = c - agg.prevConsumed;
  const deltaGenerated = g - agg.prevGenerated;

  // Handle rollover
  if (deltaConsumed < 0 || deltaGenerated < 0) {
    agg.baseConsumed = c;
    agg.baseGenerated = g;
    agg.prevConsumed = c;
    agg.prevGenerated = g;
    return false;
  }

  // Ignore noise
  if (Math.abs(deltaConsumed) < 0.001 && Math.abs(deltaGenerated) < 0.001) {
    return false;
  }

  const deltaNet = deltaGenerated - deltaConsumed;

  if (deltaNet > 0) {
    agg.totalExport += deltaNet;
  } else if (deltaNet < 0) {
    agg.totalImport += Math.abs(deltaNet);
  }

  agg.prevConsumed = c;
  agg.prevGenerated = g;
  agg.lastTimestamp = currentTimestamp;

  return true;
}

export function getTotals(deviceId: string): {
  totalImport: number;
  totalExport: number;
} {
  if (!deviceId) return { totalImport: 0, totalExport: 0 };

  const agg = deviceTotals[deviceId];
  
  if (agg && agg.lastUpdateDate === getCurrentDateIST()) {
    return {
      totalImport: Math.max(0, agg.totalImport),
      totalExport: Math.max(0, agg.totalExport),
    };
  }

  return { totalImport: 0, totalExport: 0 };
}
