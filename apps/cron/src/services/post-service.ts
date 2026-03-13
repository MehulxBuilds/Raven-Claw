import { client } from "@repo/db";
import { Prisma } from "@repo/db/data";
import { getProducer } from "@repo/kafka";
import crypto from "crypto";

export const schedulePostService = async () => {
    try {
        const producer = getProducer("automate");

        const batchSize = 500;
        let cursor: string | undefined = undefined;

        while (true) {
            const users: Prisma.UserGetPayload<{
                select: {
                    id: true;
                    preferredPostMedia: true;
                    preferredPostTopics: true;
                };
            }>[] = await client.user.findMany({
                where: {
                    subscriptionStatus: "ACTIVE",
                    subscriptionTier: {
                        in: ["PRO", "ENTERPRISE"],
                    },
                },
                select: {
                    id: true,
                    preferredPostMedia: true,
                    preferredPostTopics: true,
                },
                take: batchSize,
                ...(cursor && {
                    skip: 1,
                    cursor: { id: cursor },
                }),
                orderBy: {
                    id: "asc",
                },
            });

            if (users.length === 0) break;

            await Promise.all(
                users.map((user) =>
                    producer.publishPost({
                        id: crypto.randomUUID(),
                        userId: user.id,
                        category: user.preferredPostTopics,
                        mediaPosts: user.preferredPostMedia,
                        postMadeBy: "CRON",
                    })
                )
            );

            cursor = users[users.length - 1]!.id;
        }

        console.log("Cron Post Scheduled Successfully");
    } catch (e) {
        console.error("schedulePostService error:", e);
    }
};

export const CleanupPostService = async () => {
    try {
        const producer = getProducer("cleanup");

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const batchSize = 1000;
        let cursor: string | undefined = undefined;

        while (true) {
            const posts: Prisma.AIPostsGetPayload<{
                select: { id: true };
            }>[] = await client.aIPosts.findMany({
                where: {
                    createdAt: {
                        lte: sevenDaysAgo,
                    },
                },
                select: {
                    id: true,
                },
                take: batchSize,
                ...(cursor && {
                    skip: 1,
                    cursor: { id: cursor },
                }),
                orderBy: {
                    id: "asc",
                },
            });

            if (posts.length === 0) break;

            await Promise.all(
                posts.map((post) =>
                    producer.publishPost({
                        id: post.id,
                    })
                )
            );

            cursor = posts[posts.length - 1]!.id;
        }

        console.log("Cron Post CleanedUp Successfully");
    } catch (e) {
        console.error("CleanupPostService error:", e);
    }
};
