import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { z } from "zod";
import { haversineDistance } from "./haversine";
import { submitVerify, type FindHimAnswer } from "./verify";
import {
    fetchPersonAccessLevel,
    fetchPersonLocations,
    getPersonAccessLevel,
    getPersonLocations,
    getPowerPlants,
    getSuspects,
    loadPowerPlants,
    loadSuspects,
    type PowerPlant,
} from "./tools";

const openrouter = createOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
});

const answerSchema = z.object({
    name: z.string(),
    surname: z.string(),
    accessLevel: z.string(),
    powerPlant: z.string(),
});

function extractJsonObject(text: string): unknown {
    try {
        return JSON.parse(text);
    } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) {
            throw new Error("Agent output does not contain JSON object.");
        }
        return JSON.parse(match[0]);
    }
}

function findClosestPlant(
    locations: Array<{ lat: number; lon: number }>,
    plants: PowerPlant[],
): { code: string; distanceKm: number } | null {
    let closest: { code: string; distanceKm: number } | null = null;
    for (const location of locations) {
        for (const plant of plants) {
            const distanceKm = haversineDistance(location.lat, location.lon, plant.lat, plant.lon);
            if (!closest || distanceKm < closest.distanceKm) {
                closest = { code: plant.code, distanceKm };
            }
        }
    }
    return closest;
}

async function deterministicFallback(): Promise<FindHimAnswer> {
    const suspects = await loadSuspects();
    console.log("[Fallback] getSuspects:", suspects.length, "suspects");
    const plants = await loadPowerPlants();
    console.log("[Fallback] getPowerPlants:", plants.length, "plants");

    let best: {
        name: string;
        surname: string;
        birthYear: number;
        powerPlant: string;
        distanceKm: number;
    } | null = null;

    for (const suspect of suspects) {
        console.log("[Fallback] getPersonLocations:", suspect.name, suspect.surname);
        const locations = await fetchPersonLocations(suspect.name, suspect.surname);
        console.log("[Fallback] Result:", locations.length, "locations");
        const closest = findClosestPlant(locations, plants);
        if (!closest) {
            continue;
        }

        if (!best || closest.distanceKm < best.distanceKm) {
            best = {
                name: suspect.name,
                surname: suspect.surname,
                birthYear: suspect.birthYear,
                powerPlant: closest.code,
                distanceKm: closest.distanceKm,
            };
        }
    }

    if (!best) {
        throw new Error("Could not determine suspect in deterministic fallback.");
    }

    const accessLevel = await fetchPersonAccessLevel(best.name, best.surname, best.birthYear);
    console.log("[Fallback] getPersonAccessLevel:", best.name, best.surname, "->", accessLevel);
    return {
        name: best.name,
        surname: best.surname,
        accessLevel,
        powerPlant: best.powerPlant,
    };
}

async function run() {
    let stepNumber = 0;
    const result = await generateText({
        model: openrouter("google/gemini-2.5-flash-lite"),
        system: `You are an investigator.
Use available tools to find the suspect who was closest to any power plant.
Process:
1) Load suspects and power plants.
2) For each suspect load visited locations and compute nearest plant distance.
3) Select suspect with smallest distance.
4) Get this suspect's access level.
Return only JSON: {"name":"...","surname":"...","accessLevel":"...","powerPlant":"..."}.`,
        prompt: "Find and return the answer object.",
        tools: {
            getSuspects,
            getPowerPlants,
            getPersonLocations,
            getPersonAccessLevel,
        },
        maxSteps: 15,
        temperature: 0,
        onStepFinish: ({ toolCalls, toolResults }) => {
            stepNumber++;
            if (toolCalls?.length) {
                for (let i = 0; i < toolCalls.length; i++) {
                    const tc = toolCalls[i];
                    if (!tc) continue;
                    const tr = toolResults?.[i];
                    const args = (tc as { args?: unknown; input?: unknown }).args ?? (tc as { input?: unknown }).input;
                    console.log(`[Step ${stepNumber}] Tool: ${tc.toolName}`, args);
                    console.log(`[Step ${stepNumber}] Result:`, tr ?? "(none)");
                }
            }
        },
    });

    console.log("Result:", result.text);

    let answer: FindHimAnswer;
    try {
        answer = answerSchema.parse(extractJsonObject(result.text));
    } catch {
        answer = await deterministicFallback();
    }

    console.log("Final answer:", answer);
    const verification = await submitVerify(answer);
    console.log("Hub response:", verification);
    if (verification.flag) {
        console.log("Flag:", verification.flag);
    }
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
