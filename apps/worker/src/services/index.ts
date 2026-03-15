export * from "./hacker-news.service";
export * from "./news-api.service";
export * from "./reddit.service";
export * from "./google-trends.service";

import type { PreferredPostTopic } from "@repo/db";
import type { TrendData } from "./hacker-news.service";
import { getHackerNewsService } from "./hacker-news.service";
import { getNewsAPIService } from "./news-api.service";
import { getRedditService } from "./reddit.service";
import { getGoogleTrendsService } from "./google-trends.service";

export interface AggregatedTrendData {
    trends: TrendData[];
    sources: {
        hackerNews: TrendData[];
        newsApi: TrendData[];
        reddit: TrendData[];
        googleTrends: TrendData[];
    };
    fetchedAt: Date;
    topic: PreferredPostTopic;
    query?: string;
}

function calculateRelevanceScore(title: string, description: string | undefined, query: string): number {
    if (!query) return 0;
    
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const titleLower = title.toLowerCase();
    const descLower = (description || "").toLowerCase();
    
    let relevance = 0;
    let matchedTerms = 0;
    
    for (const term of queryTerms) {
        if (titleLower.includes(term)) {
            relevance += 0.4;
            matchedTerms++;
        }
        if (descLower.includes(term)) {
            relevance += 0.15;
        }
    }
    
    // Bonus for matching multiple terms
    if (matchedTerms >= 2) relevance += 0.2;
    if (matchedTerms >= 3) relevance += 0.2;
    
    return Math.min(relevance, 1);
}

export async function gatherTrendData(
    topic: PreferredPostTopic,
    customQuery?: string,
    limitPerSource = 5
): Promise<AggregatedTrendData> {
    const hnService = getHackerNewsService();
    const newsService = getNewsAPIService();
    const redditService = getRedditService();
    const trendsService = getGoogleTrendsService();

    console.log(`📊 Gathering trend data for topic: ${topic}${customQuery ? ` (query: ${customQuery})` : ""}`);

    // Fetch from all sources in parallel - pass customQuery to all services
    const [hnResults, newsResults, redditResults, trendsResults] = await Promise.allSettled([
        customQuery 
            ? hnService.searchByQuery(customQuery, limitPerSource).then(stories => 
                stories.map(s => ({
                    id: `hn-${s.objectID}`,
                    title: s.title,
                    description: s.story_text,
                    url: s.url,
                    source: "HACKERNEWS" as const,
                    score: Math.min(s.points / 5000, 1),
                    engagementScore: s.points,
                    commentCount: s.num_comments,
                    createdAt: new Date(s.created_at),
                    category: topic,
                }))
              )
            : hnService.searchByTopic(topic, limitPerSource),
        newsService.searchByTopic(topic, customQuery, limitPerSource),
        redditService.searchByTopic(topic, limitPerSource, customQuery),
        trendsService.searchByTopic(topic, limitPerSource, customQuery),
    ]);

    const hackerNews = hnResults.status === "fulfilled" ? hnResults.value : [];
    const newsApi = newsResults.status === "fulfilled" ? newsResults.value : [];
    const reddit = redditResults.status === "fulfilled" ? redditResults.value : [];
    const googleTrends = trendsResults.status === "fulfilled" ? trendsResults.value : [];

    // Log any failures
    if (hnResults.status === "rejected") console.error("HN fetch failed:", hnResults.reason);
    if (newsResults.status === "rejected") console.error("News API fetch failed:", newsResults.reason);
    if (redditResults.status === "rejected") console.error("Reddit fetch failed:", redditResults.reason);
    if (trendsResults.status === "rejected") console.error("Google Trends fetch failed:", trendsResults.reason);

    // Combine all trends
    let allTrends = [...hackerNews, ...newsApi, ...reddit, ...googleTrends];

    // Apply relevance scoring if custom query provided
    if (customQuery) {
        allTrends = allTrends.map(trend => {
            const relevance = calculateRelevanceScore(trend.title, trend.description, customQuery);
            return {
                ...trend,
                // Combine base score with relevance (70% relevance, 30% engagement when query present)
                score: relevance > 0 
                    ? (relevance * 0.7) + (trend.score * 0.3)
                    : trend.score * 0.3, // Heavily penalize non-matching results
            };
        });

        // Filter out completely irrelevant results when query is specific
        const relevantTrends = allTrends.filter(t => {
            const relevance = calculateRelevanceScore(t.title, t.description, customQuery);
            return relevance > 0;
        });

        // Use relevant trends if we have enough, otherwise fall back to all
        if (relevantTrends.length >= 3) {
            allTrends = relevantTrends;
        }
    }

    // Sort by score (now includes relevance weighting)
    allTrends.sort((a, b) => b.score - a.score);

    console.log(`✅ Gathered ${allTrends.length} trends (HN: ${hackerNews.length}, News: ${newsApi.length}, Reddit: ${reddit.length}, Trends: ${googleTrends.length})`);

    return {
        trends: allTrends,
        sources: {
            hackerNews,
            newsApi,
            reddit,
            googleTrends,
        },
        fetchedAt: new Date(),
        topic,
        query: customQuery,
    };
}
