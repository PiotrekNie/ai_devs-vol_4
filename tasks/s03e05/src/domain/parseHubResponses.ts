import type {
  CellKind,
  GameConfig,
  Grid,
  MovementRules,
  VehicleId,
  VehicleProfile,
} from "./types.js";

const VEHICLE_IDS: VehicleId[] = ["rocket", "horse", "car", "walk"];

export type MapsHubResponse = {
  code?: number;
  cityName?: string;
  map?: string[][];
};

export type VehicleHubResponse = {
  code?: number;
  name?: string;
  consumption?: { fuel?: number; food?: number };
  note?: string;
};

export type BooksHubResponse = {
  code?: number;
  notes?: Array<{ id?: string; content?: string }>;
};

export function parseGridFromMaps(data: MapsHubResponse): Grid | null {
  const map = data.map;
  if (!map?.length || !map[0]?.length) return null;

  const height = map.length;
  const width = map[0].length;
  const cells = map.map((row) =>
    row.map((c) => (c.length === 1 ? c : ".") as CellKind),
  );

  let start = { x: 0, y: 0 };
  let goal = { x: width - 1, y: height - 1 };
  let foundStart = false;
  let foundGoal = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = cells[y]?.[x];
      if (cell === "S") {
        start = { x, y };
        foundStart = true;
      }
      if (cell === "G") {
        goal = { x, y };
        foundGoal = true;
      }
    }
  }

  if (!foundStart || !foundGoal) return null;

  return { width, height, cells, start, goal };
}

export function parseVehicleProfile(data: VehicleHubResponse): VehicleProfile | null {
  const id = data.name?.toLowerCase() as VehicleId | undefined;
  if (!id || !VEHICLE_IDS.includes(id)) return null;

  const fuel = data.consumption?.fuel ?? 0;
  const food = data.consumption?.food ?? 0;

  const note = (data.note ?? "").toLowerCase();
  const canCrossWater =
    id === "horse" ||
    id === "walk" ||
    (note.includes("water") && note.includes("horse"));

  return {
    id,
    fuelPerMove: fuel,
    foodPerMove: food,
    canCrossWater: id === "horse" || id === "walk",
  };
}

export function defaultMovementRules(): MovementRules {
  return {
    initialFuel: 10,
    initialFood: 10,
    treeExtraFuel: 0.2,
    blockedCells: new Set<CellKind>(["R"]),
  };
}

export function enrichRulesFromBooks(
  rules: MovementRules,
  books: BooksHubResponse,
): MovementRules {
  const text = (books.notes ?? []).map((n) => n.content ?? "").join(" ");
  const out = { ...rules, blockedCells: new Set(rules.blockedCells) };
  if (text.includes("R marks rocks that block movement")) {
    out.blockedCells.add("R");
  }
  return out;
}

export function buildGameConfig(
  grid: Grid,
  vehicles: Partial<Record<VehicleId, VehicleProfile>>,
  rules?: MovementRules,
): GameConfig | null {
  const required: VehicleId[] = ["rocket", "horse", "car", "walk"];
  const full: Partial<Record<VehicleId, VehicleProfile>> = { ...vehicles };

  for (const id of required) {
    if (!full[id]) {
      full[id] = defaultVehicleProfiles()[id];
    }
  }

  return {
    grid,
    vehicles: full as Record<VehicleId, VehicleProfile>,
    rules: rules ?? defaultMovementRules(),
  };
}

export function defaultVehicleProfiles(): Record<VehicleId, VehicleProfile> {
  return {
    rocket: {
      id: "rocket",
      fuelPerMove: 1,
      foodPerMove: 0.1,
      canCrossWater: false,
    },
    horse: {
      id: "horse",
      fuelPerMove: 0,
      foodPerMove: 1.6,
      canCrossWater: true,
    },
    car: {
      id: "car",
      fuelPerMove: 0.7,
      foodPerMove: 1,
      canCrossWater: false,
    },
    walk: {
      id: "walk",
      fuelPerMove: 0,
      foodPerMove: 2.5,
      canCrossWater: true,
    },
  };
}
