import {
    MediaPost,
    PostMadeByType,
    PostStatus,
    PreferredPostTopic,
    Prisma
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
    topic: {
        query: string;
        category: PreferredPostTopic;
        trendScore: Prisma.Decimal | null;
    } | null;
};

export interface OnboardingType {
    preferredPostMedia: MediaPost[],
    preferredPostTopics: PreferredPostTopic[],
};