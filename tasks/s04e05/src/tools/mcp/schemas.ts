import { z } from "zod";

export const fwDatabaseSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe(
      "Read-only SQL or meta command: SELECT ..., show tables, " +
        "show create table table_name, .schema, .schema table_name.",
    ),
});

export const fwSignatureSchema = z.object({
  login: z.string().min(1).describe("User login from users table"),
  birthday: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe("YYYY-MM-DD matching users.birthday for login"),
  destination: z
    .number()
    .int()
    .describe("destination_id from destinations table for target city"),
});

export const fwOrdersSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("get"),
    id: z.string().optional().describe("Optional order id; omit for all orders"),
  }),
  z.object({
    action: z.literal("create"),
    title: z.string().min(1).describe("Human-readable order title"),
    creatorID: z
      .number()
      .int()
      .describe("Existing user_id from users table"),
    destination: z
      .number()
      .int()
      .describe("Numeric destination_id for target city"),
    signature: z
      .string()
      .min(1)
      .describe("SHA1 hash from fw_signature for creatorID + destination"),
  }),
  z.object({
    action: z.literal("append"),
    id: z.string().min(1).describe("Order id from create or get"),
    name: z
      .string()
      .optional()
      .describe("Single item name when using single-item append mode"),
    items: z
      .union([
        z.number().int(),
        z.record(z.string(), z.number().int()),
        z.array(
          z.object({
            name: z.string(),
            items: z.number().int(),
          }),
        ),
      ])
      .optional()
      .describe(
        "Quantity (single mode with name), batch map {good: qty}, or array of {name, items}",
      ),
  }),
  z.object({
    action: z.literal("delete"),
    id: z.string().min(1).describe("Order id to delete entirely"),
  }),
]);

export type FwOrdersInput = z.infer<typeof fwOrdersSchema>;
export type FwDatabaseInput = z.infer<typeof fwDatabaseSchema>;
export type FwSignatureInput = z.infer<typeof fwSignatureSchema>;
