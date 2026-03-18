import { Response } from "express";
import { AuthRequest } from "../middleware/user-middleware";
import { catchAsync } from "../utils/catch-async";
import { UpdatePolarCustomerSchema, UpdateUserTierSchema } from "../types";
import { AppError } from "../utils/app-error";
import { client, SubscriptionStatusType, SubscriptionTierType } from "@repo/db";
import { polarClient } from "@repo/polar";
import { updateCustomerIdService, updateCustomerTierService } from "../service/polar-service";

export const updatePolarCustomerId = catchAsync(
    async (req: AuthRequest, res: Response) => {

        try {
            const { success, data } = UpdatePolarCustomerSchema.safeParse(req.body);

            if (!success) {
                throw new AppError("Invalid data", 400);
            }

            await updateCustomerIdService(data.userId, data.polarCustomerId)

            res.status(200).json({
                success: true,
                message: "Customer updated successfully",
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

export const updateUserTier = catchAsync(
    async (req: AuthRequest, res: Response) => {
        try {
            const { success, data } = UpdateUserTierSchema.safeParse(req.body);

            if (!success) {
                throw new AppError("Invalid data", 400);
            }

            await updateCustomerTierService(
                data.userId!,
                data.tier as SubscriptionTierType,
                data.status as SubscriptionStatusType,
                data?.polarSubscriptionId!,
            );

            res.status(200).json({
                success: true,
                message: "Customer updated Successfully",
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

export const syncSubscriptionStatus = catchAsync(
    async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.userId;
            let user = await client.user.findFirst({
                where: {
                    id: userId,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    polarCustomerId: true,
                    polarSubscriptionId: true,
                    subscriptionTier: true,
                    subscriptionStatus: true,
                }
            });

            if (!user?.polarCustomerId) {
                const customers = await polarClient.customers.list({
                    email: user?.email,
                });

                const polarCustomer = customers.result?.items?.[0];

                if (polarCustomer) {
                    await updateCustomerIdService(user!.id, polarCustomer.id);
                    user = { ...user!, polarCustomerId: polarCustomer.id };
                } else {
                    return res.status(200).json({
                        success: true,
                        message: "No Polar customer found for this email",
                        status: "NO_SUBSCRIPTION"
                    });
                }
            }

            // Fetch subscriptions from Polar
            const result = await polarClient.subscriptions.list({
                customerId: user?.polarCustomerId,
            });

            const subscriptions = result.result?.items || [];

            // Find the most relevant subscription (active or most recent)
            const activeSub = subscriptions.find((sub: { status: string; id: string }) => sub.status === 'active');
            const latestSub = subscriptions[0];

            if (activeSub) {
                await updateCustomerTierService(user?.id!, "PRO", "ACTIVE", activeSub?.id);
                return res.status(200).json({
                    success: true,
                    message: "Subscription Status Sync Successfully",
                    status: "ACTIVE"
                });
            } else if (latestSub) {
                const status = latestSub.status === 'canceled' ? 'CANCELED' : 'INACTIVE';
                if (latestSub.status !== 'active') {
                    await updateCustomerTierService(user?.id!, "Free", status, latestSub.id);
                }
                return res.status(200).json({
                    success: true,
                    message: "Subscription Status Sync Successfully",
                    status
                });
            }

            res.status(200).json({
                success: true,
                message: "Subscription Status Sync Successfully",
                status: "NO_SUBSCRIPTION"
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

export const getSubscriptionData = catchAsync(
    async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.userId;

            const limits = await client.userUsage.findFirst({
                select: {
                    generationCount: true,
                }
            });

            const currentUserTier = await client.user.findFirst({
                where: {
                    id: userId,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    polarCustomerId: true,
                    polarSubscriptionId: true,
                    subscriptionTier: true,
                    subscriptionStatus: true,
                }
            });

            res.status(200).json({
                success: true,
                message: "Subscription Data fetched Successfully",
                usage: {
                    user: currentUserTier,
                    limit: limits?.generationCount,
                },
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
