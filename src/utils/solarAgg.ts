interface Aggregates {
  lastConsumed: number;     // last recorded Consumption_kWh
  lastGenerated: number;    // last recorded Generation_kWh
  totalConsumed: number;    // cumulative total for the day
  totalGenerated: number;   // cumulative total for the day
  net: number;
  netType: string;
  lastUpdateDate: string;   // track date for daily reset
}

// Store per-device aggregates
const deviceTotals: Record<string, Aggregates> = {};

// Helper to get current date string in IST timezone (yyyy-mm-dd)
function getCurrentDateIST(): string {
  const date = new Date();
  // Offset IST +5:30 from UTC (330 minutes)
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const istTime = new Date(utc + (330 * 60000));
  return istTime.toISOString().slice(0, 10);
}

export function updateTotals(deviceId: string, data: any) {
  const consumption = parseFloat(data?.Consumption_kWh) || 0;
  const generation = parseFloat(data?.Generation_kWh) || 0;
  const currentDate = getCurrentDateIST();

  if (!deviceTotals[deviceId]) {
    // Initialize device entry with current date
    deviceTotals[deviceId] = {
      lastConsumed: consumption,
      lastGenerated: generation,
      totalConsumed: 0,
      totalGenerated: 0,
      net: 0,
      netType: '',
      lastUpdateDate: currentDate,
    };
    return; // first reading just initializes last values and date
  }

  const totals = deviceTotals[deviceId];

  // Reset totals if date changed (new day)
  if (totals.lastUpdateDate !== currentDate) {
    totals.lastConsumed = consumption;
    totals.lastGenerated = generation;
    totals.totalConsumed = 0;
    totals.totalGenerated = 0;
    totals.net = 0;
    totals.netType = '';
    totals.lastUpdateDate = currentDate;
  }

  // Only add positive differences (incremental energy)
  if (consumption > totals.lastConsumed) {
    totals.totalConsumed += consumption - totals.lastConsumed;
    totals.lastConsumed = consumption;
  }

  if (generation > totals.lastGenerated) {
    totals.totalGenerated += generation - totals.lastGenerated;
    totals.lastGenerated = generation;
  }

  // Update net values
  totals.net = totals.totalGenerated - totals.totalConsumed;
  totals.netType =
    totals.net > 0 ? 'export' : totals.net < 0 ? 'import' : 'neutral';
}

export function getTotals(deviceId: string) {
  // Always return a full object shape
  const totals = deviceTotals[deviceId];
  return totals
    ? {
        totalConsumed: totals.totalConsumed,
        totalGenerated: totals.totalGenerated,
        net: totals.net,
        netType: totals.netType,
      }
    : {
        totalConsumed: 0,
        totalGenerated: 0,
        net: 0,
        netType: '',
      };
}
