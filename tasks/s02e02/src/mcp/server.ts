import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  handleApplyRotations,
  handleApplyRotationsForCell,
  handleFetchBoard,
  handlePlanRotations,
  handleReadBoard,
  handleReadBoardState,
  handleReadBoardStateConsensus,
  handleResetBoard,
  handleRotateCell,
  handleSolveBoard,
  handleSplitImageToGrid,
} from "../agent/toolHandlers.ts";
import { resolveTargetMasks } from "../target.ts";

const masks3x3 = z
  .array(z.array(z.number().int().min(0).max(15)).length(3))
  .length(3);

const rotations3x3 = z
  .array(z.array(z.number().int().min(0).max(3)).length(3))
  .length(3);

let cachedTarget: number[][] | null = null;

async function targetMasks(): Promise<number[][]> {
  if (!cachedTarget) {
    cachedTarget = await resolveTargetMasks();
  }
  return cachedTarget;
}

let lastMasks: number[][] | null = null;

export function createElectricityMcpServer() {
  const server = new McpServer(
    { name: "s02e02-electricity", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  server.registerTool(
    "fetch_board",
    {
      description: "Fetch live electricity board PNG metadata (optional reset).",
      inputSchema: z.object({
        reset: z.boolean().optional(),
      }),
    },
    async ({ reset }) => ({
      content: [{ type: "text", text: JSON.stringify(await handleFetchBoard({ reset })) }],
    }),
  );

  server.registerTool(
    "read_board",
    {
      description:
        "B&W, grid detection, 9 padded tile crops, vision masks (preferred deterministic path).",
      inputSchema: z.object({
        imageUrl: z.string().url().optional(),
      }),
    },
    async ({ imageUrl }) => {
      const r = await handleReadBoard({ imageUrl });
      lastMasks = r.masks;
      return { content: [{ type: "text", text: JSON.stringify(r) }] };
    },
  );

  server.registerTool(
    "read_board_state",
    {
      description: "Vision-read board into 3×3 masks (full frame).",
      inputSchema: z.object({
        imageUrl: z.string().url().optional(),
      }),
    },
    async ({ imageUrl }) => {
      const r = await handleReadBoardState({ imageUrl });
      lastMasks = r.masks;
      return { content: [{ type: "text", text: JSON.stringify(r) }] };
    },
  );

  server.registerTool(
    "read_board_state_consensus",
    {
      description:
        "Two agreeing full-frame vision reads (see ELECTRICITY_VISION_CONSENSUS_ROUNDS); same mask format as read_board_state.",
      inputSchema: z.object({
        imageUrl: z.string().url().optional(),
      }),
    },
    async ({ imageUrl }) => {
      const r = await handleReadBoardStateConsensus({ imageUrl });
      lastMasks = r.masks;
      return { content: [{ type: "text", text: JSON.stringify(r) }] };
    },
  );

  server.registerTool(
    "splitImageToGrid",
    {
      description:
        "B&W square crop, grid detection, padded tiles, vision masks (same as read_board with extra crop options).",
      inputSchema: z.object({
        imageUrl: z.string().url().optional(),
        cropInset: z.number().min(0).max(0.45).optional(),
        boardCrop: z.enum(["center", "vision"]).optional(),
      }),
    },
    async ({ imageUrl, cropInset, boardCrop }) => {
      const r = await handleSplitImageToGrid({
        imageUrl,
        cropInset,
        boardCrop,
      });
      lastMasks = r.masks;
      return { content: [{ type: "text", text: JSON.stringify(r) }] };
    },
  );

  server.registerTool(
    "solve_board",
    {
      description:
        "Deterministic solver: 3×3 rotation counts 0–3 from current to target masks (no LLM).",
      inputSchema: z.object({
        current: masks3x3,
        target: masks3x3.optional(),
      }),
    },
    async ({ current, target }) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(
            handleSolveBoard({
              current,
              target: target ?? (await targetMasks()),
            }),
          ),
        },
      ],
    }),
  );

  server.registerTool(
    "apply_rotations",
    {
      description:
        "Row-major: apply rotations[r][c] right turns per cell via POST /verify; early exit on flag.",
      inputSchema: z.object({
        rotations: rotations3x3,
      }),
    },
    async ({ rotations }) => ({
      content: [
        { type: "text", text: JSON.stringify(await handleApplyRotations({ rotations })) },
      ],
    }),
  );

  server.registerTool(
    "plan_rotations",
    {
      description: "Plan rotations from current to target masks.",
      inputSchema: z.object({
        current: masks3x3,
        target: masks3x3,
      }),
    },
    async (input) => ({
      content: [{ type: "text", text: JSON.stringify(handlePlanRotations(input)) }],
    }),
  );

  server.registerTool(
    "rotate_cell",
    {
      description: "POST /verify with one cell rotation.",
      inputSchema: z.object({
        rotate: z.string().regex(/^[123]x[123]$/),
      }),
    },
    async (input) => ({
      content: [{ type: "text", text: JSON.stringify(await handleRotateCell(input)) }],
    }),
  );

  server.registerTool(
    "reset_board",
    {
      description: "Reset hub board.",
      inputSchema: z.object({}),
    },
    async () => ({
      content: [{ type: "text", text: JSON.stringify(await handleResetBoard()) }],
    }),
  );

  server.registerTool(
    "apply_rotations_for_cell",
    {
      description: "Apply multiple right rotations at one cell with verification.",
      inputSchema: z.object({
        cell: z.string().regex(/^[123]x[123]$/),
        count: z.number().int().min(1).max(4),
      }),
    },
    async ({ cell, count }) => {
      if (!lastMasks) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "call_read_board_state_first",
              }),
            },
          ],
        };
      }
      const r = await handleApplyRotationsForCell({
        cell,
        count,
        previousMasks: lastMasks,
        targetMasks: await targetMasks(),
      });
      return { content: [{ type: "text", text: JSON.stringify(r) }] };
    },
  );

  return server;
}
