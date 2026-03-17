export interface FindHimAnswer {
    name: string;
    surname: string;
    accessLevel: string;
    powerPlant: string;
}

const HUB_VERIFY_URL = "https://hub.ag3nts.org/verify";
const HUB_API_KEY = process.env.HUB_API_KEY;

export async function submitVerify(answer: FindHimAnswer) {
    const response = await fetch(HUB_VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            apikey: HUB_API_KEY,
            task: "findhim",
            answer,
        }),
    });

    return response.json() as Promise<{ flag?: string; message?: string; code?: number }>;
}
