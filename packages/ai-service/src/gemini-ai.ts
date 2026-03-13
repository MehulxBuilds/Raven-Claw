import { GoogleGenAI } from "@google/genai";
import { server_env as env } from "@repo/env";

const ai = new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
});

export const generateTextGoogleGemini = async ({ modelId = "gemini-2.5-flash", prompt }: { modelId?: string, prompt: string }) => {
    const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
    });

    return response.text;
}