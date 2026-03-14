import { kafka, TOPICS, getProducer } from "@repo/kafka";
import type { Consumer, EachBatchPayload, PostAutomateMessage, PostRawProcessorMessage, TrendDataItem } from "@repo/kafka";
import type { PreferredPostTopic, MediaPost } from "@repo/db";
import { client } from "@repo/db";
import { gatherTrendData } from "./services";
import { v4 as uuidv4 } from "uuid";

interface UserPreferences {
    preferredPostMedia: MediaPost[];
    preferredPostTopics: PreferredPostTopic[];
}

async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
        const user = await client.user.findUnique({
            where: { id: userId },
            select: {
                preferredPostMedia: true,
                preferredPostTopics: true,
            },
        });
        return user;
    } catch (error) {
        console.error(`Failed to fetch preferences for user ${userId}:`, error);
        return null;
    }
}

export class PostAutomateConsumer {
    private consumer: Consumer;
    private isRunning = false;

    constructor() {
        this.consumer = kafka.consumer({
            groupId: "post-automate-group",
        });
    }

    async start() {
        if (this.isRunning) return;

        try {
            await this.consumer.connect();
            console.log("Kafka PostAutomateConsumer: Connected and listening...");

            await this.consumer.subscribe({
                topics: [TOPICS.POST_AUTOMATE],
                fromBeginning: false,
            });

            await this.consumer.run({
                eachBatchAutoResolve: false,
                eachBatch: async ({
                    batch,
                    resolveOffset,
                    heartbeat,
                    isRunning,
                }: EachBatchPayload) => {
                    const messages = batch.messages;
                    const batchSize = 10; // Lower batch size for automate due to API calls
                    const flushInterval = 5000;

                    console.log(
                        `PostAutomateConsumer received ${messages.length} messages from Kafka`,
                    );

                    let currentBatch: (PostAutomateMessage & { offset: string })[] = [];
                    let lastFlush = Date.now();

                    for (const message of messages) {
                        if (!isRunning()) break;

                        try {
                            const rawValue = message.value?.toString();
                            if (!rawValue) continue;

                            const content = JSON.parse(rawValue) as PostAutomateMessage;
                            currentBatch.push({
                                ...content,
                                offset: message.offset,
                            });

                            const now = Date.now();
                            if (
                                currentBatch.length >= batchSize ||
                                now - lastFlush >= flushInterval
                            ) {
                                await this.processBatchItems(currentBatch);
                                const lastMsg = currentBatch[currentBatch.length - 1];
                                if (lastMsg) {
                                    resolveOffset(lastMsg.offset);
                                }
                                await heartbeat();
                                currentBatch = [];
                                lastFlush = Date.now();
                            }
                        } catch (error) {
                            console.error(
                                "Error parsing/buffering post message:",
                                error,
                            );
                            resolveOffset(message.offset);
                        }
                    }

                    if (currentBatch.length > 0) {
                        await this.processBatchItems(currentBatch);
                        const lastMsg = currentBatch[currentBatch.length - 1];
                        if (lastMsg) {
                            resolveOffset(lastMsg.offset);
                        }
                        await heartbeat();
                    }
                },
            });

            this.isRunning = true;
        } catch (error) {
            console.error("Failed to start post consumer:", error);
            throw error;
        }
    }

    async stop() {
        if (this.isRunning) {
            await this.consumer.disconnect();
            this.isRunning = false;
            console.log("Kafka PostAutomateConsumer: Stopped successfully");
        }
    }

