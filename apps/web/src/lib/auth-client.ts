import { createAuthClient } from "better-auth/react";
import { polarClient } from "@polar-sh/better-auth";
import { API_BASE } from "@/utils/constants";

export const authClient = createAuthClient({
    baseURL: API_BASE,
    plugins: [
        polarClient(),
    ]
});

export const { signIn, useSession, signOut, customer, checkout } = authClient;