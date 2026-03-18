import { API_BASE } from "@/utils/constants";
import { useQuery } from "@tanstack/react-query";

const getSubscriptionData = async () => {
    const response = await fetch(`${API_BASE}/api/v1/subscription/data`, {
        method: "GET",
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error("Failed to fetch feed posts");
    }

    const result = await response.json();
    console.log(result);

    return result.usage;
}

export const usePayments = () => {
    return useQuery({
        queryKey: ["subscription-data"],
        queryFn: async () => await getSubscriptionData(),
        refetchOnWindowFocus: true,
    });
};