import sharp from "sharp";

/**
 * Grayscale + global threshold → high-contrast black/white PNG (helps grid detection and vision).
 */
export async function toGrayscaleBinaryPng(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .greyscale()
    .normalize()
    .threshold(128)
    .png()
    .toBuffer();
}

export interface RawBinary {
  data: Uint8Array;
  width: number;
  height: number;
}

/** Raw luminance 0–255 after greyscale (for projections). */
export async function toGreyscaleRaw(buffer: Buffer): Promise<RawBinary> {
  const { data, info } = await sharp(buffer)
    .greyscale()
    .normalize()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const width = info.width ?? 0;
  const height = info.height ?? 0;
  return { data: new Uint8Array(data), width, height };
}

/** Pixels below threshold are black (0), else white (255). */
export function thresholdToBinary(raw: RawBinary, threshold = 128): Uint8Array {
  const out = new Uint8Array(raw.data.length);
  for (let i = 0; i < raw.data.length; i++) {
    out[i] = raw.data[i]! < threshold ? 0 : 255;
  }
  return out;
}
