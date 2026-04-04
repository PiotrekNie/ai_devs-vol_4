/**
 * Box-drawing glyphs → wire masks (N=1, E=2, S=4, W=8). North is the top of the tile image.
 */
import { EDGE_E, EDGE_N, EDGE_S, EDGE_W } from "./symbols.ts";

/** Allowed symbols from the vision prompt (Unicode box-drawing). */
export const TILE_GLYPH_CHARS = [
  "│",
  "─",
  "└",
  "┌",
  "┐",
  "┘",
  "├",
  "┬",
  "┤",
  "┴",
] as const;

export type TileGlyphChar = (typeof TILE_GLYPH_CHARS)[number];

/** Map each glyph to the open edges (NESW bitmask). */
const GLYPH_TO_MASK: Record<TileGlyphChar, number> = {
  "│": EDGE_N | EDGE_S,
  "─": EDGE_E | EDGE_W,
  "└": EDGE_N | EDGE_E,
  "┌": EDGE_S | EDGE_E,
  "┐": EDGE_S | EDGE_W,
  "┘": EDGE_N | EDGE_W,
  "├": EDGE_N | EDGE_E | EDGE_S,
  "┬": EDGE_E | EDGE_S | EDGE_W,
  "┤": EDGE_N | EDGE_S | EDGE_W,
  "┴": EDGE_N | EDGE_E | EDGE_W,
};

export function glyphCharToMask(char: string): number | null {
  const trimmed = char.trim();
  if (trimmed.length !== 1) {
    return null;
  }
  const m = GLYPH_TO_MASK[trimmed as TileGlyphChar];
  return m !== undefined ? (m & 0xf) : null;
}
