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

    // Fetch from all sources in parallel
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
        redditService.searchByTopic(topic, limitPerSource),
        trendsService.searchByTopic(topic, limitPerSource),
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

    // Combine all trends and sort by score
    const allTrends = [...hackerNews, ...newsApi, ...reddit, ...googleTrends]
        .sort((a, b) => b.score - a.score);

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
