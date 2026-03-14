import { kafka, TOPICS, getProducer } from "@repo/kafka";
import { client } from "@repo/db";
import { getPostCache } from "@repo/cache";
import type { Consumer, EachBatchPayload, PostdumpMessage } from "@repo/kafka";
import { Decimal } from "@repo/db";

export class PostDumpConsumer {
    private consumer: Consumer;
    private isRunning = false;

    constructor() {
        this.consumer = kafka.consumer({
            groupId: "post-dump-group",
        });
    }

    async start() {
        if (this.isRunning) return;

        try {
            await this.consumer.connect();
            console.log("Kafka PostDumpConsumer: Connected and listening...");

            await this.consumer.subscribe({
                topics: [TOPICS.POST_DUMP],
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
                    const batchSize = 50;
                    const flushInterval = 3000;

                    console.log(
                        `PostDumpConsumer received ${messages.length} messages from Kafka`,
                    );

                    let currentBatch: (PostdumpMessage & { offset: string })[] = [];
                    let lastFlush = Date.now();

                    for (const message of messages) {
                        if (!isRunning()) break;

                        try {
                            const rawValue = message.value?.toString();
                            if (!rawValue) continue;

                            const content = JSON.parse(rawValue) as PostdumpMessage;
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
            console.log("Kafka PostDumpConsumer: Stopped successfully");
        }
    }

    private async processBatchItems(
        messages: (PostdumpMessage & { offset: string })[],
    ) {
        if (messages.length === 0) return;

        console.log(`⚡ PostDumpConsumer processing batch of ${messages.length} AI posts...`);
        const startTime = Date.now();

        try {
            // Filter out posts with duplicate hashes
            const uniqueMessages = messages.filter((msg, index, self) =>
                msg.hash ? self.findIndex(m => m.hash === msg.hash) === index : true
            );

            // Check for existing hashes in database
            const existingHashes = await client.aIPosts.findMany({
                where: {
                    hash: {
                        in: uniqueMessages.filter(m => m.hash).map(m => m.hash!),
                    },
                },
                select: { hash: true },
            });

            const existingHashSet = new Set(existingHashes.map(h => h.hash));
            const newMessages = uniqueMessages.filter(m => !m.hash || !existingHashSet.has(m.hash));

            if (newMessages.length === 0) {
                console.log("⚠️ All posts already exist in database, skipping...");
                return;
            }

            // Batch create AI posts
            await client.$transaction(
                newMessages.map((msg) =>
                    client.aIPosts.create({
                        data: {
                            mediaPosts: msg.mediaPosts,
                            postTopics: msg.postTopics,
                            postMadeBy: msg.postMadeBy,
                            title: msg.title,
                            content: msg.content,
                            source: msg.source,
                            sourceUrl: msg.sourceUrl,
                            trendScore: msg.trendScore ? new Decimal(msg.trendScore) : null,
                            engagementScore: msg.engagementScore,
                            commentCount: msg.commentCount,
                            tokensConsumed: msg.tokensConsumed ? new Decimal(msg.tokensConsumed) : null,
                            hash: msg.hash,
                            status: "PENDING",
                            userId: msg.userId,
                        },
                    })
                )
            );

            // Update user usage
            const userTokenUpdates = new Map<string, number>();
            for (const msg of newMessages) {
                if (msg.tokensConsumed) {
                    const current = userTokenUpdates.get(msg.userId) || 0;
                    userTokenUpdates.set(msg.userId, current + msg.tokensConsumed);
                }
            }

            for (const [userId, tokens] of userTokenUpdates) {
                await client.userUsage.upsert({
                    where: { userId },
                    create: {
                        userId,
                        TotalTokenConsumed: new Decimal(tokens),
                        dailyTokenConsumed: new Decimal(tokens),
                        generationCount: 1,
                    },
                    update: {
                        TotalTokenConsumed: { increment: tokens },
                        dailyTokenConsumed: { increment: tokens },
                        generationCount: { increment: 1 },
                    },
                });
            }

            // Invalidate feed cache for affected users
            const postCache = getPostCache();
            const affectedUserIds = new Set(newMessages.map(m => m.userId));
            
            for (const userId of affectedUserIds) {
                const cacheKey = `feed:user${userId}:initial`;
                await postCache.invalidatePost(cacheKey);
                console.log(`🗑️ Invalidated feed cache for user ${userId}`);
            }

            const duration = Date.now() - startTime;
            console.log(`✅ Saved ${newMessages.length} AI posts to database (${duration}ms)`);

        } catch (e) {
            console.error(
                "❌ AI Post database batch write failed. Initiating recovery...",
                e,
            );

            const producer = getProducer("dump");
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
                groupId: "post-dump-group",
                topics: [TOPICS.POST_DUMP],
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

let PostDumpConsumerInstance: PostDumpConsumer | null = null;
export function getPostDumpConsumer(): PostDumpConsumer {
    if (!PostDumpConsumerInstance) {
        PostDumpConsumerInstance = new PostDumpConsumer();
    }
    return PostDumpConsumerInstance;
}

