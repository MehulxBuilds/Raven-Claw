import { Response } from "express";
import { AuthRequest } from "../middleware/user-middleware";
import { catchAsync } from "../utils/catch-async";
import { SchedulePostSchema } from "../types";
import { AppError } from "../utils/app-error";
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