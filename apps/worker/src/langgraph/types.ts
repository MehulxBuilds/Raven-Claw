import type { MediaPost, PostMadeByType, PreferredPostTopic, TrendSource } from "@repo/db";
import type { TrendDataItem } from "@repo/kafka";

export interface GeneratedPost {
    title: string;
    content: string;
    hashtags: string[];
    tone: "professional" | "casual" | "informative" | "engaging";
    platform: MediaPost;
    sourceTitle?: string;
    sourceUrl?: string;
    source?: TrendSource;
}

export interface PostGeneratorState {
    userId: string;
    category: PreferredPostTopic;
    mediaPosts: MediaPost[];
    postMadeBy: PostMadeByType;
    trends: TrendDataItem[];
    query?: string;
    
    // Analysis results
    selectedTrends: TrendDataItem[];
    analysisNotes: string;
    
    // Generated outputs
    generatedPosts: GeneratedPost[];
    
    // Metadata
    tokensConsumed: number;
    errors: string[];
}

export interface PostGeneratorInput {
    userId: string;
    category: PreferredPostTopic;
    mediaPosts: MediaPost | MediaPost[];
    postMadeBy: PostMadeByType;
    trends: TrendDataItem[];
    query?: string;
}

export const PLATFORM_CONSTRAINTS: Record<MediaPost, { maxLength: number; hashtagLimit: number; style: string }> = {
    X: { 
        maxLength: 280, 
        hashtagLimit: 2, 
        style: "ultra-concise, punchy one-liners, hook-driven, thread-starter format" 
    },
    LINKEDIN: { 
        maxLength: 3000, 
        hashtagLimit: 3, 
        style: "storytelling with short punchy lines, use > bullets for achievements, conversational yet professional, end with memorable insight" 
    },
    INSTAGRAM: { 
        maxLength: 2200, 
        hashtagLimit: 5, 
        style: "visual storytelling, relatable journey, short paragraphs, engaging call-to-action" 
    },
    YOUTUBE: { 
        maxLength: 5000, 
        hashtagLimit: 5, 
        style: "detailed narrative, educational journey, problem-solution format, strong hook" 
    },
    REDDIT: { 
        maxLength: 40000, 
        hashtagLimit: 0, 
        style: "authentic storytelling, community-focused, discussion-oriented, no corporate speak" 
    },
    PEERLIST: { 
        maxLength: 2000, 
        hashtagLimit: 3, 
        style: "tech achievement showcase, builder journey, short impactful lines, milestone-focused" 
    },
};
