import { Response } from "express";
import { AuthRequest } from "../middleware/user-middleware";
import { catchAsync } from "../utils/catch-async";
import { SchedulePostSchema } from "../types";
import { AppError } from "../utils/app-error";
import { getPostCache } from "@repo/cache";
import { getProducer } from "@repo/kafka";
import { client } from "@repo/db";

export const scheduleCreatePost = catchAsync(
    async (req: AuthRequest, res: Response) => {
        const userId = req.userId;
        const isPremium = req.isPremium;

        try {
            const { success, data } = SchedulePostSchema.safeParse(req.body);

            if (!success) {
                throw new AppError("Invalid data", 400);
            }

            const postId = crypto.randomUUID();

            // TODO: Cache Invalidation logic ( may be )

            if (isPremium) {
                const create = getProducer("automate").publishPost({
                    id: postId,
                    userId: userId ?? "",
                    query: data.query,
                    category: data.category,
                    mediaPosts: data.mediaPosts,
                    postMadeBy: "MANNUAL",
                });
            } else {
                // check how much ( post ) generation's is there
                const generationCheck = await client.userUsage.findFirst({
                    where: {
                        userId: userId,
                    },
                    select: {
                        generationCount: true,
                    }
                });

                if (generationCheck?.generationCount !== 3) {
                    const create = getProducer("automate").publishPost({
                        id: postId,
                        userId: userId ?? "",
                        query: data.query,
                        category: data.category,
                        mediaPosts: data.mediaPosts,
                        postMadeBy: "MANNUAL",
                    });
                } else {
                    throw new AppError("Buy Premium for more Generation's", 400);
                }
            };

            res.status(200).json({
                success: true,
                message: "Post Creation has been Scheduled Successfully",
            });
        } catch (e) {
            console.error(`Error: ${e}`);
            res.status(500).json({
                success: false,
                message: "Internal Server Error", e,
            });
        }
    }
);

export const fetchPosts = catchAsync(
    async (req: AuthRequest, res: Response) => {
        const userId = req.userId;
        console.log(userId)
        const feedCacheKey = `feed:user${userId}:initial`;

        try {
            let feedpost;

            const postCache = getPostCache();
            feedpost = await postCache.getPost(feedCacheKey);

            if (!feedpost) {
                const feedpost = await client.aIPosts.findMany({
                    where: {
                        userId: userId,
                    },
                    select: {
                        id: true,
                        content: true,
                        title: true,
                        status: true,
                        mediaPosts: true,
                        postTopics: true,
                        postMadeBy: true,
                        engagementScore: true,
                        topic: {
                            select: {
                                query: true,
                                category: true,
                                trendScore: true,
                            }
                        },
                        updatedAt: true,
                        createdAt: true,
                    },
                    take: 50,
                });

                await postCache.addPost(feedCacheKey, feedpost);
            }

            // if (!feedpost) {
            //     throw new AppError("Failed to fetch post", 400);
            // }

            res.status(200).json({
                success: true,
                message: "Posts Fetched Successfully",
                posts: feedpost,
            });
        } catch (e) {
            console.error(`Error: ${e}`);
            res.status(500).json({
                success: false,
                message: "Internal Server Error", e,
            });
        }
    }
);
