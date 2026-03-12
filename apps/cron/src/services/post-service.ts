import { client } from "@repo/db";
import { getProducer } from "@repo/kafka";

export const schedulePostService = async () => {
    try {
        const producer = getProducer("automate");

        const users = await client.user.findMany({
            where: {
                subscriptionStatus: "ACTIVE",
                subscriptionTier: {
                    in: ["PRO", "ENTERPRISE"],
                },
            },
            select: {
                preferredPostMedia: true,
                preferredPostTopics: true,
            },
        });

        for (const user of users) {
            const postId = crypto.randomUUID();

            await producer.publishPost({
                id: postId,
                category: user.preferredPostTopics,
                mediaPosts: user.preferredPostMedia,
                postMadeBy: "CRON",
            });
        }

        console.log("Cron Post Scheduled Successfully");
        return {
            success: true,
            message: "Cron Post Scheduled Successfully",
        };
    } catch (e) {
        console.log(e);
    }
};