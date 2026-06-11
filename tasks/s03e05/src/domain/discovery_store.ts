import {
  buildGameConfig,
  defaultMovementRules,
  defaultVehicleProfiles,
  enrichRulesFromBooks,
  parseGridFromMaps,
  parseVehicleProfile,
  type BooksHubResponse,
  type MapsHubResponse,
  type VehicleHubResponse,
} from "./parseHubResponses.js";
import type { GameConfig, Grid, VehicleId, VehicleProfile } from "./types.js";

export type DiscoveryState = {
  rawByPath: Record<string, unknown[]>;
  grid: Grid | null;
  vehicles: Partial<Record<VehicleId, VehicleProfile>>;
  rulesReady: boolean;
};

const state: DiscoveryState = {
  rawByPath: {},
  grid: null,
  vehicles: {},
  rulesReady: false,
};

export function resetDiscoveryStore(): void {
  state.rawByPath = {};
  state.grid = null;
  state.vehicles = {};
  state.rulesReady = false;
}

export function getDiscoveryState(): Readonly<DiscoveryState> {
  return state;
}

export function recordHubResponse(path: string, data: unknown): void {
  const key = path.replace(/^\/+/, "").replace(/^api\//, "");
  if (!state.rawByPath[key]) state.rawByPath[key] = [];
  state.rawByPath[key].push(data);

  if (key === "maps") {
    const grid = parseGridFromMaps(data as MapsHubResponse);
    if (grid) state.grid = grid;
  }

  if (key === "wehicles") {
    const profile = parseVehicleProfile(data as VehicleHubResponse);
    if (profile) state.vehicles[profile.id] = profile;
  }

  if (key === "books") {
    const rules = enrichRulesFromBooks(
      defaultMovementRules(),
      data as BooksHubResponse,
    );
    if ((data as BooksHubResponse).notes?.length) {
      state.rulesReady = true;
      void rules;
    }
  }
}

export function isReadyForSolver(): { ready: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!state.grid) {
    missing.push("map (hub_query path: maps, query: Skolwin)");
  }
  const vehicleCount = Object.keys(state.vehicles).length;
  if (vehicleCount < 4) {
    missing.push(
      `vehicles optional but recommended (${vehicleCount}/4 — wehicles: rocket, horse, car, walk)`,
    );
  }
  if (!state.rulesReady) {
    missing.push(
      "movement rules optional (books: movement, water, trees) — defaults used if missing",
    );
  }
  return { ready: state.grid !== null, missing };
}

export function buildConfigFromDiscovery(): GameConfig | null {
  const check = isReadyForSolver();
  if (!check.ready || !state.grid) return null;

  const rules = defaultMovementRules();
  const booksRaw = state.rawByPath["books"];
  if (booksRaw?.length) {
    for (const entry of booksRaw) {
      enrichRulesFromBooks(rules, entry as BooksHubResponse);
    }
    state.rulesReady = true;
  }

  const vehicles = { ...defaultVehicleProfiles(), ...state.vehicles };
  return buildGameConfig(state.grid, vehicles, rules);
}

export function listRecordedPaths(): string[] {
  return Object.keys(state.rawByPath);
}
