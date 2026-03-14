import { MediaPost, PreferredPostTopic } from "@repo/db/data";
import { z } from "zod";

export const MediaPostEnum = z.enum([
    "X",
    "YOUTUBE",
    "INSTAGRAM",
    "PEERLIST",
    "REDDIT",
    "LINKEDIN",
]);

export const PreferredPostTopicEnum = z.enum([
    "TECH",
    "SCIENCE",
    "POLITICS",
    "BUSINESS",
    "AI",
    "PROGRAMMING",
    "CYBERSECURITY",
    "SPACE",
    "STARTUPS",
]);

export const UpdateUserPreference = z.object({
    preferredPostMedia: z.array(MediaPostEnum).optional(),
    preferredPostTopics: z.array(PreferredPostTopicEnum).optional(),
});

export const SchedulePostSchema = z.object({
    query: z.string().min(5).max(200).optional(),
    category: z.nativeEnum(PreferredPostTopic),
    mediaPosts: z.nativeEnum(MediaPost),
});