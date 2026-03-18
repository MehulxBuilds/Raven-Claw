import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { client } from "@repo/db";
import { server_env as env } from "@repo/env";
import { polarClient } from "@repo/polar";
import { checkout, polar, portal, usage, webhooks } from "@polar-sh/better-auth";
import { client_env } from "@repo/env/client";
import { updatePolarCustomerId, updateUserTier } from "@/utils/subscription";

export const auth = betterAuth({
    database: prismaAdapter(client, {
        provider: "postgresql",
    }),

    trustHost: true,                   // 👈 REQUIRED FOR DEV
    secret: env.BETTER_AUTH_SECRET,

    socialProviders: {
        github: {
            clientId: env.GITHUB_CLIENT_ID!,
            clientSecret: env.GITHUB_CLIENT_SECRET!,
        }
    },

    plugins: [
        polar({
            client: polarClient,
            createCustomerOnSignUp: true,
            use: [
                checkout({
                    products: [
                        {
                            productId: "ec7e920b-7b50-4c17-973f-50d38c2b22a4",
                            slug: "pro", // Custom slug for easy reference in Checkout URL, e.g. /checkout/a-new-saas
                        },
                    ],
                    successUrl: process.env.POLAR_SUCCESS_URL || "/dashboard/subscription?success=true",
                    authenticatedUsersOnly: true,
                }),
                portal({
                    returnUrl: process.env.PORTAL_RETURN_URL || "http://localhost:3000/dashboard",
                }),
                usage(),
                webhooks({
                    secret: client_env.POLAR_WEBHOOK_SECRET!,
                    onSubscriptionActive: async (payload) => {
                        const customerId = payload.data.customerId;

                        const user = await client.user.findUnique({
                            where: {
                                polarCustomerId: customerId,
                            }
                        })

                        if (user) {
                            return updateUserTier({ userId: user.id, tier: "PRO", status: "ACTIVE", polarSubscriptionId: payload.data.id });
                        }
                    },
                    onSubscriptionCanceled: async (payload) => {
                        const customerId = payload.data.customerId;

                        const user = await client.user.findUnique({
                            where: {
                                polarCustomerId: customerId,
                            }
                        })

                        if (user) {
                            return updateUserTier({ userId: user.id, tier: user.subscriptionTier, status: "CANCELED" });
                        }
                    },
                    onSubscriptionRevoked: async (payload) => {
                        const customerId = payload.data.customerId;

                        const user = await client.user.findUnique({
                            where: {
                                polarCustomerId: customerId,
                            }
                        })

                        if (user) {
                            return updateUserTier({ userId: user.id, tier: "Free", status: "INACTIVE" });
                        }
                    },
                    onOrderPaid: async () => { },
                    onCustomerCreated: async (payload) => {
                        const user = await client.user.findUnique({
                            where: {
                                email: payload.data.email,
                            }
                        })

                        if (user) {
                            return updatePolarCustomerId({ userId: user.id, polarCustomerId: payload.data.id });
                        }
                    },
                })
            ]
        })
    ]
});