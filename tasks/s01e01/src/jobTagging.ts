import { ChatOpenRouter } from "@langchain/openrouter";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { Tags } from "./types";

const systemPrompt = `You are a job tagger. Assign tags to the job description. Tags: IT, transport, edukacja, medycyna, praca z ludźmi, praca z pojazdami, praca fizyczna. Return classifications with index 0 and the applicable tags.`;

const classificationSchema = z.object({
    classifications: z.array(
        z.object({
            index: z.number(),
            tags: z.array(z.enum(Tags)),
        }),
    ),
});

const model = new ChatOpenRouter({
    model: "google/gemini-2.5-flash-lite",
    apiKey: process.env.OPENROUTER_API_KEY,
    temperature: 0,
});

const structuredModel = model.withStructuredOutput(classificationSchema);

const TIMEOUT_MS = 30_000;

export async function tagJob(job: string) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const result = await structuredModel.invoke(
            [new SystemMessage(systemPrompt), new HumanMessage(job)],
            { signal: controller.signal },
        );
        return result;
    } finally {
        clearTimeout(timeoutId);
    }
}