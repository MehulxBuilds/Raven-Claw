import { PostData } from "@/types";
import { API_BASE } from "@/utils/constants";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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