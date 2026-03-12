export const env = {
    HOST: process.env.REDIS_HOST || "localhost",
    PORT: Number(process.env.REDIS_PORT) || 6379,
    USERNAME: process.env.REDIS_USERNAME || "default",
    PASSWORD: process.env.REDIS_PASSWORD || "",
}