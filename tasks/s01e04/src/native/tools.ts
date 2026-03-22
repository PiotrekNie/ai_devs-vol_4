import path from "node:path";
import { imagePathsToStructuredJson } from "./vision.js";
import {
  countFee,
  extraWagonCount,
  type CountFeeInput,
  type ShipmentCategory,
  unitNormalization,
} from "./logic.js";

export const nativeToolNames = new Set([
  "image_to_text",
  "count_fee",
  "unit_normalization",
  "fill_declaration",
]);

export const nativeToolsOpenAI = [
  {
    type: "function" as const,
    name: "image_to_text",
    description:
      "OCR / vision: ścieżki absolutne do plików graficznych z cache dokumentacji. Zwraca scalony JSON (pages).",
    parameters: {
      type: "object",
      properties: {
        paths: {
          type: "array",
          items: { type: "string" },
          description: "Lista ścieżek do .png / .jpg",
        },
      },
      required: ["paths"],
    },
  },
  {
    type: "function" as const,
    name: "unit_normalization",
    description: "Zamiana opisu masy (np. \"2,8 tony\") na kg (liczba całkowita).",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string" },
      },
      required: ["text"],
    },
  },
  {
    type: "function" as const,
    name: "count_fee",
    description:
      "Oblicza opłatę w PP wg regulaminu SPK (baza + wagowa + trasowa + wagony dodatkowe). Kat. A/B = zwolnienie (0 PP).",
    parameters: {
      type: "object",
      properties: {
        category: { type: "string", enum: ["A", "B", "C", "D", "E"] },
        massKg: { type: "number" },
        distanceKm: { type: "number" },
        regionalBoundaries: { type: "integer", enum: [0, 1, 2] },
      },
      required: ["category", "massKg", "distanceKm", "regionalBoundaries"],
    },
  },
  {
    type: "function" as const,
    name: "fill_declaration",
    description:
      "Składa dokładny tekst deklaracji wg Załącznika E (bez zmian formatowania). Wywołaj jako ostatni krok.",
    parameters: {
      type: "object",
      properties: {
        date: { type: "string", description: "YYYY-MM-DD" },
        origin: { type: "string" },
        senderId: { type: "string" },
        destination: { type: "string" },
        routeCode: { type: "string" },
        category: { type: "string", enum: ["A", "B", "C", "D", "E"] },
        description: { type: "string" },
        massKg: { type: "integer" },
        wdp: { type: "integer", description: "Wagony Dodatkowe Płatne (0 dla A/B)" },
        specialNotes: { type: "string" },
        feePP: { type: "integer" },
      },
      required: [
        "date",
        "origin",
        "senderId",
        "destination",
        "routeCode",
        "category",
        "description",
        "massKg",
        "wdp",
        "specialNotes",
        "feePP",
      ],
    },
  },
];

export function formatDeclaration(fields: {
  date: string;
  origin: string;
  senderId: string;
  destination: string;
  routeCode: string;
  category: ShipmentCategory;
  description: string;
  massKg: number;
  wdp: number;
  specialNotes: string;
  feePP: number;
}): string {
  return `SYSTEM PRZESYŁEK KONDUKTORSKICH - DEKLARACJA ZAWARTOŚCI
======================================================
DATA: ${fields.date}
PUNKT NADAWCZY: ${fields.origin}
------------------------------------------------------
NADAWCA: ${fields.senderId}
PUNKT DOCELOWY: ${fields.destination}
TRASA: ${fields.routeCode}
------------------------------------------------------
KATEGORIA PRZESYŁKI: ${fields.category}
------------------------------------------------------
OPIS ZAWARTOŚCI (max 200 znaków): ${fields.description}
------------------------------------------------------
DEKLAROWANA MASA (kg): ${fields.massKg}
------------------------------------------------------
WDP: ${fields.wdp}
------------------------------------------------------
UWAGI SPECJALNE: ${fields.specialNotes}
------------------------------------------------------
KWOTA DO ZAPŁATY: ${fields.feePP} PP
------------------------------------------------------
OŚWIADCZAM, ŻE PODANE INFORMACJE SĄ PRAWDZIWE.
BIORĘ NA SIEBIE KONSEKWENCJĘ ZA FAŁSZYWE OŚWIADCZENIE.
======================================================`;
}

export async function executeNativeTool(
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  switch (name) {
    case "image_to_text": {
      const paths = args.paths as string[];
      const abs = paths.map((p) => path.resolve(p));
      return imagePathsToStructuredJson(abs);
    }
    case "unit_normalization": {
      const kg = unitNormalization(String(args.text ?? ""));
      return { kg };
    }
    case "count_fee": {
      const input: CountFeeInput = {
        category: args.category as ShipmentCategory,
        massKg: Number(args.massKg),
        distanceKm: Number(args.distanceKm),
        regionalBoundaries: (args.regionalBoundaries ?? 0) as 0 | 1 | 2,
      };
      return countFee(input);
    }
    case "fill_declaration": {
      const d = formatDeclaration({
        date: String(args.date),
        origin: String(args.origin),
        senderId: String(args.senderId),
        destination: String(args.destination),
        routeCode: String(args.routeCode),
        category: args.category as ShipmentCategory,
        description: String(args.description),
        massKg: Math.round(Number(args.massKg)),
        wdp: Math.round(Number(args.wdp)),
        specialNotes: String(args.specialNotes),
        feePP: Math.round(Number(args.feePP)),
      });
      return { declaration: d };
    }
    default:
      throw new Error(`Unknown native tool: ${name}`);
  }
}

export function isNativeTool(name: string): boolean {
  return nativeToolNames.has(name);
}

export { extraWagonCount };
