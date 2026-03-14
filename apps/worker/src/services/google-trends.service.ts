import type { PreferredPostTopic, TrendSource } from "@repo/db";
import type { TrendData } from "./hacker-news.service";

// @ts-expect-error - google-trends-api doesn't have proper types
import googleTrends from "google-trends-api";

export interface GoogleTrendResult {
    title: {
        query: string;
        exploreLink: string;
    };
    formattedTraffic: string;
    relatedQueries: Array<{
        query: string;
        exploreLink: string;
    }>;
    image: {
        newsUrl: string;
        source: string;
        imageUrl: string;
    };
    articles: Array<{
        title: string;
        timeAgo: string;
        source: string;
        url: string;
        snippet: string;
    }>;
}

const TOPIC_TO_KEYWORDS: Record<PreferredPostTopic, string[]> = {
    TECH: ["technology", "apple", "google", "microsoft"],
    SCIENCE: ["science", "research", "discovery"],
    POLITICS: ["politics", "election", "congress"],
    BUSINESS: ["business", "stocks", "economy"],
    AI: ["artificial intelligence", "chatgpt", "openai", "llm"],
    PROGRAMMING: ["programming", "software development", "coding"],
    CYBERSECURITY: ["cybersecurity", "data breach", "hacking"],
    SPACE: ["space", "nasa", "spacex", "rocket launch"],
    STARTUPS: ["startup", "venture capital", "tech startup"],
};

export class GoogleTrendsService {
    private safeJsonParse(data: string): any | null {
        if (!data || typeof data !== "string") return null;
        // Check if response is HTML (error page) instead of JSON
        if (data.trim().startsWith("<")) {
            console.warn("Google Trends returned HTML instead of JSON (likely rate limited)");
            return null;
        }
        try {
            return JSON.parse(data);
        } catch {
            return null;
        }
    }

    async getDailyTrends(geo = "US"): Promise<GoogleTrendResult[]> {
        try {
            const results = await googleTrends.dailyTrends({
                trendDate: new Date(),
                geo,
            });

            const parsed = this.safeJsonParse(results);
            if (!parsed) return [];

            const trendingSearches = parsed?.default?.trendingSearchesDays?.[0]?.trendingSearches || [];
            return trendingSearches;
        } catch (error) {
            console.warn("Google Trends daily fetch failed (this is common due to rate limiting)");
            return [];
        }
    }

    async getRelatedTopics(keyword: string): Promise<any[]> {
        try {
            const results = await googleTrends.relatedTopics({
                keyword,
                startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                endTime: new Date(),
            });

            const parsed = this.safeJsonParse(results);
            if (!parsed) return [];

            return parsed?.default?.rankedList?.[0]?.rankedKeyword || [];
        } catch (error) {
            console.warn(`Google Trends related topics failed for "${keyword}"`);
            return [];
        }
    }

    async getInterestOverTime(keywords: string[]): Promise<any> {
        try {
            const results = await googleTrends.interestOverTime({
                keyword: keywords,
                startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                endTime: new Date(),
            });

            return this.safeJsonParse(results);
        } catch (error) {
            console.warn("Google Trends interest over time failed");
            return null;
        }
    }

    async searchByTopic(topic: PreferredPostTopic, limit = 10): Promise<TrendData[]> {
        const keywords = TOPIC_TO_KEYWORDS[topic] || [topic.toLowerCase()];
        const allTrends: TrendData[] = [];

        try {
            // Get daily trends and filter by relevance to topic
            const dailyTrends = await this.getDailyTrends();

            for (const trend of dailyTrends) {
                if (!trend?.title?.query) continue;

                const isRelevant = keywords.some(
                    kw => trend.title.query.toLowerCase().includes(kw.toLowerCase())
                );

                if (isRelevant || allTrends.length < limit / 2) {
                    allTrends.push(this.transformToTrendData(trend, topic));
                }

                if (allTrends.length >= limit) break;
            }

            // If we don't have enough, try related topics (but don't fail if it doesn't work)
            if (allTrends.length < limit) {
                for (const keyword of keywords.slice(0, 2)) {
                    const relatedTopics = await this.getRelatedTopics(keyword);

                    for (const related of relatedTopics.slice(0, 3)) {
                        if (allTrends.length >= limit) break;
                        if (!related?.topic?.title && !related?.formattedValue) continue;

                        allTrends.push({
                            id: `gtrends-${related.topic?.mid || Date.now()}-${Math.random().toString(36).slice(2)}`,
                            title: related.topic?.title || related.formattedValue || keyword,
                            description: `Trending topic related to ${keyword}`,
                            url: undefined,
                            source: "GOOGLE_TRENDS",
                            score: (related.value || 50) / 100,
                            engagementScore: related.value || 50,
                            commentCount: 0,
                            createdAt: new Date(),
                            category: topic,
                        });
                    }
                }
            }
        } catch (error) {
            console.warn("Google Trends searchByTopic failed, returning empty results");
        }

        return allTrends.slice(0, limit);
    }

    private transformToTrendData(trend: GoogleTrendResult, category: PreferredPostTopic): TrendData {
        // Parse traffic string like "500K+" or "2M+"
        const trafficStr = trend.formattedTraffic || "0";
        let engagementScore = parseInt(trafficStr.replace(/[^0-9]/g, "")) || 0;
        if (trafficStr.includes("K")) engagementScore *= 1000;
        if (trafficStr.includes("M")) engagementScore *= 1000000;

        const maxTraffic = 1000000;
        const normalizedScore = Math.min(engagementScore / maxTraffic, 1);

        const topArticle = trend.articles?.[0];

        return {
            id: `gtrends-${trend.title.query.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}`,
            title: trend.title.query,
            description: topArticle?.snippet || undefined,
            url: topArticle?.url || trend.image?.newsUrl,
            source: "GOOGLE_TRENDS",
            score: normalizedScore,
            engagementScore,
            commentCount: 0,
            createdAt: new Date(),
            category,
        };
    }
}

let googleTrendsServiceInstance: GoogleTrendsService | null = null;
export function getGoogleTrendsService(): GoogleTrendsService {
    if (!googleTrendsServiceInstance) {
        googleTrendsServiceInstance = new GoogleTrendsService();
    }
    return googleTrendsServiceInstance;
}
