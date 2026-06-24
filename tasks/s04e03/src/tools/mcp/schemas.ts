import { z } from "zod";

/** Grid coordinate A1–K11 */
export const gridCellSchema = z
  .string()
  .regex(
    /^[A-K](?:10|11|[1-9])$/,
    "Grid cell must be A1–K11 (e.g. F6, A10)",
  );

export const reconActionSchema = z.enum([
  "help",
  "actionCost",
  "getMap",
  "getObjects",
  "getLogs",
  "expenses",
  "searchSymbol",
]);

export const domatowoReconInputSchema = z.object({
  action: reconActionSchema.describe(
    "Read-only hub action (0 action points). Use help first to learn API.",
  ),
  symbols: z
    .array(z.string().min(1))
    .optional()
    .describe("Optional filter for getMap — tile symbols or coordinates."),
  symbol: z
    .string()
    .length(2)
    .optional()
    .describe("Required for searchSymbol — exactly 2 characters (e.g. B3)."),
});

export type DomatowoReconInput = z.infer<typeof domatowoReconInputSchema>;

export const domatowoCreateInputSchema = z.object({
  type: z.enum(["scout", "transporter"]).describe("Unit type to create."),
  passengers: z
    .number()
    .int()
    .min(1)
    .max(4)
    .optional()
    .describe("Required for transporter: scouts on board (1–4)."),
});

export type DomatowoCreateInput = z.infer<typeof domatowoCreateInputSchema>;

export const domatowoMoveInputSchema = z.object({
  object: z
    .string()
    .min(1)
    .describe("Unit id/hash from create or getObjects."),
  where: gridCellSchema.describe("Destination cell A1–K11."),
});

export type DomatowoMoveInput = z.infer<typeof domatowoMoveInputSchema>;

export const domatowoInspectInputSchema = z.object({
  object: z.string().min(1).describe("Scout id/hash to inspect current cell."),
});

export type DomatowoInspectInput = z.infer<typeof domatowoInspectInputSchema>;

export const domatowoDismountInputSchema = z.object({
  object: z.string().min(1).describe("Transporter id/hash."),
  passengers: z
    .number()
    .int()
    .min(1)
    .max(4)
    .describe("Number of scouts to dismount (1–4)."),
});

export type DomatowoDismountInput = z.infer<typeof domatowoDismountInputSchema>;

export const domatowoCallHelicopterInputSchema = z.object({
  destination: gridCellSchema.describe(
    "Cell where a scout confirmed the partisan — helicopter evacuation target.",
  ),
});

export type DomatowoCallHelicopterInput = z.infer<
  typeof domatowoCallHelicopterInputSchema
>;
