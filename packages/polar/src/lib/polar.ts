import { Polar } from "@polar-sh/sdk";
import { client_env } from "@repo/env/client";

export const polarClient = new Polar({
    accessToken: client_env.NEXT_PUBLIC_POLAR_ACCESS_TOKEN,
    server: "sandbox",
});