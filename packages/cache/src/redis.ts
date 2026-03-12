import Redis from "ioredis";
import { server_env as env } from "@repo/env";

const redisConfig = {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    username: env.REDIS_USERNAME,
    password: env.REDIS_PASSWORD,
};

const redis = new Redis(redisConfig);
export default redis;