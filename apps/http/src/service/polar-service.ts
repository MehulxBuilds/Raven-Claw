import { client, SubscriptionStatusType, SubscriptionTierType } from "@repo/db";

export async function updateCustomerIdService(
    userId: string,
    polarCustomerId: string
) {
    const user = await client.user.update({
        where: { id: userId },
        data: {
            polarCustomerId
        }
    })

    return user;
}

export async function updateCustomerTierService(
    userId: string,
    tier: SubscriptionTierType,
    status: SubscriptionStatusType,
    polarSubscriptionId?: string
) {
    const user = await client.user.update({
        where: { id: userId },
        data: {
            subscriptionTier: tier,
            subscriptionStatus: status,
            polarSubscriptionId: polarSubscriptionId || null,
        },
    });

    return user;
}