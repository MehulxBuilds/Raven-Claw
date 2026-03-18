import { z } from "zod";
import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

export const ClientEnvSchema = z.object({
    NEXT_PUBLIC_POLAR_ACCESS_TOKEN: z.string(),
    POLAR_WEBHOOK_SECRET: z.string(),
});

export type ServerEnv = z.infer<typeof ClientEnvSchema>;
export const client_env = ClientEnvSchema.parse(process.env);