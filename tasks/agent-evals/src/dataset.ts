import { readFile } from "node:fs/promises";
import type { LangfuseClient } from "@langfuse/client";

export type DatasetItemSeed = {
  id: string;
  input: unknown;
  expectedOutput: unknown;
  metadata?: Record<string, unknown>;
};

export type DatasetConfig = {
  name: string;
  description: string;
  metadata?: Record<string, unknown>;
};

export type LoadResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export async function loadJsonFile<T>(path: string): Promise<LoadResult<T>> {
  try {
    const raw = await readFile(path, "utf-8");
    return { ok: true, value: JSON.parse(raw) as T };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function ensureDataset(
  langfuse: LangfuseClient,
  config: DatasetConfig,
): Promise<void> {
  try {
    await langfuse.api.datasets.get(config.name);
    return;
  } catch {
    // create below
  }

  await langfuse.api.datasets.create({
    name: config.name,
    description: config.description,
    metadata: config.metadata,
  });
}

export async function syncDatasetItems(
  langfuse: LangfuseClient,
  datasetName: string,
  items: DatasetItemSeed[],
): Promise<void> {
  for (const item of items) {
    await langfuse.api.datasetItems.create({
      datasetName,
      id: item.id,
      input: item.input,
      expectedOutput: item.expectedOutput,
      metadata: item.metadata,
    });
  }
}
