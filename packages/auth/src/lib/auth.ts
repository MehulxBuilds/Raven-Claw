import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { client } from "@repo/db";
import { server_env as env } from "@repo/env";

export const auth = betterAuth({
    database: prismaAdapter(client, {
        provider: "postgresql",
    }),

    trustHost: true,                   // 👈 REQUIRED FOR DEV
    secret: env.BETTER_AUTH_SECRET,

    advanced: {
        cookiePrefix: "better-auth",
        useSecureCookies: process.env.NODE_ENV === "production" || process.env.BETTER_AUTH_URL?.startsWith("https"),
    },

    socialProviders: {
        github: {
            clientId: env.GITHUB_CLIENT_ID!,
            clientSecret: env.GITHUB_CLIENT_SECRET!,
        }
    }
});