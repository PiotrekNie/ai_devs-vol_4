import { parse } from "csv-parse/sync";
import type { Person } from "./types";
const HUB_API_KEY = process.env.HUB_API_KEY;


async function fetchPeople(): Promise<Person[]> {
    const response = await fetch(`https://hub.ag3nts.org/data/${HUB_API_KEY}/people.csv`);
    const data = await response.text();
    return parse(data, {
        columns: true,
    });
}

export default fetchPeople;