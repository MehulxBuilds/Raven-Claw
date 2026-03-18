import {
    MediaPost,
    PostMadeByType,
    PostStatus,
    PreferredPostTopic,
    Prisma,
    SubscriptionStatusType,
    SubscriptionTierType,
    TrendSource
} from "@repo/db";

export interface PostData {
    mediaPosts: MediaPost;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    postTopics: PreferredPostTopic;
    postMadeBy: PostMadeByType;
    title: string;
    content: Prisma.JsonValue;
    engagementScore: number | null;
    status: PostStatus;
    source?: TrendSource,
    topic?: {
        query: string;
        category: PreferredPostTopic;
        trendScore: Prisma.Decimal | null;
    } | null;
};

export interface OnboardingType {
    preferredPostMedia: MediaPost[],
    preferredPostTopics: PreferredPostTopic[],
};

export interface CreatePostType {
    query: string,
    category: PreferredPostTopic,
    mediaPosts: MediaPost,
};

export interface UpdatePolarCustomerType {
    userId: string;
    polarCustomerId: string;
};

export interface UpdateUserTierType {
    userId: string;
    tier: SubscriptionTierType;
    status: SubscriptionStatusType;
    polarSubscriptionId?: string;
};