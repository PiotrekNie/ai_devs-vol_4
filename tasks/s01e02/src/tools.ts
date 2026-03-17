import { tool } from "ai";
import { z } from "zod";
import type { SuspectRecord } from "../../shared/types";

const HUB_API_KEY = process.env.HUB_API_KEY;

export interface Coordinates {
    lat: number;
    lon: number;
}

export interface PowerPlant {
    city: string;
    is_active: string;
    power: string;
    code: string;
    lat: number;
    lon: number;
}

function toNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string" && value.trim().length > 0) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function parseCoordinatePair(value: unknown): Coordinates | null {
    if (typeof value !== "string") {
        return null;
    }

    const [rawLat, rawLon] = value.split(",").map((v) => v.trim());
    if (!rawLat || !rawLon) {
        return null;
    }

    const lat = toNumber(rawLat);
    const lon = toNumber(rawLon);
    if (lat === null || lon === null) {
        return null;
    }

    return { lat, lon };
}

function extractCoordinates(payload: unknown): Coordinates[] {
    const result: Coordinates[] = [];

    const pushCoordinate = (item: unknown) => {
        if (typeof item !== "object" || item === null) {
            const pair = parseCoordinatePair(item);
            if (pair) {
                result.push(pair);
            }
            return;
        }

        const map = item as Record<string, unknown>;
        const lat = toNumber(map.lat ?? map.latitude);
        const lon = toNumber(map.lon ?? map.lng ?? map.longitude);
        if (lat !== null && lon !== null) {
            result.push({ lat, lon });
            return;
        }

        const pair = parseCoordinatePair(map.location ?? map.coordinates ?? map.coords);
        if (pair) {
            result.push(pair);
        }
    };

    if (Array.isArray(payload)) {
        payload.forEach(pushCoordinate);
        return result;
    }

    if (typeof payload === "object" && payload !== null) {
        const map = payload as Record<string, unknown>;
        const candidates = [
            map.locations,
            map.points,
            map.coordinates,
            map.coords,
            map.data,
            map.result,
            map.location,
        ];

        for (const candidate of candidates) {
            if (Array.isArray(candidate)) {
                candidate.forEach(pushCoordinate);
            } else if (candidate !== undefined) {
                pushCoordinate(candidate);
            }
        }
    }

    return result;
}

function extractAccessLevel(payload: unknown): string | null {
    if (typeof payload === "string" && payload.trim().length > 0) {
        return payload.trim();
    }
    if (typeof payload !== "object" || payload === null) {
        return null;
    }

    const accessLevel = (payload as Record<string, unknown>).accessLevel as string | undefined;
    return accessLevel ?? null;
}

async function callHubApi(endpoint: string, body: Record<string, unknown>) {
    const response = await fetch(`https://hub.ag3nts.org${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            apikey: HUB_API_KEY,
            ...body,
        }),
    });
    return response.json() as Promise<unknown>;
}

async function geocodeCity(city: string): Promise<{ lat: number; lon: number }> {
    const url = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&country=Poland&format=json&limit=1`;
    const res = await fetch(url, {
        headers: { "User-Agent": "ai-devs-task/1.0" },
    });
    const json = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!json[0]) throw new Error(`Could not geocode city: ${city}`);
    return { lat: parseFloat(json[0].lat), lon: parseFloat(json[0].lon) };
}

export async function loadSuspects(): Promise<SuspectRecord[]> {
    const suspectsPath = new URL("../../data/suspects.json", import.meta.url);
    const suspects = (await Bun.file(suspectsPath).json()) as unknown;
    return z.array(z.object({
        name: z.string(),
        surname: z.string(),
        gender: z.string(),
        birthDate: z.string(),
        birthPlace: z.string(),
        birthCountry: z.string(),
        job: z.string(),
        tags: z.array(z.string()),
        birthYear: z.number(),
    })).parse(suspects) as SuspectRecord[];
}

export async function loadPowerPlants(): Promise<PowerPlant[]> {
    const response = await fetch(`https://hub.ag3nts.org/data/${HUB_API_KEY}/findhim_locations.json`);
    const data = (await response.json()) as Record<string, PowerPlant>;

    const source = data.power_plants;

    if (!source) {
        throw new Error("No power plants found in findhim_locations.json.");
    }

    const plants = await Promise.all(
        Object.entries(source).map(async ([city, info]) => {
            const coords = await geocodeCity(city);
            return { city, ...info, ...coords };
        }),
    );

    if (!plants || plants.length === 0) {
        throw new Error("No power plants found in plants array.");
    }

    return plants;
}

export async function fetchPersonLocations(name: string, surname: string): Promise<Coordinates[]> {
    const payload = await callHubApi("/api/location", { name, surname });
    const locations = extractCoordinates(payload);
    if (locations.length === 0) {
        throw new Error(`No coordinates found for ${name} ${surname}.`);
    }
    return locations;
}

export async function fetchPersonAccessLevel(name: string, surname: string, birthYear: number): Promise<string> {
    const payload = await callHubApi("/api/accesslevel", {
        name,
        surname,
        birthYear,
        born: birthYear,
    });
    const accessLevel = extractAccessLevel(payload);
    if (!accessLevel) {
        throw new Error(`Access level not found for ${name} ${surname}.`);
    }
    return accessLevel;
}

export const getSuspects = tool({
    description: "Load suspects identified in S01E01.",
    parameters: z.object({}),
    execute: async () => {
        const suspects = await loadSuspects();
        return { suspects };
    },
});

export const getPowerPlants = tool({
    description: "Load power plant locations from findhim_locations.json.",
    parameters: z.object({}),
    execute: async () => {
        const powerPlants = await loadPowerPlants();
        return { powerPlants };
    },
});

export const getPersonLocations = tool({
    description: "Get GPS coordinates visited by person.",
    parameters: z.object({
        name: z.string(),
        surname: z.string(),
    }),
    execute: async ({ name, surname }) => {
        const locations = await fetchPersonLocations(name, surname);
        return { name, surname, locations };
    },
});

export const getPersonAccessLevel = tool({
    description: "Get person access level for secured facilities.",
    parameters: z.object({
        name: z.string(),
        surname: z.string(),
        birthYear: z.number(),
    }),
    execute: async ({ name, surname, birthYear }) => {
        const accessLevel = await fetchPersonAccessLevel(name, surname, birthYear);
        return { name, surname, birthYear, accessLevel };
    },
});
