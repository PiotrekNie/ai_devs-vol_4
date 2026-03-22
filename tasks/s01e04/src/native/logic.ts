export type ShipmentCategory = "A" | "B" | "C" | "D" | "E";

/** PP per 100 km — z dokumentacji SPK §9.2 opłata trasowa */
export type RegionalBoundaries = 0 | 1 | 2;

export interface CountFeeInput {
  category: ShipmentCategory;
  /** Masa w kg (po normalizacji). */
  massKg: number;
  /** Długość trasy w km (suma odcinków). */
  distanceKm: number;
  /** Liczba przekroczeń granic regionalnych (0 = ten sam region). */
  regionalBoundaries: RegionalBoundaries;
}

export interface CountFeeResult {
  totalPP: number;
  basePP: number;
  weightPP: number;
  routePP: number;
  /** Opłata za dodatkowe wagony (55 PP × n), 0 dla A/B. */
  extraWagonPP: number;
  /** Liczba dodatkowych wagonów ponad standardowe 2×500 kg. */
  extraWagonCount: number;
  /** Zwolnienie z opłat (kat. A/B). */
  exempt: boolean;
}

const BASE_FEE: Record<ShipmentCategory, number> = {
  A: 0,
  B: 0,
  C: 2,
  D: 5,
  E: 10,
};

const EXTRA_WAGON_PP = 55;
const STANDARD_WAGON_KG = 500;
const STANDARD_WAGON_COUNT = 2;

/**
 * Konwersja opisów wagowych na kg: "2,8 tony", "2800 kg", "2.8 t", itd.
 */
export function unitNormalization(raw: string): number {
  const s = raw.trim().toLowerCase().replace(/\s+/g, " ");
  const numMatch = s.match(/(\d+(?:[.,]\d+)?)/);
  if (!numMatch) {
    throw new Error(`Nie znaleziono liczby w: ${raw}`);
  }
  const n = Number.parseFloat(numMatch[1].replace(",", "."));

  if (Number.isNaN(n) || n < 0) {
    throw new Error(`Niepoprawna liczba w: ${raw}`);
  }

  if (/\bton|t\b/.test(s) && !/\bkg\b/.test(s)) {
    return Math.round(n * 1000);
  }
  if (/\bg\b/.test(s) && !/\bkg\b/.test(s)) {
    return Math.round(n / 1000);
  }
  if (/\bkg\b|\bkilo/.test(s)) {
    return Math.round(n);
  }

  if (n > 200) {
    return Math.round(n);
  }

  return Math.round(n * 1000);
}

/**
 * Liczba dodatkowych wagonów (ponad 2×500 kg standardu), wg dodatkowe-wagony.md.
 */
export function extraWagonCount(massKg: number): number {
  const totalWagons = Math.ceil(massKg / STANDARD_WAGON_KG);
  return Math.max(0, totalWagons - STANDARD_WAGON_COUNT);
}

/**
 * Opłata wagowa wg przedziałów (§9.2). Kumulatywnie od 0.1 kg; powyżej 1000 kg stawka 7 PP/kg.
 */
export function weightComponentPP(massKg: number): number {
  if (massKg <= 0) return 0;

  let m = massKg;
  let fee = 0;

  const tiers: { width: number; rate: number }[] = [
    { width: 5 - 0.1, rate: 0.5 },
    { width: 25 - 5.1, rate: 1 },
    { width: 100 - 25.1, rate: 2 },
    { width: 500 - 100.1, rate: 3 },
    { width: 1000 - 500.1, rate: 5 },
  ];

  for (const t of tiers) {
    if (m <= 0) break;
    const chunk = Math.min(m, t.width);
    fee += chunk * t.rate;
    m -= chunk;
  }

  if (m > 0) fee += m * 7;

  return fee;
}

function routeRatePPPer100Km(boundaries: RegionalBoundaries): number {
  if (boundaries === 0) return 1;
  if (boundaries === 1) return 2;
  return 3;
}

/** Zaokrąglenie opłaty trasowej jak w przykładach dokumentacji (w górę do pełnych PP). */
export function routeComponentPP(distanceKm: number, boundaries: RegionalBoundaries): number {
  const per100 = distanceKm / 100;
  const rate = routeRatePPPer100Km(boundaries);
  return Math.ceil(per100 * rate);
}

export function countFee(input: CountFeeInput): CountFeeResult {
  const { category, massKg, distanceKm, regionalBoundaries } = input;
  const exempt = category === "A" || category === "B";

  const basePP = BASE_FEE[category];
  const weightPP = exempt ? 0 : weightComponentPP(massKg);
  const routePP = exempt ? 0 : routeComponentPP(distanceKm, regionalBoundaries);

  const extra = extraWagonCount(massKg);
  const extraWagonPP = exempt ? 0 : extra * EXTRA_WAGON_PP;

  const totalBeforeExempt = basePP + weightPP + routePP + extraWagonPP;
  const totalPP = exempt ? 0 : totalBeforeExempt;

  return {
    totalPP,
    basePP: exempt ? 0 : basePP,
    weightPP,
    routePP,
    extraWagonPP,
    extraWagonCount: extra,
    exempt,
  };
}
