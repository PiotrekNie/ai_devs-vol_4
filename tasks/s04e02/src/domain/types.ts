export type ForecastEntry = {
  timestamp: string;
  windMs: number;
  precipitationMm?: number;
  temperatureC?: number;
};

export type TurbineMode = "idle" | "production";

export type ScheduleSlot = {
  /** Normalized `YYYY-MM-DD HH:00:00` */
  timestamp: string;
  pitchAngle: 0 | 45 | 90;
  turbineMode: TurbineMode;
  windMs: number;
};

export type PowerDeficit = {
  minKw: number;
  maxKw: number;
};

export type WindpowerHubData = Record<string, unknown>;

export type WindpowerHubResult = {
  ok: boolean;
  status: number;
  data: WindpowerHubData;
  flag: string | null;
};
