import { kafka, TOPICS, getProducer } from "@repo/kafka";
import type { Consumer, EachBatchPayload, PostRawProcessorMessage, PostdumpMessage } from "@repo/kafka";
import type { MediaPost } from "@repo/db";
import { runPostGeneratorGraph, generatePostHash } from "./langgraph";

export class PostRawConsumer {
    private consumer: Consumer;
    private isRunning = false;

    constructor() {
        this.consumer = kafka.consumer({
            groupId: "post-raw-group",
        });
    }

    async start() {
        if (this.isRunning) return;

        try {
            await this.consumer.connect();
            console.log("Kafka PostRawConsumer: Connected and listening...");

            await this.consumer.subscribe({
                topics: [TOPICS.POST_RAW_PROCESSOR],
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
                    const batchSize = 5; // Small batch due to AI processing
                    const flushInterval = 10000;

                    console.log(
                        `PostRawConsumer received ${messages.length} messages from Kafka`,
                    );

                    let currentBatch: (PostRawProcessorMessage & { offset: string })[] = [];
                    let lastFlush = Date.now();

                    for (const message of messages) {
                        if (!isRunning()) break;

                        try {
                            const rawValue = message.value?.toString();
                            if (!rawValue) continue;

                            const content = JSON.parse(rawValue) as PostRawProcessorMessage;
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
            console.log("Kafka PostRawConsumer: Stopped successfully");
        }
    }

    private async processBatchItems(
        messages: (PostRawProcessorMessage & { offset: string })[],
    ) {
        if (messages.length === 0) return;

        console.log(`⚡ PostRawConsumer processing batch of ${messages.length} items...`);
        const startTime = Date.now();

        const dumpProducer = getProducer("dump");

        for (const msg of messages) {
            try {
                console.log(`🤖 Running LangGraph for user ${msg.userId}, category: ${msg.category}`);

                // Run the LangGraph workflow to generate 2 AI posts
                const result = await runPostGeneratorGraph({
                    userId: msg.userId,
                    category: msg.category,
                    mediaPosts: msg.mediaPosts,
                    postMadeBy: msg.postMadeBy,
                    trends: msg.trends,
                    query: msg.query,
                });

                if (result.errors.length > 0) {
                    console.warn(`⚠️ Post generation had errors:`, result.errors);
                }

                if (result.posts.length === 0) {
                    console.warn(`⚠️ No posts generated for message ${msg.id}`);
                    continue;
                }

                console.log(`✅ Generated ${result.posts.length} posts, tokens consumed: ${result.tokensConsumed}`);

                // Push each generated post to the dump consumer
                for (const post of result.posts) {
                    const hash = generatePostHash(post, msg.userId);

                    const dumpMessage: PostdumpMessage = {
                        id: `${msg.id}-${hash.substring(0, 8)}`,
                        userId: msg.userId,
                        mediaPosts: post.platform,
                        postTopics: msg.category,
                        postMadeBy: msg.postMadeBy,
                        title: post.title,
                        content: {
                            text: post.content,
                            hashtags: post.hashtags,
                            tone: post.tone,
                        },
                        source: post.source,
                        sourceUrl: post.sourceUrl,
                        trendScore: msg.trends[0]?.score,
                        engagementScore: msg.trends[0]?.engagementScore,
                        commentCount: msg.trends[0]?.commentCount,
                        tokensConsumed: result.tokensConsumed / result.posts.length,
                        hash,
                    };

                    await dumpProducer.publishPost(dumpMessage);
                    console.log(`📤 Pushed generated post to dump queue: ${post.title.substring(0, 50)}...`);
                }

            } catch (error) {
                console.error(`❌ Failed to process raw message ${msg.id}:`, error);

                // Re-queue failed message
                const rawProducer = getProducer("raw");
                try {
                    const retryMsg = { ...msg };
                    // @ts-expect-error - remove offset before re-publishing
                    delete retryMsg.offset;
                    await rawProducer.publishPost(retryMsg);
                    console.log(`🔄 Re-queued message ${msg.id} for retry`);
                } catch (requeueError) {
                    console.error(`🔥 CRITICAL: Failed to re-queue message ${msg.id}:`, requeueError);
                }
            }
        }

        const duration = Date.now() - startTime;
        console.log(`✅ PostRawConsumer batch processed in ${duration}ms`);
    }

    async getLag(): Promise<number> {
        const admin = kafka.admin();
        try {
            await admin.connect();
            let totalLag = 0;
            const groupOffsets = await admin.fetchOffsets({
                groupId: "post-raw-group",
                topics: [TOPICS.POST_RAW_PROCESSOR],
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

let postRawConsumerInstance: PostRawConsumer | null = null;
export function getPostRawConsumer(): PostRawConsumer {
    if (!postRawConsumerInstance) {
        postRawConsumerInstance = new PostRawConsumer();
    }
    return postRawConsumerInstance;
}

