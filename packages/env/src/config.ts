import { z } from "zod";
import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

export const ServerEnvSchema = z.object({
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string(),
    BETTER_AUTH_URL: z.string().url(),
    GITHUB_CLIENT_ID: z.string(),
    GITHUB_CLIENT_SECRET: z.string(),
    REDIS_HOST: z.string(),
    REDIS_PORT: z.coerce.number(),
    REDIS_USERNAME: z.string().optional(),
    REDIS_PASSWORD: z.string().optional(),
    KAFKA_BROKER: z.string(),
    KAFKA_SSL: z.string(),
    SOCKET_PORT: z.coerce.number(),
    WEB_APP_URL: z.string().url(),
    BETTER_AUTH_CLIENT_URL: z.string().url(),
    NODE_ENV: z.string().optional(),
    GEMINI_API_KEY: z.string(),
    OPENROUTER_API_KEY: z.string().optional(),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;
export const server_env = ServerEnvSchema.parse(process.env);