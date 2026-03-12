import { kafka, TOPICS, getProducer } from "@repo/kafka";
import { client } from "@repo/db";
import { getPostCache } from "@repo/cache";
import type { Consumer, EachBatchPayload, PostAutomateMessage } from "@repo/kafka";

export class PostAutomateConsumer {
    private consumer: Consumer;
    private isRunning = false;

    constructor() {
        this.consumer = kafka.consumer({
            groupId: "post-automate-group", // separate consumer group
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
                    const batchSize = 500;
                    const flushInterval = 3000;

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

        const posts = messages.map((msg) => ({
            id: msg.id,
            creatorId: msg.creatorId,
            caption: msg.caption,
            isLocked: msg.isLocked,
            price: msg.price,
            createdAt: msg.createdAt,
            updatedAt: msg.updatedAt,
            media_url: msg.media_url,
            media_type: msg.media_type,
        }));

        try {

            // have cache first
            const duration = Date.now() - startTime;
            console.log(`✅ Post batch persisted: ${posts.length} posts (${duration}ms)`);

            const postCache = getPostCache();
            const invalidatedKeys = new Set<string>();

            for (const msg of posts) {
                // Invalidate the creator's profile posts cache
                const key = `creator:${msg?.creatorId}:posts:initial`;
                if (!invalidatedKeys.has(key)) {
                    await postCache.invalidatePost(key);
                    invalidatedKeys.add(key);
                }
            }

            // Invalidate feed caches for users so they see fresh posts
            await postCache.invalidateByPattern("feed:*:initial");


            // Then push to db
            await client.$transaction(
                messages.map((msg) =>
                    client.post.create({
                        data: {
                            caption: msg.caption,
                            isLocked: msg.isLocked,
                            creatorId: msg.creatorId,
                            price: msg.price,
                            media: {
                                create: {
                                    url: msg.media_url!,
                                    type: msg.media_type as any,
                                }
                            }
                        },
                    })
                )
            );

        } catch (e) {
            console.error(
                "❌ Post database batch write failed. Initiating recovery...",
                e,
            );

            const producer = getProducer("automate");
            try {
                for (const msg of messages) {
                    const originalMessage = { ...msg };
                    // @ts-expect-error - remove offset before re-publishing
                    delete originalMessage.offset;
                    await producer.publishPost(originalMessage);
                }
                console.log(
                    `🔄 Post recovery: Re-queued ${messages.length} messages to Kafka topic.`,
                );
            } catch (produceError) {
                console.error(
                    "🔥 CRITICAL: Failed to re-queue post messages! Data loss possible.",
                    produceError,
                );
            }
        }
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

