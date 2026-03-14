import type { PreferredPostTopic, TrendSource } from "@repo/db";

// Algolia HN API response format
export interface HNAlgoliaStory {
    objectID: string;
    title: string;
    url?: string;
    author: string;
    points: number;
    num_comments: number;
    created_at: string;
    story_text?: string;
}

export interface HNSearchResponse {
    hits: HNAlgoliaStory[];
    nbHits: number;
    page: number;
    nbPages: number;
    hitsPerPage: number;
}

// Firebase HN API response format
export interface HNFirebaseStory {
    id: number;
    title: string;
    url?: string;
    by: string;
    score: number;
    descendants: number;
    time: number;
    text?: string;
    type: string;
}

export interface TrendData {
    id: string;
    title: string;
    description?: string;
    url?: string;
    source: TrendSource;
    score: number;
    engagementScore: number;
    commentCount: number;
    createdAt: Date;
    category: PreferredPostTopic;
}

const TOPIC_TO_QUERY: Record<PreferredPostTopic, string[]> = {
    TECH: ["technology", "software", "hardware", "tech"],
    SCIENCE: ["science", "research", "physics", "biology"],
    POLITICS: ["politics", "government", "policy"],
    BUSINESS: ["business", "startup", "entrepreneurship", "finance"],
    AI: ["ai", "artificial intelligence", "machine learning", "llm", "gpt"],
    PROGRAMMING: ["programming", "coding", "developer", "javascript", "python", "rust"],
    CYBERSECURITY: ["security", "cybersecurity", "hacking", "privacy", "encryption"],
    SPACE: ["space", "nasa", "spacex", "astronomy", "rocket"],
    STARTUPS: ["startup", "ycombinator", "funding", "venture capital", "founder"],
};

export class HackerNewsService {
    private baseUrl = "https://hn.algolia.com/api/v1";

    async searchByQuery(query: string, hitsPerPage = 10): Promise<HNAlgoliaStory[]> {
        const url = `${this.baseUrl}/search?query=${encodeURIComponent(query)}&hitsPerPage=${hitsPerPage}&tags=story`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HN API error: ${response.status}`);
            }
            const data = (await response.json()) as HNSearchResponse;
            return data.hits;
        } catch (error) {
            console.error(`Failed to search HN for query "${query}":`, error);
            return [];
        }
    }

    async searchByTopic(topic: PreferredPostTopic, hitsPerPage = 10): Promise<TrendData[]> {
        const queries = TOPIC_TO_QUERY[topic] || [topic.toLowerCase()];
        const allStories: HNAlgoliaStory[] = [];

        for (const query of queries) {
            const stories = await this.searchByQuery(query, Math.ceil(hitsPerPage / queries.length));
            allStories.push(...stories);
        }

        // Deduplicate by objectID
        const uniqueStories = Array.from(
            new Map(allStories.map(s => [s.objectID, s])).values()
        );

        // Sort by points (engagement) and take top results
        const topStories = uniqueStories
            .sort((a, b) => b.points - a.points)
            .slice(0, hitsPerPage);

        return topStories.map(story => this.transformAlgoliaToTrendData(story, topic));
    }

    async getTopStories(limit = 10): Promise<HNFirebaseStory[]> {
        const topStoriesUrl = "https://hacker-news.firebaseio.com/v0/topstories.json";

        try {
            const response = await fetch(topStoriesUrl);
            const storyIds = (await response.json()) as number[];
            const topIds = storyIds.slice(0, limit);

            const stories = await Promise.all(
                topIds.map(async (id) => {
                    const storyUrl = `https://hacker-news.firebaseio.com/v0/item/${id}.json`;
                    const storyResponse = await fetch(storyUrl);
                    return storyResponse.json() as Promise<HNFirebaseStory>;
                })
            );

            return stories.filter(Boolean);
        } catch (error) {
            console.error("Failed to fetch top stories:", error);
            return [];
        }
    }

    async getBestStories(limit = 10): Promise<HNFirebaseStory[]> {
        const bestStoriesUrl = "https://hacker-news.firebaseio.com/v0/beststories.json";

        try {
            const response = await fetch(bestStoriesUrl);
            const storyIds = (await response.json()) as number[];
            const topIds = storyIds.slice(0, limit);

            const stories = await Promise.all(
                topIds.map(async (id) => {
                    const storyUrl = `https://hacker-news.firebaseio.com/v0/item/${id}.json`;
                    const storyResponse = await fetch(storyUrl);
                    return storyResponse.json() as Promise<HNFirebaseStory>;
                })
            );

            return stories.filter(Boolean);
        } catch (error) {
            console.error("Failed to fetch best stories:", error);
            return [];
        }
    }

    async getTopStoriesAsTrends(topic: PreferredPostTopic, limit = 10): Promise<TrendData[]> {
        const stories = await this.getTopStories(limit);
        return stories.map(story => this.transformFirebaseToTrendData(story, topic));
    }

    async getBestStoriesAsTrends(topic: PreferredPostTopic, limit = 10): Promise<TrendData[]> {
        const stories = await this.getBestStories(limit);
        return stories.map(story => this.transformFirebaseToTrendData(story, topic));
    }

    private transformAlgoliaToTrendData(story: HNAlgoliaStory, category: PreferredPostTopic): TrendData {
        const maxPoints = 5000;
        const normalizedScore = Math.min(story.points / maxPoints, 1);

        return {
            id: `hn-${story.objectID}`,
            title: story.title,
            description: story.story_text || undefined,
            url: story.url,
            source: "HACKERNEWS",
            score: normalizedScore,
            engagementScore: story.points,
            commentCount: story.num_comments,
            createdAt: new Date(story.created_at),
            category,
        };
    }

    private transformFirebaseToTrendData(story: HNFirebaseStory, category: PreferredPostTopic): TrendData {
        const maxPoints = 5000;
        const normalizedScore = Math.min(story.score / maxPoints, 1);

        return {
            id: `hn-${story.id}`,
            title: story.title,
            description: story.text || undefined,
            url: story.url,
            source: "HACKERNEWS",
            score: normalizedScore,
            engagementScore: story.score,
            commentCount: story.descendants || 0,
            createdAt: new Date(story.time * 1000), // Unix timestamp to Date
            category,
        };
    }
}

let hackerNewsServiceInstance: HackerNewsService | null = null;
export function getHackerNewsService(): HackerNewsService {
    if (!hackerNewsServiceInstance) {
        hackerNewsServiceInstance = new HackerNewsService();
    }
    return hackerNewsServiceInstance;
}
