export * from "./redis";
export * from "./post-cache";

import { PostCache } from "./post-cache";

let postCacheInstance: PostCache | null = null;

export function getPostCache(): PostCache {
    if (!postCacheInstance) {
        postCacheInstance = new PostCache();
    }
    return postCacheInstance;
};