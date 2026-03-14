import type { PreferredPostTopic, TrendSource } from "@repo/db";
import type { TrendData } from "./hacker-news.service";

export interface RedditPost {
    id: string;
    title: string;
    selftext?: string;
    url: string;
    permalink: string;
    author: string;
    score: number;
    num_comments: number;
    created_utc: number;
    subreddit: string;
    is_self: boolean;
    thumbnail?: string;
}

export interface RedditListingResponse {
    kind: string;
    data: {
        children: Array<{
            kind: string;
            data: RedditPost;
        }>;
        after?: string;
        before?: string;
    };
}

const TOPIC_TO_SUBREDDITS: Record<PreferredPostTopic, string[]> = {
    TECH: ["technology", "tech", "gadgets"],
    SCIENCE: ["science", "askscience", "EverythingScience"],
    POLITICS: ["politics", "worldnews", "geopolitics"],
    BUSINESS: ["business", "Economics", "finance"],
    AI: ["artificial", "MachineLearning", "LocalLLaMA", "singularity"],
    PROGRAMMING: ["programming", "coding", "learnprogramming", "webdev"],
    CYBERSECURITY: ["cybersecurity", "netsec", "hacking"],
    SPACE: ["space", "spacex", "Astronomy", "nasa"],
    STARTUPS: ["startups", "Entrepreneur", "smallbusiness"],
};

export class RedditService {
    private baseUrl = "https://www.reddit.com";
    private userAgent = "RavenClaw/1.0";

    async getTopPosts(subreddit: string, timeframe: "hour" | "day" | "week" | "month" = "day", limit = 10): Promise<RedditPost[]> {
        const url = `${this.baseUrl}/r/${subreddit}/top.json?t=${timeframe}&limit=${limit}`;

        try {
            const response = await fetch(url, {
                headers: {
                    "User-Agent": this.userAgent,
                },
            });

            if (!response.ok) {
                if (response.status === 429) {
                    console.warn(`Reddit rate limited for r/${subreddit}`);
                    return [];
                }
                throw new Error(`Reddit API error: ${response.status}`);
            }

            const data = (await response.json()) as RedditListingResponse;
            return data.data.children.map(child => child.data);
        } catch (error) {
            console.error(`Failed to fetch top posts from r/${subreddit}:`, error);
            return [];
        }
    }

    async getHotPosts(subreddit: string, limit = 10): Promise<RedditPost[]> {
        const url = `${this.baseUrl}/r/${subreddit}/hot.json?limit=${limit}`;

        try {
            const response = await fetch(url, {
                headers: {
                    "User-Agent": this.userAgent,
                },
            });

            if (!response.ok) {
                if (response.status === 429) {
                    console.warn(`Reddit rate limited for r/${subreddit}`);
                    return [];
                }
                throw new Error(`Reddit API error: ${response.status}`);
            }

            const data = (await response.json()) as RedditListingResponse;
            return data.data.children.map(child => child.data);
        } catch (error) {
            console.error(`Failed to fetch hot posts from r/${subreddit}:`, error);
            return [];
        }
    }

    async searchByTopic(topic: PreferredPostTopic, limit = 10): Promise<TrendData[]> {
        const subreddits = TOPIC_TO_SUBREDDITS[topic] || ["all"];
        const allPosts: RedditPost[] = [];

        const postsPerSubreddit = Math.ceil(limit / subreddits.length);

        for (const subreddit of subreddits) {
            const posts = await this.getTopPosts(subreddit, "day", postsPerSubreddit);
            allPosts.push(...posts);

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Deduplicate by id
        const uniquePosts = Array.from(
            new Map(allPosts.map(p => [p.id, p])).values()
        );

        // Sort by score and take top results
        const topPosts = uniquePosts
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        return topPosts.map(post => this.transformToTrendData(post, topic));
    }

    private transformToTrendData(post: RedditPost, category: PreferredPostTopic): TrendData {
        const maxScore = 50000;
        const normalizedScore = Math.min(post.score / maxScore, 1);

        return {
            id: `reddit-${post.id}`,
            title: post.title,
            description: post.selftext?.substring(0, 500) || undefined,
            url: post.is_self ? `https://reddit.com${post.permalink}` : post.url,
            source: "REDDIT",
            score: normalizedScore,
            engagementScore: post.score,
            commentCount: post.num_comments,
            createdAt: new Date(post.created_utc * 1000),
            category,
        };
    }
}

let redditServiceInstance: RedditService | null = null;
export function getRedditService(): RedditService {
    if (!redditServiceInstance) {
        redditServiceInstance = new RedditService();
    }
    return redditServiceInstance;
}
