import { z } from "zod";

export const blockSchema = z.object({
  col: z.number().int(),
  top_row: z.number().int(),
  bottom_row: z.number().int(),
  direction: z.enum(["up", "down"]),
});

export const playerSchema = z.object({
  col: z.number().int(),
  row: z.number().int(),
});

export const goalSchema = z.object({
  col: z.number().int(),
  row: z.number().int(),
});

export const reactorHubResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  board: z.array(z.array(z.string())).optional(),
  player: playerSchema.optional(),
  goal: goalSchema.optional(),
  blocks: z.array(blockSchema).optional(),
  reached_goal: z.boolean().optional(),
});

export type Block = z.infer<typeof blockSchema>;
export type Player = z.infer<typeof playerSchema>;
export type Goal = z.infer<typeof goalSchema>;
export type ReactorHubResponse = z.infer<typeof reactorHubResponseSchema>;

export type Command = "start" | "reset" | "left" | "wait" | "right";

export type GameState = {
  player: Player;
  blocks: Block[];
  goal: Goal;
};

export const MOVE_COMMANDS = ["right", "wait", "left"] as const satisfies readonly Command[];
