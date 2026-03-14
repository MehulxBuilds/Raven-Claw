"use client";

import ColorBends from '@/components/onboard/color-bend'
import { Button, Input } from '@repo/ui'
import { PreferredPostTopic, MediaPost } from "@repo/db/data";
import React, { useState } from 'react';
import { useOnBoard } from '@/hooks/query/auth';
import { redirect } from 'next/navigation';

const mediaOptions = Object.values(MediaPost) as MediaPost[];
const topicOptions = Object.values(PreferredPostTopic) as PreferredPostTopic[];

const formatOptionLabel = (value: string) =>
    value
        .toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

const OnBoardPage = () => {
    const [selectedMedia, setSelectedMedia] = useState<MediaPost[]>([]);
    const [selectedTopics, setSelectedTopics] = useState<PreferredPostTopic[]>([]);
    const { mutateAsync, isPending } = useOnBoard();

    const toggleSelection = <T extends string,>(
        value: T,
        selectedValues: T[],
        setSelectedValues: React.Dispatch<React.SetStateAction<T[]>>
    ) => {
        setSelectedValues((current) =>
            current.includes(value)
                ? current.filter((item) => item !== value)
                : [...current, value]
        );
    };

    const handleSubmit = async () => {
        const data = { preferredPostTopics: selectedTopics, preferredPostMedia: selectedMedia }
        await mutateAsync(data);
        return redirect('/dashboard/threads');
    }

    return (
        <main className='relative min-h-screen w-full overflow-hidden'>
            <div className='absolute inset-0'>
                <ColorBends
                    className='h-full w-full'
                    colors={["#ff5c7a", "#8a5cff", "#00ffd1"]}
                    rotation={0}
                    speed={0.2}
                    scale={1}
                    frequency={1}
                    warpStrength={1}
                    mouseInfluence={1}
                    parallax={0.5}
                    noise={0.1}
                    transparent
                    autoRotate={0}
                />
            </div>

            <div className='relative z-10 flex min-h-screen items-center justify-center px-4 py-10'>
                <section className='w-full max-w-lg rounded-[28px] border border-white/10 bg-zinc-950/55 p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-8'>
                    <div className='space-y-2'>
                        <span className='inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-white/70'>
                            Onboarding
                        </span>
                        <h1 className='text-3xl font-semibold tracking-tight text-white'>
                            Set up your workspace
                        </h1>
                        <p className='text-sm text-zinc-300'>
                            Add a couple of starter details to Get Started with RavenClaw.
                        </p>
                    </div>

                    <div className='mt-8 space-y-4'>

                        <div className='space-y-3'>
                            <div className='flex items-center justify-between gap-3'>
                                <label className='text-sm font-medium text-zinc-100'>
                                    Preferred media for Posts
                                </label>
                                <span className='text-xs text-zinc-400'>
                                    Select multiple
                                </span>
                            </div>

                            <div className='flex flex-wrap gap-2'>
                                {mediaOptions.map((media) => {
                                    const isSelected = selectedMedia.includes(media);

                                    return (
                                        <button
                                            key={media}
                                            type='button'
                                            onClick={() => toggleSelection(media, selectedMedia, setSelectedMedia)}
                                            className={`rounded-full border px-4 py-2 text-sm transition ${isSelected
                                                ? 'border-white/40 bg-white text-zinc-950'
                                                : 'border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10'
                                                }`}
                                        >
                                            {formatOptionLabel(media)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className='space-y-3'>
                            <div className='flex items-center justify-between gap-3'>
                                <label className='text-sm font-medium text-zinc-100'>
                                    Preferred topics for Posts
                                </label>
                                <span className='text-xs text-zinc-400'>
                                    Select multiple
                                </span>
                            </div>

                            <div className='flex flex-wrap gap-2'>
                                {topicOptions.map((topic) => {
                                    const isSelected = selectedTopics.includes(topic);

                                    return (
                                        <button
                                            key={topic}
                                            type='button'
                                            onClick={() => toggleSelection(topic, selectedTopics, setSelectedTopics)}
                                            className={`rounded-full border px-4 py-2 text-sm transition ${isSelected
                                                ? 'border-white/40 bg-white text-zinc-950'
                                                : 'border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10'
                                                }`}
                                        >
                                            {formatOptionLabel(topic)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className='mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                        <p className='text-xs text-zinc-400'>
                            {selectedMedia.length} media and {selectedTopics.length} topics selected.
                        </p>
                        <Button onClick={handleSubmit} disabled={isPending || selectedTopics.length === 0 || selectedMedia.length
                            === 0
                        } className='h-11 rounded-full px-6'>
                            Continue
                        </Button>
                    </div>
                </section>
            </div>
        </main>
    )
}

export default OnBoardPage;
