/**
 * plan_route MCP — deterministic route solver using discovery_store data.
 */

import { z } from "zod";
import { mcpErr, mcpOk, type McpToolResponse } from "@ai-devs/agent-boilerplate";
import {
  buildConfigFromDiscovery,
  isReadyForSolver,
} from "../../domain/discovery_store.js";
import { solveBestRoute, solveRoute } from "../../domain/pathSolver.js";
import type { VehicleId } from "../../domain/types.js";

const VEHICLE_IDS = ["rocket", "horse", "car", "walk"] as const;

export const planRouteInputSchema = z.object({
  vehicle: z
    .enum(VEHICLE_IDS)
    .optional()
    .describe(
      "Starting vehicle (exact hub name). If omitted, solver picks the shortest valid route among all vehicles.",
    ),
});

export type PlanRouteInput = z.infer<typeof planRouteInputSchema>;

export async function executePlanRoute(
  args: PlanRouteInput,
): Promise<McpToolResponse> {
  const readiness = isReadyForSolver();
  if (!readiness.ready) {
    return mcpErr(
      `Discovery incomplete. Missing: ${readiness.missing.join("; ")}. ` +
        "Use hub_query with English queries before plan_route.",
    );
  }

  const config = buildConfigFromDiscovery();
  if (!config) {
    return mcpErr("Failed to build game config from discovery store.");
  }

  if (args.vehicle) {
    const route = solveRoute(config, args.vehicle as VehicleId);
    if (!route) {
      const best = solveBestRoute(config);
      if (best) {
        return mcpOk(
          JSON.stringify({
            ok: false,
            message: `No route for vehicle "${args.vehicle}". Best alternative: ${best.vehicle}`,
            suggested_vehicle: best.vehicle,
            route: best.route,
            step_count: best.route.length - 1,
          }),
        );
      }
      return mcpErr(`No valid route found for vehicle "${args.vehicle}".`);
    }
    return mcpOk(
      JSON.stringify({
        ok: true,
        vehicle: args.vehicle,
        route,
        step_count: route.length - 1,
        hint: "Submit with submit_to_hub(task_name: savethem, answer: route)",
      }),
    );
  }

  const best = solveBestRoute(config);
  if (!best) {
    return mcpErr("Solver found no valid route for any vehicle.");
  }

  return mcpOk(
    JSON.stringify({
      ok: true,
      vehicle: best.vehicle,
      route: best.route,
      step_count: best.route.length - 1,
      hint: "Submit with submit_to_hub(task_name: savethem, answer: route)",
    }),
  );
}
