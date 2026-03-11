import fetchPeople from "./fetchPeople";
import filterPeople from "./filterPeople";
import { tagJob } from "./jobTagging";
import type { TaggedPerson, Tag } from "./types";

const HUB_API_KEY = process.env.HUB_API_KEY;

const HUB_VERIFY_URL = "https://hub.ag3nts.org/verify";

function toHubFormat(person: TaggedPerson) {
    const birthYear = new Date(person.birthDate).getFullYear();
    return {
        name: person.name,
        surname: person.surname,
        gender: person.gender,
        born: birthYear,
        city: person.birthPlace,
        tags: (() => {
            const transportFirst = [...person.tags].sort((a) => a === "transport" ? -1 : 0);
            return transportFirst.slice(0, 4);
        })(),
    };
}

async function init() {
    const people = await fetchPeople();
    const filteredPeople = filterPeople(people);
    const startTotal = performance.now();
    let taggedPeople: TaggedPerson[] = [];

    console.log("People to tag: ", filteredPeople.length);

    for (const person of filteredPeople) {
        const start = performance.now();
        console.log(`Tagging ${person.name} ${person.surname}...`);

        const result = await tagJob(person.job);

        console.log(`  Done in ${((performance.now() - start) / 1000).toFixed(1)}s`);

        const tags = (result.classifications[0]?.tags ?? []) as Tag[];
        taggedPeople.push({ ...person, tags });
    }

    console.log(`Total tagging time: ${((performance.now() - startTotal) / 1000).toFixed(1)}s`);

    const transportOnly = taggedPeople.filter((p) => p.tags.includes("transport"));
    console.log("People with transport tag: ", transportOnly);

    const answer = transportOnly.map(toHubFormat);

    const response = await fetch(HUB_VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            apikey: HUB_API_KEY,
            task: "people",
            answer,
        }),
    });

    const result = (await response.json()) as { flag?: string; message?: string };
    console.log("Hub response:", result);

    if (result.flag) {
        console.log("Flag:", result.flag);
    }
}

init();