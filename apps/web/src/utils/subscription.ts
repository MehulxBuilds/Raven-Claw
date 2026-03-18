import { UpdatePolarCustomerType, UpdateUserTierType } from "@/types";
import { API_BASE } from "./constants";

export const syncSubscriptionStatus = async () => {
    const response = await fetch(`${API_BASE}/api/v1/subscription/sync`, {
        method: "GET",
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error("Failed to sync subscription status");
    }

    const result = await response.json();
    console.log(result);

    return result || [];
}

export const updatePolarCustomerId = async (data: UpdatePolarCustomerType) => {
    const response = await fetch(`${API_BASE}/api/v1/subscription/update/customer`, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error("Failed to update Polar customer ID");
    }

    const result = await response.json();
    console.log(result);

    return result || [];
}

export const updateUserTier = async (data: UpdateUserTierType) => {
    const response = await fetch(`${API_BASE}/api/v1/subscription/update/user-tier`, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error("Failed to update user tier");
    }

    const result = await response.json();
    console.log(result);

    return result || [];
}