"use client";

import { useEffect, useState } from "react";
import { Input } from "@repo/ui";
import { CheckCheck, Copy, Search } from "lucide-react";
import { Hint } from "@repo/ui";
import { useGetFeedPost } from "@/hooks/query/post";
import ReloadButton from "@/components/dashboard/reload-button";
import CreatePostsButton from "@/components/dashboard/create-post";
import type { PostData } from "@/types";
import { toast } from "sonner";
import { useSocket } from "@/components/socket-provider";
import { useQueryClient } from "@tanstack/react-query";

const tabs = ["Generated", "Mannual"] as const;

const formatTopic = (topic: string) =>
  topic
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatDate = (date: Date | string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));

const getPostText = (content: PostData["content"]) => {
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return "No content available.";
  }

  const text = "text" in content ? content.text : undefined;

  return typeof text === "string" && text.trim().length > 0
    ? text
    : "No content available.";
};

const ThreadPage = () => {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Mannual");
  const { data: posts, isPending } = useGetFeedPost();
  const [copy, setCopy] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { isConnected, socket } = useSocket();
  const queryClient = useQueryClient();

  console.log(isConnected, socket);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setCopy(true);
      toast.success("Copied to clipboard!");

      const timer = setTimeout(() => {
        setCopiedId(null);
        setCopy(false);
      }, 2000);

      return () => clearTimeout(timer);
    } catch (err) {
      toast.error("Failed to copy");
    }
  }

  const threadCards = {
    Generated: (posts ?? [])
      .filter((post) => post.postMadeBy === "CRON")
      .map((post) => ({
        id: post.id,
        tone: "from-white/[0.03] via-white/[0.015] to-transparent",
        tag: "Generated",
        title: post.title,
        content: getPostText(post.content),
        createdAt: formatDate(post.createdAt),
        postTopic: formatTopic(post.postTopics),
      })),
    Mannual: (posts ?? [])
      .filter((post) => post.postMadeBy === "MANNUAL")
      .map((post) => ({
        id: post.id,
        tone: "from-slate-400/[0.045] via-white/[0.01] to-transparent",
        tag: "Mannual",
        title: post.title,
        content: getPostText(post.content),
        createdAt: formatDate(post.createdAt),
        postTopic: formatTopic(post.postTopics),
      })),
  } as const;

  const visibleCards = threadCards[activeTab];

  useEffect(() => {
    if (!socket) return;

    const handler = (data: any) => {
      const newPost: PostData = {
        mediaPosts: data.MediaPost,
        id: data.id,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        postTopics: data.postTopics,
        postMadeBy: data.postMadeBy,
        title: data.title,
        content: data.content,
        engagementScore: data.engagementScore,
        status: data.status,

        // TODO: Add topics
      };

      toast.success("Post Generated Successfully")

      queryClient.setQueryData<PostData[]>(["posts"], (old) =>
        old ? [newPost, ...old] : [newPost]
      );
    };

    socket.on("posts:new", handler);

    return () => {
      socket.off("posts:new", handler);
    };
  }, [socket, queryClient]);

  return (
    <>
      <style jsx>{`
        .thread-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .thread-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <main className="h-[calc(100vh-4rem)] overflow-hidden bg-[#020202] px-7 py-8 text-white">
        <section className="mx-auto flex h-full min-h-0 w-full max-w-[1220px] flex-col">
          <div className="flex h-full min-h-0 flex-col gap-10">
            <div className="flex flex-col gap-5">
              <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-white/85">
                Generated Threads
              </h1>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex h-[48px] w-fit items-center overflow-hidden rounded-[10px] border border-white/45 bg-white/[0.015] shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] backdrop-blur-sm">
                  {tabs.map((tab, index) => {
                    const isActive = activeTab === tab;

                    return (
                      <Hint
                        key={tab}
                        label={`Show ${tab.toLowerCase()} threads`}
                        side="top"
                        align="center"
                        asChild
                      >
                        <button
                          type="button"
                          onClick={() => setActiveTab(tab)}
                          className={[
                            "flex h-full items-center justify-center px-7 text-[17px] font-semibold transition-colors",
                            index === 0 ? "min-w-[140px]" : "min-w-[136px]",
                            index === 0 ? "border-r border-white/40" : "",
                            isActive
                              ? "bg-[#25272c] text-white"
                              : "text-white/92 hover:bg-white/[0.04]",
                          ].join(" ")}
                          aria-pressed={isActive}
                        >
                          {tab}
                        </button>
                      </Hint>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <CreatePostsButton />
                  <ReloadButton />

                  <div className="relative w-full sm:w-[214px]">
                    <Search
                      className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-white/50"
                      strokeWidth={1.8}
                    />
                    <Input
                      type="search"
                      placeholder="Search Threads"
                      className="h-[44px] rounded-lg border-white/35 bg-white/[0.02] pl-12 text-[14px] text-white placeholder:text-white/72 focus-visible:border-white/60 focus-visible:ring-0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="thread-scroll min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 py-4">
                {isPending ? (
                  <div className="col-span-full rounded-[22px] border border-white/20 bg-white/[0.02] p-6 text-sm text-white/65">
                    Loading threads...
                  </div>
                ) : null}

                {!isPending && visibleCards.length === 0 ? (
                  <div className="col-span-full rounded-[22px] border border-white/20 bg-white/[0.02] p-6 text-sm text-white/65">
                    No {activeTab.toLowerCase()} threads found yet.
                  </div>
                ) : null}

                {visibleCards.map((card) => (
                  <div
                    key={card.id}
                    className={`group relative flex h-[276px] flex-col overflow-hidden rounded-[22px] border border-white/45 bg-gradient-to-b ${card.tone} p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.015)_inset,0_18px_45px_rgba(0,0,0,0.34)] transition-all duration-300 hover:-translate-y-1 hover:border-white/60 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset,0_28px_60px_rgba(0,0,0,0.45)] overflow-y-auto thread-scroll`}
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.13),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(148,163,184,0.12),transparent_26%)] opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

                    <div className="relative flex min-h-fill flex-col rounded-[18px] border border-white/10 bg-[#080808]/80 px-4 pb-4 pt-3 backdrop-blur-sm">
                      <div className="mb-7 flex items-center justify-between gap-3">
                        <div className="flex gap-2 justify-center items-center">
                          <span className="inline-flex items-center rounded-[9px] border border-white/55 bg-white/[0.025] px-3 py-1 text-[11px] font-medium tracking-[0.02em] text-white/75">
                            {card.tag}
                          </span>

                          <span className="inline-flex items-center rounded-[9px] border border-white/55 bg-white/[0.025] px-3 py-1 text-[11px] font-medium tracking-[0.02em] text-white/75" onClick={() => handleCopy(card.id, card.content)}>
                            {copiedId === card.id ? (
                              <CheckCheck size={15} />
                            ) : (
                              <Copy size={15} />
                            )}
                          </span>
                        </div>
                        <span className="text-[11px] font-medium tracking-[0.02em] text-white/45">
                          {card.createdAt}
                        </span>
                      </div>

                      <div className="space-y-4">
                        <div className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-white/58">
                          {card.postTopic}
                        </div>
                        <h3 className="max-w-[80%] text-[24px] font-medium tracking-[-0.04em] text-white/86 font-sans">
                          {card.title}
                        </h3>
                        <p className="max-w-[85%] whitespace-pre-line text-[16px] leading-7 text-white/58 font-sans">
                          {card.content}
                        </p>
                      </div>

                      <div className="relative mt-auto pt-10">
                        <div className="absolute bottom-0 left-0 h-[48px] w-[54px] border-b border-l border-white/50 opacity-90 [clip-path:polygon(0_100%,100%_0,100%_100%)]" />
                        <div className="absolute bottom-0 right-0 h-[48px] w-[54px] border-b border-r border-white/50 opacity-90 [clip-path:polygon(0_0,100%_100%,0_100%)]" />
                        <div className="mx-auto h-px w-[72%] bg-white/45" />
                        <div className="mx-auto mt-5 flex w-[58%] flex-col gap-[9px]">
                          <div className="h-px bg-white/45" />
                          <div className="h-px bg-white/35" />
                          <div className="h-px bg-white/25" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default ThreadPage;
