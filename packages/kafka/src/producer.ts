import { kafka, TOPICS } from "./client";
import type { Producer } from "kafkajs";
import { MediaPost, PostMadeByType, PreferredPostTopic, TrendSource } from "@repo/db";

export interface PostAutomateMessage {
    id: string;
    userId: string;
    query?: string; // The topic/query to generate posts about (required)
    // Optional: if not provided, user's preferredPostTopics from DB will be used
    category?: PreferredPostTopic | PreferredPostTopic[];
    // Optional: if not provided, user's preferredPostMedia from DB will be used
    mediaPosts?: MediaPost | MediaPost[];
    postMadeBy: PostMadeByType;
}

export interface TrendDataItem {
    id: string;
    title: string;
    description?: string;
    url?: string;
    source: TrendSource;
    score: number;
    engagementScore: number;
    commentCount: number;
    createdAt: Date;
    category: PreferredPostTopic;
}

export interface PostRawProcessorMessage {
    id: string;
    userId: string;
    category: PreferredPostTopic;
    mediaPosts: MediaPost | MediaPost[];
    postMadeBy: PostMadeByType;
    trends: TrendDataItem[];
    fetchedAt: Date;
    query?: string;
}

export interface GeneratedPost {
    title: string;
    content: string;
    hashtags?: string[];
    tone?: string;
}

export interface PostdumpMessage {
    id: string;
    userId: string;
    mediaPosts: MediaPost;
    postTopics: PreferredPostTopic;
    postMadeBy: PostMadeByType;
    title: string;
    content: Record<string, any>;
    source?: TrendSource;
    sourceUrl?: string;
    trendScore?: number;
    engagementScore?: number;
    commentCount?: number;
    tokensConsumed?: number;
    hash?: string;
}
export interface PostCleanUpMessage {
    id: string, // postId -> which is going to be cleanedUp
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
export class PostCleanUpProducer {
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

    async publishPost(message: PostCleanUpMessage): Promise<string> {
        await this.connect();

        const topic = TOPICS.POST_CLEANUP;
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
    cleanup: PostCleanUpProducer;
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
            case "cleanup":
                producers[type] = new PostCleanUpProducer() as ProducerMap[T];
                break;
        }
    }

    return producers[type]!;
};