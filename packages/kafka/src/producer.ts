import { kafka, TOPICS } from "./client";
import type { Producer } from "kafkajs";
import { MediaPost, PreferredPostTopic } from "@repo/db";

export interface PostAutomateMessage {
    id: string,
    query: string,
    category: PreferredPostTopic,
    mediaPosts: MediaPost,
}
export interface PostRawProcessorMessage {
    id: string,
    creatorId: string,
    caption?: string,
    isLocked: boolean,
    price?: Number,
    createdAt: Date;
    updatedAt: Date;
    media_url?: string;
    media_type?: string;
}
export interface PostdumpMessage {
    id: string,
    creatorId: string,
    caption?: string,
    isLocked: boolean,
    price?: Number,
    createdAt: Date;
    updatedAt: Date;
    media_url?: string;
    media_type?: string;
}

export class PostAutomateProducer {
    private producer: Producer;
    private isConnected = false;

    constructor() {
        this.producer = kafka.producer();
    }

    async connect() {
        if (!this.isConnected) {
            await this.producer.connect();
            this.isConnected = true;
        }
    }

    async disconnect() {
        if (this.isConnected) {
            await this.producer.disconnect();
            this.isConnected = false;
        }
    }

    async publishPost(message: PostAutomateMessage): Promise<string> {
        await this.connect();

        const topic = TOPICS.POST_AUTOMATE;
        const partitionKey = message.id;

        try {
            await this.producer.send({
                topic,
                messages: [
                    {
                        key: partitionKey,
                        value: JSON.stringify(message),
                    },
                ],
            });

            return message?.id;
        } catch (error) {
            console.error("Failed to publish message:", error);
            throw error;
        }
    }
}
export class PostRawProducer {
    private producer: Producer;
    private isConnected = false;

    constructor() {
        this.producer = kafka.producer();
    }

    async connect() {
        if (!this.isConnected) {
            await this.producer.connect();
            this.isConnected = true;
        }
    }

    async disconnect() {
        if (this.isConnected) {
            await this.producer.disconnect();
            this.isConnected = false;
        }
    }

    async publishPost(message: PostRawProcessorMessage): Promise<string> {
        await this.connect();

        const topic = TOPICS.POST_RAW_PROCESSOR;
        const partitionKey = message.id;

        try {
            await this.producer.send({
                topic,
                messages: [
                    {
                        key: partitionKey,
                        value: JSON.stringify(message),
                    },
                ],
            });

            return message?.id;
        } catch (error) {
            console.error("Failed to publish message:", error);
            throw error;
        }
    }
}
export class PostDumpProducer {
    private producer: Producer;
    private isConnected = false;

    constructor() {
        this.producer = kafka.producer();
    }

    async connect() {
        if (!this.isConnected) {
            await this.producer.connect();
            this.isConnected = true;
        }
    }

    async disconnect() {
        if (this.isConnected) {
            await this.producer.disconnect();
            this.isConnected = false;
        }
    }

    async publishPost(message: PostdumpMessage): Promise<string> {
        await this.connect();

        const topic = TOPICS.POST_DUMP;
        const partitionKey = message.id;

        try {
            await this.producer.send({
                topic,
                messages: [
                    {
                        key: partitionKey,
                        value: JSON.stringify(message),
                    },
                ],
            });

            return message?.id;
        } catch (error) {
            console.error("Failed to publish message:", error);
            throw error;
        }
    }
}

// Singleton instance
type ProducerMap = {
    dump: PostDumpProducer;
    raw: PostRawProducer;
    automate: PostAutomateProducer;
};

const producers: Partial<ProducerMap> = {};

export function getProducer<T extends keyof ProducerMap>(
    type: T
): ProducerMap[T] {
    if (!producers[type]) {
        switch (type) {
            case "dump":
                producers[type] = new PostDumpProducer() as ProducerMap[T];
                break;
            case "raw":
                producers[type] = new PostRawProducer() as ProducerMap[T];
                break;
            case "automate":
                producers[type] = new PostAutomateProducer() as ProducerMap[T];
                break;
        }
    }

    return producers[type]!;
};