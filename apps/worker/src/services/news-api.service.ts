import type { PreferredPostTopic, TrendSource } from "@repo/db";
import type { TrendData } from "./hacker-news.service";

export interface NewsArticle {
    article_id: string;
    title: string;
    link: string;
    description?: string;
    content?: string;
    keywords?: string[];
    creator?: string[];
    language: string;
    country: string[];
    category: string[];
    pubDate: string;
    image_url?: string;
    source_id: string;
    source_name: string;
    source_priority: number;
}

export interface NewsAPIResponse {
    status: string;
    totalResults: number;
    results: NewsArticle[];
    nextPage?: string;
}

const TOPIC_TO_CATEGORY: Record<PreferredPostTopic, string> = {
    TECH: "technology",
    SCIENCE: "science",
    POLITICS: "politics",
    BUSINESS: "business",
    AI: "technology",
    PROGRAMMING: "technology",
    CYBERSECURITY: "technology",
    SPACE: "science",
    STARTUPS: "business",
};

const TOPIC_TO_QUERY: Record<PreferredPostTopic, string> = {
    TECH: "technology",
    SCIENCE: "science research",
    POLITICS: "politics government",
    BUSINESS: "business finance",
    AI: "artificial intelligence AI",
    PROGRAMMING: "programming software developer",
    CYBERSECURITY: "cybersecurity hacking security",
    SPACE: "space nasa astronomy",
    STARTUPS: "startup funding venture",
};

export class NewsAPIService {
    private baseUrl = "https://newsdata.io/api/1/latest";
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async searchByTopic(
        topic: PreferredPostTopic,
        customQuery?: string,
        limit = 10
    ): Promise<TrendData[]> {
        const query = customQuery || TOPIC_TO_QUERY[topic];
        const category = TOPIC_TO_CATEGORY[topic];

        const params = new URLSearchParams({
            apikey: this.apiKey,
            q: query,
            country: "us,in,gb",
            language: "en",
            category,
            prioritydomain: "top",
            removeduplicate: "1",
            size: limit.toString(),
        });

        try {
            const response = await fetch(`${this.baseUrl}?${params}`);
            if (!response.ok) {
                throw new Error(`News API error: ${response.status}`);
            }

            const data = (await response.json()) as NewsAPIResponse;

            if (data.status !== "success") {
                console.error("News API returned non-success status:", data);
                return [];
            }

            return data.results
                .filter(article => article.title && article.link)
                .map(article => this.transformToTrendData(article, topic));
        } catch (error) {
            console.error(`Failed to fetch news for topic "${topic}":`, error);
            return [];
        }
    }

    async searchLatest(query: string, category = "technology", limit = 10): Promise<NewsArticle[]> {
        const params = new URLSearchParams({
            apikey: this.apiKey,
            q: query,
            country: "us,in,gb",
            language: "en",
            category,
            prioritydomain: "top",
            removeduplicate: "1",
            size: limit.toString(),
        });

        try {
            const response = await fetch(`${this.baseUrl}?${params}`);
            if (!response.ok) {
                throw new Error(`News API error: ${response.status}`);
            }

            const data = (await response.json()) as NewsAPIResponse;
            return data.results || [];
        } catch (error) {
            console.error(`Failed to search news for "${query}":`, error);
            return [];
        }
    }

    private transformToTrendData(article: NewsArticle, category: PreferredPostTopic): TrendData {
        // Source priority is 1-100, lower is better (more authoritative)
        const normalizedScore = Math.max(0, 1 - (article.source_priority / 100));

        return {
            id: `news-${article.article_id}`,
            title: article.title,
            description: article.description || undefined,
            url: article.link,
            source: "NEWS",
            score: normalizedScore,
            engagementScore: Math.round((1 - article.source_priority / 100) * 1000),
            commentCount: 0,
            createdAt: new Date(article.pubDate),
            category,
        };
    }
}

import { server_env } from "@repo/env";

let newsAPIServiceInstance: NewsAPIService | null = null;
export function getNewsAPIService(): NewsAPIService {
    if (!newsAPIServiceInstance) {
        newsAPIServiceInstance = new NewsAPIService(server_env.NEWS_API_KEY);
    }
    return newsAPIServiceInstance;
}
