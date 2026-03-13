import { Kafka, logLevel } from "kafkajs";
import { server_env as env } from "@repo/env"

export const kafka = new Kafka({
    clientId: "console-me",
    brokers: (env.KAFKA_BROKER || "localhost:9092").split(","),
    logLevel: logLevel.ERROR,
    retry: {
        initialRetryTime: 100,
        retries: 8,
    },
});

// Kafka Topics
export const TOPICS = {
    POST_RAW_PROCESSOR: "post-raw",
    POST_AUTOMATE: "post-automate",
    POST_DUMP: "post-dump",
    POST_CLEANUP: "post-cleanup",
} as const;

// Topic configurations
export const TOPIC_CONFIGS = {
    [TOPICS.POST_RAW_PROCESSOR]: {
        numPartitions: 1,
        replicationFactor: 1,
    },
    [TOPICS.POST_AUTOMATE]: {
        numPartitions: 1,
        replicationFactor: 1,
    },
    [TOPICS.POST_DUMP]: {
        numPartitions: 1,
        replicationFactor: 1,
    },
    [TOPICS.POST_CLEANUP]: {
        numPartitions: 1,
        replicationFactor: 1,
    },
};