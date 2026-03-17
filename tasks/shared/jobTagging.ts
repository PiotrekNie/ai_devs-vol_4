import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { Tags } from "./types";

const systemPrompt = `You are a precise job tagger.
Assign tags to the provided job description.
Allowed tags only: IT, transport, edukacja, medycyna, praca z ludźmi, praca z pojazdami, praca fizyczna.
Return exactly one classification with index 0 and relevant tags only.`;

const classificationSchema = z.object({
    classifications: z.array(
        z.object({
            index: z.number(),
            tags: z.array(z.enum(Tags)),
        }),
    ),
});

const openrouter = createOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
});

const TIMEOUT_MS = 30_000;

export async function tagJob(job: string) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const { object } = await generateObject({
            model: openrouter("google/gemini-2.5-flash-lite"),
            schema: classificationSchema,
            temperature: 0,
            system: systemPrompt,
            prompt: job,
            abortSignal: controller.signal,
        });

        return object;
    } finally {
        clearTimeout(timeoutId);
    }
}
