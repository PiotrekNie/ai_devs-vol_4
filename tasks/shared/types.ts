export interface Person {
    name: string;
    surname: string;
    gender: string;
    birthDate: string;
    birthPlace: string;
    birthCountry: string;
    job: string;
}

export const Tags = ["IT", "transport", "edukacja", "medycyna", "praca z ludźmi", "praca z pojazdami", "praca fizyczna"] as const;
export type Tag = typeof Tags[number];

export interface TaggedPerson extends Person {
    tags: Tag[];
}

export interface SuspectRecord extends TaggedPerson {
    birthYear: number;
}
