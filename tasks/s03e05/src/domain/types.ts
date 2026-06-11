export type CellKind = "." | "S" | "G" | "R" | "T" | "W";

export type Direction = "up" | "down" | "left" | "right";

export type VehicleId = "rocket" | "horse" | "car" | "walk";

export type TravelMode = VehicleId;

export type Grid = {
  width: number;
  height: number;
  cells: CellKind[][];
  start: { x: number; y: number };
  goal: { x: number; y: number };
};

export type VehicleProfile = {
  id: VehicleId;
  fuelPerMove: number;
  foodPerMove: number;
  canCrossWater: boolean;
};

export type MovementRules = {
  initialFuel: number;
  initialFood: number;
  treeExtraFuel: number;
  blockedCells: Set<CellKind>;
};

export type GameConfig = {
  grid: Grid;
  vehicles: Record<VehicleId, VehicleProfile>;
  rules: MovementRules;
};

export type RouteCommand = Direction | "dismount";
