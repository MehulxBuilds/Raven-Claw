import { CreatePostType, PostData } from "@/types";
import { API_BASE } from "@/utils/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const fetchFeedPosts = async (): Promise<PostData[]> => {
    const response = await fetch(`${API_BASE}/api/v1/post/feed`, {
        method: "GET",
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error("Failed to fetch feed posts");
    }

    const result = await response.json();
    console.log(result);

    return result.posts || [];
};

const GeneratePosts = async (data: CreatePostType) => {
    const response = await fetch(`${API_BASE}/api/v1/post/schedule-create`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error("Failed to Create Posts");
    }

    const result = await response.json();

    return result;
};

export const useGetFeedPost = () => {
    return useQuery({
        queryKey: ["posts"],
        queryFn: fetchFeedPosts,
        staleTime: 30_000,
    })
};

export const useReloadPost = () => {
    const queryClient = useQueryClient();

    const reloadPost = () => {
        queryClient.invalidateQueries({
            queryKey: ["posts"],
        });
    };

    return reloadPost;
};

export const useCreatePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: GeneratePosts,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            toast.success(data.message);
        }
    })
};
