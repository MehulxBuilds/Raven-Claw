import { Response } from "express";
import { AuthRequest } from "../middleware/user-middleware";
import { catchAsync } from "../utils/catch-async";
import { UpdateUserPreference } from "../types";
import { AppError } from "../utils/app-error";
import { client } from "@repo/db";

export const updateUserpreference = catchAsync(
    async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.userId;
            const { data, success } = UpdateUserPreference.safeParse(req.body);

            if (!success) {
                throw new AppError("Invalid data", 400);
            }

            const updatePreference = await client.user.update({
                where: {
                    id: userId,
                },
                data: {
                    ...data,
                }
            });

            if (!updatePreference) {
                throw new AppError("failed to Updated Preference", 400);
            }

            res.status(200).json({
                success: true,
                message: "User Preference Updated Successfully",
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

export const getDBUser = catchAsync(
    async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.userId;

            const user = await client.user.findFirst({
                where: {
                    id: userId,
                },
                select: {
                    id: true,
                    name: true,
                    image: true,
                    preferredPostMedia: true,
                    preferredPostTopics: true,
                }
            });

            if (!user) {
                throw new AppError("failed to fetch user", 400);
            }

            res.status(200).json({
                success: true,
                message: "User Fetched Successfully",
                user: user,
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