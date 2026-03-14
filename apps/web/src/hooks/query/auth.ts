import { requireAuth } from "@/utils/auth-utils";
import { API_BASE } from "@/utils/constants";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { OnboardingType } from "@/types";

const OnboardUser = async (data: OnboardingType) => {
    const response = await fetch(`${API_BASE}/api/v1/user/preference`, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error("Failed to OnBoard User");
    }

    const result = await response.json();

    return result;
};

export const useRequireAuth = () => {
    return useQuery({
        queryKey: ['user'],
        queryFn: async () => await requireAuth(),
    })
};

export const useOnBoard = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: OnboardUser,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            toast.success(data?.message);
        },
        onError(error) {
            toast.error(error.message);
        },
    })
};