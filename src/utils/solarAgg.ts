interface Aggregates {
  baseConsumed: number;     // First kWh consumption reading for the day
  baseGenerated: number;    // First kWh generation reading for the day
  totalConsumed: number;    // Daily cumulative consumption (current - base)
  totalGenerated: number;   // Daily cumulative generation (current - base)
  net: number;
  netType: string;
  lastUpdateDate: string;   // Date string "YYYY-MM-DD" for daily reset
}

// In-memory store for device aggregates
const deviceTotals: Record<string, Aggregates> = {};

// Helper to get the current date in IST timezone
function getCurrentDateIST(): string {
  const date = new Date();
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const istTime = new Date(utc + 330 * 60000); // IST is UTC+5:30
  return istTime.toISOString().slice(0, 10);
}

// Helper to safely read kWh values from various possible payload structures
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

  // If it's a new day or the first reading ever, set a new baseline
  if (!deviceTotals[deviceId] || deviceTotals[deviceId].lastUpdateDate !== currentDate) {
    deviceTotals[deviceId] = {
      baseConsumed: c,
      baseGenerated: g,
      totalConsumed: 0,
      totalGenerated: 0,
      net: 0,
      netType: '',
      lastUpdateDate: currentDate,
    };
  }

  const agg = deviceTotals[deviceId];

  // Always calculate the daily total as the difference from the baseline
  agg.totalConsumed = Math.max(0, c - agg.baseConsumed);
  agg.totalGenerated = Math.max(0, g - agg.baseGenerated);

  // Recalculate net energy
  agg.net = agg.totalGenerated - agg.totalConsumed;
  agg.netType = agg.net > 0 ? 'export' : agg.net < 0 ? 'import' : 'neutral';
}

export function getTotals(deviceId: string) {
  const agg = deviceTotals[deviceId];
  return agg ? {
    totalConsumed: agg.totalConsumed,
    totalGenerated: agg.totalGenerated,
    net: agg.net,
    netType: agg.netType,
  } : {
    totalConsumed: 0,
    totalGenerated: 0,
    net: 0,
    netType: '',
  };
}
