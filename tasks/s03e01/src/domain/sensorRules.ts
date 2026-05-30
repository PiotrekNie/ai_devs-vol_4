/** Valid ranges for active sensor fields (task spec). */
export const SENSOR_RANGES = {
  temperature_K: { min: 553, max: 873 },
  pressure_bar: { min: 60, max: 160 },
  water_level_meters: { min: 5.0, max: 15.0 },
  voltage_supply_v: { min: 229.0, max: 231.0 },
  humidity_percent: { min: 40.0, max: 80.0 },
} as const;

export type SensorField = keyof typeof SENSOR_RANGES;

/** Maps JSON field → token in `sensor_type`. */
export const FIELD_TO_SENSOR: Record<SensorField, string> = {
  temperature_K: "temperature",
  pressure_bar: "pressure",
  water_level_meters: "water",
  voltage_supply_v: "voltage",
  humidity_percent: "humidity",
};

export type SensorReading = {
  sensor_type: string;
  timestamp: number;
  temperature_K: number;
  pressure_bar: number;
  water_level_meters: number;
  voltage_supply_v: number;
  humidity_percent: number;
  operator_notes: string;
};

export function activeSensorTypes(sensorType: string): Set<string> {
  return new Set(
    sensorType
      .split("/")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export function isValueInRange(field: SensorField, value: number): boolean {
  const { min, max } = SENSOR_RANGES[field];
  return value >= min && value <= max;
}

/** Measurement anomaly: inactive field ≠ 0 or active field out of range. */
export function hasMeasurementAnomaly(reading: SensorReading): boolean {
  const active = activeSensorTypes(reading.sensor_type);

  for (const [field, sensor] of Object.entries(FIELD_TO_SENSOR) as Array<
    [SensorField, string]
  >) {
    const value = reading[field];
    if (!active.has(sensor)) {
      if (value !== 0) return true;
      continue;
    }
    if (!isValueInRange(field, value)) return true;
  }

  return false;
}

/** Normalize file id to 4-digit zero-padded string. */
export function normalizeSensorId(id: string): string {
  const digits = id.replace(/\.json$/i, "").replace(/^0+/, "") || "0";
  return digits.padStart(4, "0");
}
