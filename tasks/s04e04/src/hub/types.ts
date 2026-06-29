import { z } from "zod";

export const filesystemActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("createDirectory"),
    path: z.string().min(1),
  }),
  z.object({
    action: z.literal("createFile"),
    path: z.string().min(1),
    content: z.string(),
  }),
  z.object({
    action: z.literal("deleteFile"),
    path: z.string().min(1),
  }),
  z.object({
    action: z.literal("deleteDirectory"),
    path: z.string().min(1),
  }),
  z.object({
    action: z.literal("reset"),
  }),
]);

export type FilesystemAction = z.infer<typeof filesystemActionSchema>;

export type FilesystemSingleAnswer =
  | { action: "help" }
  | { action: "done" }
  | { action: "listFiles"; path?: string }
  | { action: "reset" }
  | FilesystemAction;

export type FilesystemAnswer = FilesystemSingleAnswer | FilesystemAction[];

export type FilesystemHubResponse = {
  code?: number;
  message?: string;
  path?: string;
  entries?: unknown[];
  limits?: Record<string, unknown>;
  actions?: unknown[];
  batch_mode?: Record<string, unknown>;
};
