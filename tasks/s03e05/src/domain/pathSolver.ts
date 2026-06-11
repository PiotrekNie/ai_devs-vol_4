import type {
  Direction,
  GameConfig,
  Grid,
  RouteCommand,
  TravelMode,
  VehicleId,
  VehicleProfile,
} from "./types.js";

const DIRECTIONS: Direction[] = ["up", "down", "left", "right"];

const DELTA: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

type SolverState = {
  x: number;
  y: number;
  fuel: number;
  food: number;
  mode: TravelMode;
  dismounted: boolean;
};

function roundRes(n: number): number {
  return Math.round(n * 10) / 10;
}

function stateKey(s: SolverState): string {
  return `${s.x},${s.y},${s.fuel},${s.food},${s.mode},${s.dismounted ? 1 : 0}`;
}

function cellAt(grid: Grid, x: number, y: number): string | null {
  if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) return null;
  return grid.cells[y]?.[x] ?? null;
}

function isBlocked(grid: Grid, x: number, y: number, rules: GameConfig["rules"]): boolean {
  const cell = cellAt(grid, x, y);
  if (!cell) return true;
  return rules.blockedCells.has(cell as never);
}

function effectiveProfile(
  mode: TravelMode,
  vehicles: Record<VehicleId, VehicleProfile>,
): VehicleProfile {
  return vehicles[mode];
}

function canEnterTile(
  mode: TravelMode,
  cell: string,
  profile: VehicleProfile,
): boolean {
  if (cell === "R") return false;
  if (cell === "W") return profile.canCrossWater;
  return true;
}

function moveCost(
  mode: TravelMode,
  destCell: string,
  profile: VehicleProfile,
  rules: GameConfig["rules"],
): { fuel: number; food: number } | null {
  let fuel = profile.fuelPerMove;
  const food = profile.foodPerMove;
  if (destCell === "T" && (mode === "rocket" || mode === "car")) {
    fuel += rules.treeExtraFuel;
  }
  return { fuel, food };
}

function applyMove(
  state: SolverState,
  dir: Direction,
  config: GameConfig,
): SolverState | null {
  const { grid, rules, vehicles } = config;
  const { dx, dy } = DELTA[dir];
  const nx = state.x + dx;
  const ny = state.y + dy;
  const dest = cellAt(grid, nx, ny);
  if (!dest || isBlocked(grid, nx, ny, rules)) return null;

  const profile = effectiveProfile(state.mode, vehicles);
  if (!canEnterTile(state.mode, dest, profile)) return null;

  const cost = moveCost(state.mode, dest, profile, rules);
  if (!cost) return null;

  const fuel = roundRes(state.fuel - cost.fuel);
  const food = roundRes(state.food - cost.food);
  if (fuel < 0 || food < 0) return null;

  return { x: nx, y: ny, fuel, food, mode: state.mode, dismounted: state.dismounted };
}

function applyDismount(state: SolverState): SolverState | null {
  if (state.dismounted || state.mode === "walk") return null;
  return {
    ...state,
    mode: "walk",
    dismounted: true,
  };
}

/**
 * BFS shortest command sequence to reach goal with resources >= 0.
 * Returns hub answer shape: [vehicle, ...commands].
 */
export function solveRoute(
  config: GameConfig,
  startVehicle: VehicleId,
): string[] | null {
  const { grid, rules } = config;
  const initialMode: TravelMode =
    startVehicle === "walk" ? "walk" : startVehicle;

  const initial: SolverState = {
    x: grid.start.x,
    y: grid.start.y,
    fuel: rules.initialFuel,
    food: rules.initialFood,
    mode: initialMode,
    dismounted: startVehicle === "walk",
  };

  type QueueItem = { state: SolverState; path: RouteCommand[] };
  const queue: QueueItem[] = [{ state: initial, path: [] }];
  const visited = new Set<string>();
  visited.add(stateKey(initial));

  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) break;
    const { state, path } = item;

    if (state.x === grid.goal.x && state.y === grid.goal.y) {
      return [startVehicle, ...path];
    }

    if (!state.dismounted && state.mode !== "walk") {
      const after = applyDismount(state);
      if (after) {
        const key = stateKey(after);
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ state: after, path: [...path, "dismount"] });
        }
      }
    }

    for (const dir of DIRECTIONS) {
      const next = applyMove(state, dir, config);
      if (!next) continue;
      const key = stateKey(next);
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push({ state: next, path: [...path, dir] });
    }
  }

  return null;
}

/** Try all vehicles; return shortest successful route. */
export function solveBestRoute(config: GameConfig): {
  vehicle: VehicleId;
  route: string[];
} | null {
  const order: VehicleId[] = ["rocket", "horse", "car", "walk"];
  let best: { vehicle: VehicleId; route: string[] } | null = null;

  for (const vehicle of order) {
    const route = solveRoute(config, vehicle);
    if (!route) continue;
    if (!best || route.length < best.route.length) {
      best = { vehicle, route };
    }
  }

  return best;
}
