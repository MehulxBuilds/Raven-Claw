import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import { generateOpenRouterText } from "@repo/ai-service";
import type { MediaPost, PreferredPostTopic } from "@repo/db";
import type { TrendDataItem } from "@repo/kafka";
import type { GeneratedPost, PostGeneratorInput } from "./types";
import { PLATFORM_CONSTRAINTS } from "./types";
import crypto from "crypto";

// const DEFAULT_MODEL = "google/gemini-2.0-flash-001";
const DEFAULT_MODEL = "arcee-ai/trinity-mini:free";

const StateAnnotation = Annotation.Root({
    userId: Annotation<string>,
    category: Annotation<PreferredPostTopic>,
    mediaPosts: Annotation<MediaPost[]>,
    postMadeBy: Annotation<string>,
    trends: Annotation<TrendDataItem[]>,
    query: Annotation<string | undefined>,
    selectedTrends: Annotation<TrendDataItem[]>,
    analysisNotes: Annotation<string>,
    generatedPosts: Annotation<GeneratedPost[]>,
    tokensConsumed: Annotation<number>,
    errors: Annotation<string[]>,
});

type GraphState = typeof StateAnnotation.State;

async function analyzeTrends(state: GraphState): Promise<Partial<GraphState>> {
    console.log("🔍 Analyzing trends...");

    const { trends, category, query } = state;

    if (!trends || trends.length === 0) {
        return {
            selectedTrends: [],
            analysisNotes: "No trends available for analysis",
            errors: [...(state.errors || []), "No trends provided"],
        };
    }

    // Sort by engagement and score, take top 5
    const sortedTrends = [...trends]
        .sort((a, b) => {
            const scoreA = a.score * 0.4 + (a.engagementScore / 10000) * 0.6;
            const scoreB = b.score * 0.4 + (b.engagementScore / 10000) * 0.6;
            return scoreB - scoreA;
        })
        .slice(0, 5);

    const trendSummary = sortedTrends
        .map((t, i) => `${i + 1}. "${t.title}" (${t.source}, score: ${t.score.toFixed(2)}, engagement: ${t.engagementScore})`)
        .join("\n");

    const prompt = `Analyze these trending topics for ${category} content creation:

${trendSummary}

${query ? `User's specific interest: ${query}` : ""}

Provide a brief analysis (2-3 sentences) of:
1. Which trends are most relevant and engaging
2. Any common themes or angles to explore
3. Content opportunities

Keep the response concise and actionable.`;

    try {
        const analysisNotes = await generateOpenRouterText({
            modelId: DEFAULT_MODEL,
            prompt,
        });

        // Estimate tokens (rough approximation: ~4 chars per token)
        const tokensUsed = Math.ceil((prompt.length + (analysisNotes?.length || 0)) / 4);

        return {
            selectedTrends: sortedTrends,
            analysisNotes: analysisNotes || "Analysis completed",
            tokensConsumed: (state.tokensConsumed || 0) + tokensUsed,
        };
    } catch (error) {
        console.error("Error analyzing trends:", error);
        return {
            selectedTrends: sortedTrends,
            analysisNotes: "Analysis failed, using top trending topics",
            errors: [...(state.errors || []), `Analysis error: ${error}`],
        };
    }
}

async function generatePosts(state: GraphState): Promise<Partial<GraphState>> {
    console.log("✍️ Generating posts...");

    const { selectedTrends, mediaPosts, category, analysisNotes, query } = state;
    const generatedPosts: GeneratedPost[] = [];
    let totalTokens = state.tokensConsumed || 0;

    if (!selectedTrends || selectedTrends.length === 0) {
        return {
            generatedPosts: [],
            errors: [...(state.errors || []), "No trends selected for post generation"],
        };
    }

    // Generate 2 posts for each platform
    for (const platform of mediaPosts) {
        const constraints = PLATFORM_CONSTRAINTS[platform];

        // Pick the top 2 trends for this batch
        const trendsToUse = selectedTrends.slice(0, 2);

        for (let i = 0; i < 2; i++) {
            const trend = trendsToUse[i % trendsToUse.length];
            if (!trend) continue;

            const prompt = `Create a viral ${platform} post about this trending topic using STORYTELLING format.

Topic: "${trend.title}"
${trend.description ? `Context: ${trend.description}` : ""}
${trend.url ? `Source: ${trend.url}` : ""}
Category: ${category}
${query ? `User's angle: ${query}` : ""}

WRITING STYLE (CRITICAL - follow this exactly):
1. Start with a HOOK - a bold statement, persona, or attention-grabber on its own line
2. Use ">" bullet points for key facts/achievements (3-5 bullets)
3. Each line should be SHORT and PUNCHY (one thought per line)
4. Tell a STORY ARC: background → problem → solution → insight
5. Use line breaks between thoughts for readability
6. End with a MEMORABLE rule, insight, or thought-provoking statement
7. NO generic corporate speak - be conversational and authentic
8. ${constraints.hashtagLimit > 0 ? `Add ${constraints.hashtagLimit} hashtags at the very end` : "NO hashtags"}

EXAMPLE FORMAT:
"Meet [Person/Company/Concept].

>[Achievement 1]
>[Achievement 2]
>[Achievement 3]

[Story/Journey in 2-3 short lines]

The problem? [One line about the challenge]

The solution: [What they built/did]

[Memorable closing rule or insight]"

Platform: ${platform}
Max length: ${constraints.maxLength} characters
Style: ${constraints.style}

Respond ONLY in this exact JSON format (no other text):
{
    "title": "A catchy 5-7 word title",
    "content": "The full post content with line breaks as \\n",
    "hashtags": ["tag1", "tag2"],
    "tone": "professional|casual|informative|engaging"
}`;

            try {
                const responseText = await generateOpenRouterText({
                    modelId: DEFAULT_MODEL,
                    prompt,
                });

                // Parse the JSON response
                const jsonMatch = responseText?.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);

                    generatedPosts.push({
                        title: parsed.title || trend.title,
                        content: parsed.content || "",
                        hashtags: parsed.hashtags || [],
                        tone: parsed.tone || "informative",
                        platform,
                        sourceTitle: trend.title,
                        sourceUrl: trend.url,
                        source: trend.source,
                    });
                }

                // Estimate tokens (rough approximation: ~4 chars per token)
                totalTokens += Math.ceil((prompt.length + (responseText?.length || 0)) / 4);
            } catch (error) {
                console.error(`Error generating post for ${platform}:`, error);
                state.errors?.push(`Generation error for ${platform}: ${error}`);
            }
        }
    }

    console.log(`✅ Generated ${generatedPosts.length} posts`);

    return {
        generatedPosts,
        tokensConsumed: totalTokens,
    };
}

function shouldContinue(state: GraphState): "generate" | "end" {
    if (!state.selectedTrends || state.selectedTrends.length === 0) {
        return "end";
    }
    return "generate";
}

const workflow = new StateGraph(StateAnnotation)
    .addNode("analyze", analyzeTrends)
    .addNode("generate", generatePosts)
    .addEdge(START, "analyze")
    .addConditionalEdges("analyze", shouldContinue, {
        generate: "generate",
        end: END,
    })
    .addEdge("generate", END);

const app = workflow.compile();

export async function runPostGeneratorGraph(input: PostGeneratorInput): Promise<{
    posts: GeneratedPost[];
    tokensConsumed: number;
    errors: string[];
}> {
    console.log(`🚀 Starting post generation for user ${input.userId}, category: ${input.category}`);

    const mediaPosts = Array.isArray(input.mediaPosts) ? input.mediaPosts : [input.mediaPosts];

    const initialState: Partial<GraphState> = {
        userId: input.userId,
        category: input.category,
        mediaPosts,
        postMadeBy: input.postMadeBy,
        trends: input.trends,
        query: input.query,
        selectedTrends: [],
        analysisNotes: "",
        generatedPosts: [],
        tokensConsumed: 0,
        errors: [],
    };

    try {
        const result = await app.invoke(initialState);

        return {
            posts: result.generatedPosts || [],
            tokensConsumed: result.tokensConsumed || 0,
            errors: result.errors || [],
        };
    } catch (error) {
        console.error("Post generation graph failed:", error);
        return {
            posts: [],
            tokensConsumed: 0,
            errors: [`Graph execution failed: ${error}`],
        };
    }
}

export function generatePostHash(post: GeneratedPost, userId: string): string {
    const content = `${userId}-${post.platform}-${post.title}-${post.content.substring(0, 100)}`;
    return crypto.createHash("sha256").update(content).digest("hex").substring(0, 32);
}
