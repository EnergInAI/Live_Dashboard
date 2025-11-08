interface Aggregates {
  baseConsumed: number; 
  baseGenerated: number;
  totalConsumed: number;
  totalGenerated: number;
  net: number;
  netType: string;
  lastUpdateDate: string; 
}

const deviceTotals: Record<string, Aggregates> = {};

function getCurrentDateIST(): string {
  const date = new Date();
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const istTime = new Date(utc + 330 * 60000);
  return istTime.toISOString().slice(0, 10);
}

function readKWh(data: any) {
  const c = parseFloat(data?.Consumption_kWh ?? data?.CN?.kWh ?? '') || 0;
  const g = parseFloat(data?.Generation_kWh ?? data?.GN?.kWh ?? '') || 0;
  return { c, g };
}

export function updateTotals(deviceId: string, data: any) {
  const { c, g } = readKWh(data);
  const currentDate = getCurrentDateIST();

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

  // Simply compute difference from baseline each update, no accumulate logic
  agg.totalConsumed = Math.max(0, c - agg.baseConsumed);
  agg.totalGenerated = Math.max(0, g - agg.baseGenerated);

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
