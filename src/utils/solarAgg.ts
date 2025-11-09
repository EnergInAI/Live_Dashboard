// src/utils/solarAgg.ts

interface DeviceTotals {
  lastGen: number;
  lastCons: number;
  lastTimestamp: string;
  totalImport: number;
  totalExport: number;
  totalGenerated: number;
  totalConsumed: number;
  instantNet: number;
}

const deviceData: Record<string, DeviceTotals> = {};

// Helper: get current IST date (yyyy-mm-dd)
const getISTDate = (): string => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  return ist.toISOString().split('T')[0];
};

// Helper: store daily key for resets
let currentISTDay = getISTDate();

export function updateTotals(
  deviceId: string,
  payload: { Generation_kWh: number; Consumption_kWh: number; timestamp: string }
) {
  const { Generation_kWh, Consumption_kWh, timestamp } = payload;

  // Reset all devices at midnight IST
  const todayIST = getISTDate();
  if (todayIST !== currentISTDay) {
    Object.keys(deviceData).forEach((id) => {
      deviceData[id].totalImport = 0;
      deviceData[id].totalExport = 0;
      deviceData[id].totalGenerated = 0;
      deviceData[id].totalConsumed = 0;
      deviceData[id].lastGen = 0;
      deviceData[id].lastCons = 0;
    });
    currentISTDay = todayIST;
  }

  if (!deviceData[deviceId]) {
    deviceData[deviceId] = {
      lastGen: Generation_kWh,
      lastCons: Consumption_kWh,
      lastTimestamp: timestamp,
      totalImport: 0,
      totalExport: 0,
      totalGenerated: Generation_kWh,
      totalConsumed: Consumption_kWh,
      instantNet: Generation_kWh - Consumption_kWh,
    };
    return;
  }

  const dev = deviceData[deviceId];

  // Skip duplicate timestamps
  if (timestamp === dev.lastTimestamp) return;

  // Handle rollover (meter reset)
  const genDelta = Generation_kWh >= dev.lastGen ? Generation_kWh - dev.lastGen : Generation_kWh;
  const consDelta = Consumption_kWh >= dev.lastCons ? Consumption_kWh - dev.lastCons : Consumption_kWh;

  const deltaNet = genDelta - consDelta;

  // Filter noise
  if (Math.abs(deltaNet) < 0.001) return;

  // Accumulate daily import/export
  if (deltaNet > 0) dev.totalExport += deltaNet;
  else dev.totalImport += Math.abs(deltaNet);

  dev.totalGenerated += genDelta;
  dev.totalConsumed += consDelta;
  dev.instantNet = Generation_kWh - Consumption_kWh;
  dev.lastGen = Generation_kWh;
  dev.lastCons = Consumption_kWh;
  dev.lastTimestamp = timestamp;
}

export function getTotals(deviceId: string) {
  const dev = deviceData[deviceId];
  if (!dev) {
    return {
      instantNet: 0,
      totalImport: 0,
      totalExport: 0,
      totalGenerated: 0,
      totalConsumed: 0,
    };
  }
  return {
    instantNet: dev.instantNet,
    totalImport: Math.max(0, dev.totalImport),
    totalExport: Math.max(0, dev.totalExport),
    totalGenerated: Math.max(0, dev.totalGenerated),
    totalConsumed: Math.max(0, dev.totalConsumed),
  };
}
