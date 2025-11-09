interface Aggregates {
  baseConsumed: number;     // First kWh consumption reading for the day
  baseGenerated: number;    // First kWh generation reading for the day
  prevConsumed: number;     // Previous consumption reading for delta calc
  prevGenerated: number;    // Previous generation reading for delta calc
  totalImport: number;      // Daily cumulative import from grid (kWh)
  totalExport: number;      // Daily cumulative export to grid (kWh)
  lastUpdateDate: string;   // Date string "YYYY-MM-DD" for daily reset
  lastTimestamp: number;    // Unix timestamp of last update to prevent duplicates
}

// In-memory store for device aggregates
const deviceTotals: Record<string, Aggregates> = {};

// Helper to get the current date in IST timezone (UTC+5:30)
function getCurrentDateIST(): string {
  const date = new Date();
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const istTime = new Date(utc + 330 * 60000); // IST offset
  return istTime.toISOString().slice(0, 10);
}

// Helper to safely read kWh values from various possible payload structures
function readKWh(data: any): { c: number; g: number; isValid: boolean } {
  try {
    const c = parseFloat(
      data?.Consumption_kWh ??
      data?.CN?.kWh ??
      data?.consumption_kWh ??
      ''
    );
    const g = parseFloat(
      data?.Generation_kWh ??
      data?.GN?.kWh ??
      data?.generation_kWh ??
      ''
    );

    // Validate that we have actual numeric readings
    const cValid = !isNaN(c) && isFinite(c) && c >= 0;
    const gValid = !isNaN(g) && isFinite(g) && g >= 0;

    return {
      c: cValid ? c : 0,
      g: gValid ? g : 0,
      isValid: cValid || gValid, // At least one valid reading required
    };
  } catch (error) {
    console.error('❌ Error reading kWh values:', error);
    return { c: 0, g: 0, isValid: false };
  }
}

export function updateTotals(deviceId: string, data: any): boolean {
  try {
    if (!deviceId || !data) {
      console.warn('⚠️ Invalid deviceId or data provided to updateTotals');
      return false;
    }

    const { c, g, isValid } = readKWh(data);
    if (!isValid) {
      console.warn('⚠️ No valid kWh readings in payload');
      return false;
    }

    const currentDate = getCurrentDateIST();
    const currentTimestamp = Date.now();

    // Initialize or reset on new day
    if (!deviceTotals[deviceId] || deviceTotals[deviceId].lastUpdateDate !== currentDate) {
      console.log(`🔄 Resetting daily totals for ${deviceId} on ${currentDate}`);
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
      return true; // Baseline set, skip delta calculation
    }

    const agg = deviceTotals[deviceId];

    // Prevent duplicate processing of same reading
    if (currentTimestamp <= agg.lastTimestamp) {
      return false; // Skip stale or duplicate data
    }

    // Calculate deltas since last reading
    const deltaConsumed = c - agg.prevConsumed;
    const deltaGenerated = g - agg.prevGenerated;

    // Handle meter rollover or invalid negative deltas
    if (deltaConsumed < 0 || deltaGenerated < 0) {
      console.warn(`⚠️ Meter rollover detected for ${deviceId}, resetting baseline`);
      // Treat as new baseline rather than skipping
      agg.baseConsumed = c;
      agg.baseGenerated = g;
      agg.prevConsumed = c;
      agg.prevGenerated = g;
      return false;
    }

    // Ignore trivial changes (noise filtering, < 0.001 kWh = 1 Wh)
    const deltaThreshold = 0.001;
    if (Math.abs(deltaConsumed) < deltaThreshold && Math.abs(deltaGenerated) < deltaThreshold) {
      return false; // No meaningful change
    }

    // Calculate net energy flow for this interval
    const deltaNet = deltaGenerated - deltaConsumed;

    // Accumulate import or export based on net flow direction
    if (deltaNet > 0) {
      // Exporting to grid (generation exceeded consumption)
      agg.totalExport += deltaNet;
    } else if (deltaNet < 0) {
      // Importing from grid (consumption exceeded generation)
      agg.totalImport += Math.abs(deltaNet);
    }
    // If deltaNet === 0, balanced, no change to totals

    // Update previous readings for next delta calculation
    agg.prevConsumed = c;
    agg.prevGenerated = g;
    agg.lastTimestamp = currentTimestamp;

    return true; // Successfully updated
  } catch (error) {
    console.error(`❌ Error in updateTotals for ${deviceId}:`, error);
    return false;
  }
}

export function getTotals(deviceId: string): {
  totalImport: number;
  totalExport: number;
} {
  try {
    if (!deviceId) {
      return { totalImport: 0, totalExport: 0 };
    }

    const agg = deviceTotals[deviceId];
    
    // Verify data is from today, otherwise reset
    if (agg && agg.lastUpdateDate === getCurrentDateIST()) {
      return {
        totalImport: Math.max(0, agg.totalImport), // Ensure non-negative
        totalExport: Math.max(0, agg.totalExport),
      };
    }

    return { totalImport: 0, totalExport: 0 };
  } catch (error) {
    console.error(`❌ Error in getTotals for ${deviceId}:`, error);
    return { totalImport: 0, totalExport: 0 };
  }
}
