interface Aggregates {
  lastConsumed: number;
  lastGenerated: number;
  totalConsumed: number;
  totalGenerated: number;
  net: number;
  netType: string;
  lastUpdateDate: string;
}

const deviceTotals: Record<string, Aggregates> = {};

function getCurrentDateIST(): string {
  const date = new Date();
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const istTime = new Date(utc + (330 * 60000));
  return istTime.toISOString().slice(0, 10);
}

export function updateTotals(deviceId: string, data: any) {
  const consumption = parseFloat(data?.Consumption_kWh) || 0;
  const generation = parseFloat(data?.Generation_kWh) || 0;
  const currentDate = getCurrentDateIST();

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
    return;
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
    return;
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
