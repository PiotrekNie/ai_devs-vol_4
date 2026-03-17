import { parse } from "csv-parse/sync";
import type { Person } from "./types";

const HUB_API_KEY = process.env.HUB_API_KEY;

async function fetchPeople(): Promise<Person[]> {
    if (!HUB_API_KEY?.trim()) {
        throw new Error(
            "HUB_API_KEY is missing. Set it in .env or pass it when running. Get your key from https://hub.ag3nts.org/",
        );
    }

    const response = await fetch(`https://hub.ag3nts.org/data/${HUB_API_KEY}/people.csv`);
    const data = await response.text();

    if (!response.ok) {
        throw new Error(
            `Hub API returned ${response.status} ${response.statusText}. Check HUB_API_KEY and try again. Response: ${data.slice(0, 200)}...`,
        );
    }

    if (data.trimStart().startsWith("<!") || data.trimStart().toLowerCase().startsWith("<html")) {
        throw new Error(
            "Hub API returned HTML instead of CSV. Likely causes: invalid HUB_API_KEY, wrong endpoint, or server error. Get your key from https://hub.ag3nts.org/",
        );
    }

    return parse(data, {
        columns: true,
    });
}

export default fetchPeople;
