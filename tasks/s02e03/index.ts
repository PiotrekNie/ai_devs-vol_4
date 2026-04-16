import { fileURLToPath } from "node:url";
import {
  type CategorizeOutput,
  mergeCategorizeLabels,
  runCategorizePrompt,
} from "./src/scripts/categorizeData";
import { logScript } from "./src/log";
import fetchData from "./src/scripts/fetchData";
import {
  computeInputFingerprint,
  readJsonListFile,
  updateJsonList,
  writeJsonList,
} from "./src/scripts/jsonList";
import {
  filterParsedDataByStatus,
  parseData,
  removeDuplicateLines,
} from "./src/scripts/parseData";
import type { CategorizedData } from "./src/types";

async function main() {
  let downloadDate: string | null = null;

  if (
    downloadDate === null ||
    downloadDate !== new Date().toISOString().split("T")[0]
  ) {
    const date = new Date();
    date.setDate(date.getDate());
    downloadDate = date.toISOString().split("T")[0] ?? null;

    try {
      logScript("s02e03 pipeline start");
      let t = performance.now();

      logScript("fetch failure.log from hub");
      const raw = await fetchData();
      logScript("fetch done", {
        ms: Math.round(performance.now() - t),
        chars: raw.length,
      });
      t = performance.now();

      logScript("parse log lines");
      const parsedData = await parseData(raw);
      const uniqueRows = removeDuplicateLines(parsedData);
      logScript("parse done", {
        ms: Math.round(performance.now() - t),
        lines: uniqueRows.length,
      });
      t = performance.now();

      const rows = filterParsedDataByStatus(uniqueRows, "CRIT");
      logScript("rows after filter", {
        ms: Math.round(performance.now() - t),
        kept: rows.length,
      });

      const jsonListPath = fileURLToPath(
        new URL("data/JsonList.json", import.meta.url),
      );
      const inputFingerprint = computeInputFingerprint(
        rows as CategorizedData[],
      );
      const cached = await readJsonListFile(jsonListPath);

      let categorized: CategorizeOutput;

      if (cached && cached.inputFingerprint === inputFingerprint) {
        logScript("JsonList cache hit", {
          path: jsonListPath,
          rows: rows.length,
        });
        categorized = {
          data: cached.data.filter(
            (r) => r.category === "power_plant",
          ) as CategorizedData[],
        };
      } else {
        logScript("JsonList cache miss", {
          path: jsonListPath,
          rows: rows.length,
          hadFile: cached !== null,
        });

        logScript("LLM categorize (one request per row)", {
          rows: rows.length,
        });
        t = performance.now();

        const labels = await runCategorizePrompt(rows);
        logScript("LLM categorize done", {
          ms: Math.round(performance.now() - t),
          labelCount: labels.data.length,
        });

        t = performance.now();
        categorized = mergeCategorizeLabels(rows, labels);
        logScript("merged rows + labels", {
          ms: Math.round(performance.now() - t),
          total: categorized.data.length,
        });

        await writeJsonList(jsonListPath, {
          inputFingerprint,
          data: categorized.data.filter(
            (r) => r.category === "power_plant",
          ) as CategorizedData[],
        });
        logScript("JsonList cache written", { path: jsonListPath });
      }

      const plant = categorized.data.filter(
        (r) => r.category === "power_plant",
      );
      logScript("writing JSON result to stdout", {
        power_plant: plant.length,
        non_power_plant: categorized.data.length - plant.length,
      });
      console.log(
        JSON.stringify(
          {
            counts: {
              total: categorized.data.length,
              power_plant: plant.length,
              non_power_plant: categorized.data.length - plant.length,
            },
            data: categorized.data,
            power_plant_only: plant,
          },
          null,
          2,
        ),
      );
      await updateJsonList(jsonListPath, categorized.data);
      logScript("JsonList cache updated", { path: jsonListPath });
    } catch (error) {
      logScript("pipeline failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      console.error(error);
      throw error;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
