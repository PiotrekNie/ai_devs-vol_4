import type { Person } from "./types";

function filterPeople(people: Person[]) {
    return people.filter((person) => {
        const birthYear = new Date(person.birthDate).getFullYear();
        // 20-40 years old in 2026 = born 1986-2006
        return person.gender === "M" && birthYear >= 1986 && birthYear <= 2006 && person.birthPlace === "Grudziądz";
    });
}

export default filterPeople;