    private async processBatchItems(
        messages: (PostAutomateMessage & { offset: string })[],
    ) {
        if (messages.length === 0) return;

        console.log(`⚡ PostAutomateConsumer processing batch of ${messages.length} items...`);
        const startTime = Date.now();

        const rawProducer = getProducer("raw");

        for (const msg of messages) {
            try {
                // Fetch user preferences from database
                const userPrefs = await getUserPreferences(msg.userId);

                // Use message category or fall back to user's preferred topics
                let categories: PreferredPostTopic[];
                if (msg.category) {
                    categories = Array.isArray(msg.category) ? msg.category : [msg.category];
                } else if (userPrefs?.preferredPostTopics?.length) {
                    categories = userPrefs.preferredPostTopics;
                    console.log(`📋 Using user's preferred topics: ${categories.join(", ")}`);
                } else {
                    console.warn(`⚠️ No category provided and no user preferences for ${msg.userId}, using default TECH`);
                    categories = ["TECH" as PreferredPostTopic];
                }

                // Use message mediaPosts or fall back to user's preferred media
                let mediaPosts: MediaPost | MediaPost[];
                if (msg.mediaPosts) {
                    mediaPosts = msg.mediaPosts;
                } else if (userPrefs?.preferredPostMedia?.length) {
                    mediaPosts = userPrefs.preferredPostMedia;
                    console.log(`📋 Using user's preferred media: ${Array.isArray(mediaPosts) ? mediaPosts.join(", ") : mediaPosts}`);
                } else {
                    console.warn(`⚠️ No mediaPosts provided and no user preferences for ${msg.userId}, using default X`);
                    mediaPosts = "X" as MediaPost;
                }

                // Gather trend data for each category
                for (const category of categories) {
                    console.log(`📊 Gathering trends for user ${msg.userId}, category: ${category}`);

                    const trendData = await gatherTrendData(
                        category as PreferredPostTopic,
                        msg.query,
                        5 // 5 trends per source
                    );

                    if (trendData.trends.length === 0) {
                        console.warn(`⚠️ No trends found for category ${category}`);
                        continue;
                    }

                    // Transform trends to TrendDataItem format
                    const trends: TrendDataItem[] = trendData.trends.map(t => ({
                        id: t.id,
                        title: t.title,
                        description: t.description,
                        url: t.url,
                        source: t.source,
                        score: t.score,
                        engagementScore: t.engagementScore,
                        commentCount: t.commentCount,
                        createdAt: t.createdAt,
                        category: t.category,
                    }));

                    // Create raw processor message with gathered data
                    const rawMessage: PostRawProcessorMessage = {
                        id: uuidv4(),
                        userId: msg.userId,
                        category: category as PreferredPostTopic,
                        mediaPosts, // Use resolved mediaPosts (from message or user prefs)
                        postMadeBy: msg.postMadeBy,
                        trends,
                        fetchedAt: trendData.fetchedAt,
                        query: msg.query,
                    };

                    // Push to raw processor queue
                    await rawProducer.publishPost(rawMessage);
                    console.log(`✅ Pushed trend data to raw processor for category ${category}`);
                }
            } catch (error) {
                console.error(`❌ Failed to process automate message ${msg.id}:`, error);
            }
        }

        const duration = Date.now() - startTime;
        console.log(`✅ PostAutomateConsumer batch processed in ${duration}ms`);
    }

    async getLag(): Promise<number> {
        const admin = kafka.admin();
        try {
            await admin.connect();
            let totalLag = 0;
            const groupOffsets = await admin.fetchOffsets({
                groupId: "post-automate-group",
                topics: [TOPICS.POST_AUTOMATE],
            });

            for (const topicOffset of groupOffsets) {
                const topicOffsets = await admin.fetchTopicOffsets(
                    topicOffset.topic,
                );

                for (const partition of topicOffset.partitions) {
                    const consumerOffset = partition.offset
                        ? parseInt(partition.offset)
                        : 0;
                    const topicPartition = topicOffsets.find(
                        (tp: {
                            partition: number;
                            high: string;
                            low: string;
                        }) => tp.partition === partition.partition,
                    );
                    const highWatermark = topicPartition?.high
                        ? parseInt(topicPartition.high)
                        : 0;
                    totalLag += highWatermark - consumerOffset;
                }
            }
            return totalLag;
        } finally {
            await admin.disconnect();
        }
    }
}

let postAutomateConsumerInstance: PostAutomateConsumer | null = null;
export function getPostAutomateConsumer(): PostAutomateConsumer {
    if (!postAutomateConsumerInstance) {
        postAutomateConsumerInstance = new PostAutomateConsumer();
    }
    return postAutomateConsumerInstance;
}

