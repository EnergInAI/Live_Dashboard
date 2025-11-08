interface Aggregates {
  lastConsumed: number;     // last recorded Consumption kWh reading
  lastGenerated: number;    // last recorded Generation kWh reading
  totalConsumed: number;    // cumulative total for the day
  totalGenerated: number;   // cumulative total for the day
  net: number;
  netType: string;
  lastUpdateDate: string;   // yyyy-mm-dd in IST for daily reset
}

// Store per-device aggregates in-memory
const deviceTotals: Record<string, Aggregates> = {};

// Helper: current date in IST (yyyy-mm-dd)
function getCurrentDateIST(): string {
  const date = new Date();
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const istTime = new Date(utc + 330 * 60000); // +5:30
  return istTime.toISOString().slice(0, 10);
}

export function updateTotals(deviceId: string, data: any) {
  // Accept both flattened and nested shapes
  const consumption =
    parseFloat(
      data?.Consumption_kWh ??
      data?.CN?.kWh ??
      data?.consumption_kWh ??
      ''
    ) || 0;

  const generation =
    parseFloat(
      data?.Generation_kWh ??
      data?.GN?.kWh ??
      data?.generation_kWh ??
      ''
    ) || 0;

  const currentDate = getCurrentDateIST();

  // Initialize device entry on first reading
  if (!deviceTotals[deviceId]) {
    deviceTotals[deviceId] = {
      lastConsumed: consumption,
      lastGenerated: generation,
      totalConsumed: 0,
      totalGenerated: 0,
      net: 0,
      netType: '',
      lastUpdateDate: currentDate,
    };
    return; // first reading sets baseline; next readings add deltas
  }

  const totals = deviceTotals[deviceId];

  // New day: reset cumulative totals and baseline
  if (totals.lastUpdateDate !== currentDate) {
    totals.lastConsumed = consumption;
    totals.lastGenerated = generation;
    totals.totalConsumed = 0;
    totals.totalGenerated = 0;
    totals.net = 0;
    totals.netType = '';
    totals.lastUpdateDate = currentDate;
    return; // wait for next reading to accumulate deltas
  }

  // Accumulate only positive deltas from meter-style readings
  if (consumption > totals.lastConsumed) {
    totals.totalConsumed += consumption - totals.lastConsumed;
    totals.lastConsumed = consumption;
  }
  if (generation > totals.lastGenerated) {
    totals.totalGenerated += generation - totals.lastGenerated;
    totals.lastGenerated = generation;
  }

  // Compute net and status
  totals.net = totals.totalGenerated - totals.totalConsumed;
  totals.netType =
    totals.net > 0 ? 'export' : totals.net < 0 ? 'import' : 'neutral';
}

export function getTotals(deviceId: string) {
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
