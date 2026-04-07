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
} from "./toolHandlers.ts";
import type { OpenAiFunctionTool } from "../openrouter/chat.ts";

const cellRe = /^[123]x[123]$/;

const masks3x3 = z
  .array(z.array(z.number().int().min(0).max(15)).length(3))
  .length(3);

const rotations3x3 = z
  .array(z.array(z.number().int().min(0).max(3)).length(3))
  .length(3);

const maskGridSchema = {
  type: "array",
  minItems: 3,
  maxItems: 3,
  items: {
    type: "array",
    minItems: 3,
    maxItems: 3,
    items: { type: "integer", minimum: 0, maximum: 15 },
  },
} as const;

const rotationGridSchema = {
  type: "array",
  minItems: 3,
  maxItems: 3,
  items: {
    type: "array",
    minItems: 3,
    maxItems: 3,
    items: { type: "integer", minimum: 0, maximum: 3 },
  },
} as const;

/** OpenAI-style function tools for POST /chat/completions (no Vercel AI SDK). */
export const ELECTRICITY_OPENROUTER_TOOLS: OpenAiFunctionTool[] = [
  {
    type: "function",
    function: {
      name: "fetch_board",
      description:
        "Download metadata for the current electricity board PNG from the hub (optional reset=1 to restart).",
      parameters: {
        type: "object",
        properties: {
          reset: {
            type: "boolean",
            description: "If true, resets the board on the hub before the next read.",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_board",
      description:
        "Deterministic perception: B&W image, detect grid lines, cut 9 cells with 12px padding, then 9 separate vision calls (per-edge JSON analysis → NESW mask). Optional extra tile inset via ELECTRICITY_TILE_VISION_INSET_FRAC. Preferred over read_board_state for stable tiles.",
      parameters: {
        type: "object",
        properties: {
          imageUrl: {
            type: "string",
            description: "Override image URL (defaults to live hub PNG).",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_board_state",
      description:
        "Vision-read the full PNG into a 3×3 mask grid (N=1,E=2,S=4,W=8). Uses the live board URL unless imageUrl is set.",
      parameters: {
        type: "object",
        properties: {
          imageUrl: {
            type: "string",
            description: "Override image URL (defaults to live hub PNG).",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_board_state_consensus",
      description:
        "Like read_board_state but runs two (or more) full-frame vision reads until two grids agree, then optional tie-break read. Respects ELECTRICITY_VISION_CONSENSUS_ROUNDS.",
      parameters: {
        type: "object",
        properties: {
          imageUrl: {
            type: "string",
            description: "Override image URL (defaults to live hub PNG).",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "split_image_to_grid",
      description:
        "B&W → square crop (center or vision bbox) → grid line detection → 9 tiles with 12px padding → 9× per-tile edge vision (same as read_board). Same mask format as read_board_state.",
      parameters: {
        type: "object",
        properties: {
          imageUrl: {
            type: "string",
            description: "Override image URL (defaults to live hub PNG).",
          },
          cropInset: {
            type: "number",
            minimum: 0,
            maximum: 0.45,
            description:
              "When boardCrop is center: shrink the square toward the middle (fraction of side per edge).",
          },
          boardCrop: {
            type: "string",
            enum: ["center", "vision"],
            description:
              "center: min-dimension center crop; vision: extra LLM call to locate the grid square first.",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "solve_board",
      description:
        "Deterministic solver: no LLM. Returns 3×3 rotation counts 0–3 per cell (right turns) from current masks to target, with topology check and piece-family grouping. Uses target from context unless overridden.",
      parameters: {
        type: "object",
        properties: {
          current: { ...maskGridSchema, description: "Current 3×3 masks." },
          target: {
            ...maskGridSchema,
            description: "Defaults to the task target masks from the agent context.",
          },
        },
        required: ["current"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "apply_rotations",
      description:
        "Send POST /verify for each cell in row-major order: apply rotations[r][c] right turns (0–3). Stops early if {FLG:...} appears. No LLM.",
      parameters: {
        type: "object",
        properties: {
          rotations: {
            ...rotationGridSchema,
            description: "Per-cell rotation counts 0–3.",
          },
        },
        required: ["rotations"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "plan_rotations",
      description:
        "Same math as solve_board but returns planner-style cell list and flat sequence. Does not call the hub.",
      parameters: {
        type: "object",
        properties: {
          current: { ...maskGridSchema, description: "Current 3×3 masks." },
          target: { ...maskGridSchema, description: "Target 3×3 masks." },
        },
        required: ["current", "target"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "rotate_cell",
      description: "Send a single POST /verify rotation for one cell (one 90° right turn).",
      parameters: {
        type: "object",
        properties: {
          rotate: {
            type: "string",
            description: 'Cell id, e.g. "2x3".',
            pattern: "^(1|2|3)x(1|2|3)$",
          },
        },
        required: ["rotate"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reset_board",
      description: "Reset the hub board via ?reset=1 on the PNG URL.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "apply_rotations_for_cell",
      description:
        "Apply `count` consecutive right rotations at `cell`, checking each response for {FLG:...}. Then re-reads the board and compares vision to the expected mask after rotating the previous mask.",
      parameters: {
        type: "object",
        properties: {
          cell: { type: "string", pattern: "^(1|2|3)x(1|2|3)$" },
          count: { type: "integer", minimum: 1, maximum: 4 },
        },
        required: ["cell", "count"],
        additionalProperties: false,
      },
    },
  },
];

export function buildElectricityOpenRouterTools(ctx: {
  getTargetMasks: () => number[][];
  getLastMasks: () => number[][] | null;
  setLastMasks: (m: number[][]) => void;
}): {
  definitions: OpenAiFunctionTool[];
  execute: (name: string, argsJson: string) => Promise<unknown>;
} {
  const parseArgs = (json: string): unknown => {
    try {
      return JSON.parse(json) as unknown;
    } catch {
      throw new Error(`Invalid tool arguments JSON: ${json.slice(0, 200)}`);
    }
  };

  return {
    definitions: ELECTRICITY_OPENROUTER_TOOLS,
    async execute(name: string, argsJson: string): Promise<unknown> {
      const raw = parseArgs(argsJson);

      switch (name) {
        case "fetch_board": {
          const a = z.object({ reset: z.boolean().optional() }).parse(raw);
          return handleFetchBoard({ reset: a.reset });
        }
        case "read_board": {
          const a = z.object({ imageUrl: z.string().url().optional() }).parse(raw);
          const r = await handleReadBoard({ imageUrl: a.imageUrl });
          ctx.setLastMasks(r.masks);
          return r;
        }
        case "read_board_state": {
          const a = z.object({ imageUrl: z.string().url().optional() }).parse(raw);
          const r = await handleReadBoardState({ imageUrl: a.imageUrl });
          ctx.setLastMasks(r.masks);
          return r;
        }
        case "read_board_state_consensus": {
          const a = z.object({ imageUrl: z.string().url().optional() }).parse(raw);
          const r = await handleReadBoardStateConsensus({ imageUrl: a.imageUrl });
          ctx.setLastMasks(r.masks);
          return r;
        }
        case "split_image_to_grid": {
          const a = z
            .object({
              imageUrl: z.string().url().optional(),
              cropInset: z.number().min(0).max(0.45).optional(),
              boardCrop: z.enum(["center", "vision"]).optional(),
            })
            .parse(raw);
          const r = await handleSplitImageToGrid({
            imageUrl: a.imageUrl,
            cropInset: a.cropInset,
            boardCrop: a.boardCrop,
          });
          ctx.setLastMasks(r.masks);
          return r;
        }
        case "solve_board": {
          const a = z
            .object({
              current: masks3x3,
              target: masks3x3.optional(),
            })
            .parse(raw);
          return handleSolveBoard({
            current: a.current,
            target: a.target ?? ctx.getTargetMasks(),
          });
        }
        case "apply_rotations": {
          const a = z.object({ rotations: rotations3x3 }).parse(raw);
          return handleApplyRotations({ rotations: a.rotations });
        }
        case "plan_rotations": {
          const a = z.object({ current: masks3x3, target: masks3x3 }).parse(raw);
          return handlePlanRotations({ current: a.current, target: a.target });
        }
        case "rotate_cell": {
          const a = z
            .object({
              rotate: z.string().regex(cellRe),
            })
            .parse(raw);
          return handleRotateCell(a);
        }
        case "reset_board": {
          z.object({}).passthrough().parse(raw);
          return handleResetBoard();
        }
        case "apply_rotations_for_cell": {
          const a = z
            .object({
              cell: z.string().regex(cellRe),
              count: z.number().int().min(1).max(4),
            })
            .parse(raw);
          const previous = ctx.getLastMasks();
          if (!previous) {
            return {
              ok: false,
              error: "call_read_board_state_first",
              cell: a.cell,
              count: a.count,
            };
          }
          return handleApplyRotationsForCell({
            cell: a.cell,
            count: a.count,
            previousMasks: previous,
            targetMasks: ctx.getTargetMasks(),
          });
        }
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    },
  };
}
