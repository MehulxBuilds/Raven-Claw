"use client";

import { type FormEvent, useState } from "react";
import { MediaPost, PreferredPostTopic } from "@repo/db/data";
import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    Input,
} from "@repo/ui";
import { Loader2, Plus } from "lucide-react";
import { useCreatePost } from "@/hooks/query/post";
import type { CreatePostType } from "@/types";

const mediaOptions = Object.values(MediaPost) as MediaPost[];
const topicOptions = Object.values(PreferredPostTopic) as PreferredPostTopic[];

const formatOptionLabel = (value: string) =>
    value
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

const initialFormState: CreatePostType = {
    query: "",
    category: PreferredPostTopic.TECH,
    mediaPosts: MediaPost.X,
};

const CreatePostModal = () => {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState<CreatePostType>(initialFormState);
    const { mutateAsync, isPending } = useCreatePost();

    const trimmedQuery = formData.query.trim();
    const isDisabled = trimmedQuery.length < 5 || isPending;

    const updateForm = <K extends keyof CreatePostType>(key: K, value: CreatePostType[K]) => {
        setFormData((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);

        if (!nextOpen && !isPending) {
            setFormData(initialFormState);
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (trimmedQuery.length < 5) {
            return;
        }

        await mutateAsync({
            ...formData,
            query: trimmedQuery,
        });

        setOpen(false);
        setFormData(initialFormState);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-[48px] rounded-lg border-white/35 bg-white/[0.02] text-white/75 shadow-none hover:bg-white/[0.06] hover:text-white"
                >
                    <Plus className="size-6" strokeWidth={1.75} />
                </Button>
            </DialogTrigger>

            <DialogContent
                showCloseButton={false}
                className="max-w-[560px] overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950/85 p-0 text-white shadow-2xl shadow-black/50 backdrop-blur-2xl"
            >
                <div className="relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,92,122,0.2),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(138,92,255,0.18),_transparent_36%),radial-gradient(circle_at_bottom,_rgba(0,255,209,0.14),_transparent_42%)]" />

                    <form onSubmit={handleSubmit} className="relative space-y-8 p-6 sm:p-8">
                        <DialogHeader className="space-y-2 text-left">
                            <span className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-white/70">
                                New Post
                            </span>
                            <DialogTitle className="text-3xl font-semibold tracking-tight text-white">
                                Create a manual post
                            </DialogTitle>
                            <DialogDescription className="max-w-md text-sm text-zinc-300">
                                Describe what you want to publish, pick the topic, and choose where this post should be prepared for.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label htmlFor="post-query" className="text-sm font-medium text-zinc-100">
                                    What should the post be about?
                                </label>
                                <Input
                                    id="post-query"
                                    value={formData.query}
                                    onChange={(event) => updateForm("query", event.target.value)}
                                    placeholder="Describe the angle, audience, or specific idea"
                                    className="h-12 rounded-2xl border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-zinc-500 focus-visible:border-white/35 focus-visible:ring-0"
                                />
                                <p className="text-xs text-zinc-400">
                                    Minimum 5 characters. Be specific enough for better post generation.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <label className="text-sm font-medium text-zinc-100">
                                        Topic category
                                    </label>
                                    <span className="text-xs text-zinc-400">
                                        Select one
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {topicOptions.map((topic) => {
                                        const isSelected = formData.category === topic;

                                        return (
                                            <button
                                                key={topic}
                                                type="button"
                                                onClick={() => updateForm("category", topic)}
                                                className={`rounded-full border px-4 py-2 text-sm transition ${isSelected
                                                    ? "border-white/40 bg-white text-zinc-950"
                                                    : "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
                                                    }`}
                                            >
                                                {formatOptionLabel(topic)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <label className="text-sm font-medium text-zinc-100">
                                        Post platform
                                    </label>
                                    <span className="text-xs text-zinc-400">
                                        Select one
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {mediaOptions.map((media) => {
                                        const isSelected = formData.mediaPosts === media;

                                        return (
                                            <button
                                                key={media}
                                                type="button"
                                                onClick={() => updateForm("mediaPosts", media)}
                                                className={`rounded-full border px-4 py-2 text-sm transition ${isSelected
                                                    ? "border-white/40 bg-white text-zinc-950"
                                                    : "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
                                                    }`}
                                            >
                                                {formatOptionLabel(media)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs text-zinc-400">
                                Your post will be queued and added back into the thread feed once generated.
                            </p>

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                    disabled={isPending}
                                    className="rounded-full border-white/15 bg-white/5 px-5 text-white hover:bg-white/10"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isDisabled}
                                    className="rounded-full px-6"
                                >
                                    {isPending ? <Loader2 className="size-4 animate-spin" /> : "Create Post"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CreatePostModal;
