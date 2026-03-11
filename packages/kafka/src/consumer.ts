import { kafka } from "./client";
import { EachMessagePayload } from "kafkajs";

export const ensureTopicExists = async (topicName: string) => {
    try {
        const admin = kafka.admin();
        await admin.connect();

        const topics = await admin.listTopics();
        if (!topics.includes(topicName)) {
            await admin.createTopics({
                topics: [
                    {
                        topic: topicName,
                        numPartitions: 2,
                        replicationFactor: 1,
                    },
                ],
            });
        }

        await admin.disconnect();
    } catch (error) {
        console.error(`Error ensuring topic ${topicName}:`, error);
    }
};

export const startConsumer = async (
    groupId: string,
    topic: string,
    handleMessage: (message: any) => Promise<void>,
) => {
    const consumer = kafka.consumer({
        groupId,
        retry: {
            initialRetryTime: 100,
            retries: 8,
        }
    });

    try {
        await consumer.connect();
        await consumer.subscribe({ topic, fromBeginning: false });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
                const value = message.value?.toString();
                if (value) {
                    try {
                        await handleMessage(JSON.parse(value));
                    } catch (error) {
                        console.error("Error processing Kafka message:", error);
                    }
                }
            },
        });
    } catch (error) {
        console.error(`Failed to start consumer for group ${groupId}:`, error);
    }
};