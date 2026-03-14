"use client";

import { useState } from "react";
import { Input } from "@repo/ui";
import { Search } from "lucide-react";
import { Hint } from "@repo/ui";
import { useGetFeedPost } from "@/hooks/query/post";
import ReloadButton from "@/components/dashboard/reload-button";

const tabs = ["Generated", "Mannual"] as const;

const ThreadPage = () => {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Generated");
  const { data: posts, isPending } = useGetFeedPost();

  const threadCards = {
    Generated: Array.from({ length: 12 }, (_, index) => ({
      id: `generated-${index + 1}`,
      tone: "from-white/[0.03] via-white/[0.015] to-transparent",
    })),
    Mannual: Array.from({ length: 8 }, (_, index) => ({
      id: `manual-${index + 1}`,
      tone: "from-slate-400/[0.045] via-white/[0.01] to-transparent",
    })),
  } as const;

  const visibleCards = threadCards[activeTab];

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
                <div className="flex h-[54px] w-fit items-center overflow-hidden rounded-xl border border-white/45 bg-white/[0.015] shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] backdrop-blur-sm">
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
                              ? "bg-[#5e646f] text-white"
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
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {visibleCards.map((card) => (
                  <div
                    key={card.id}
                    className={`h-[276px] rounded-[6px] border border-white/45 bg-gradient-to-b ${card.tone} shadow-[0_0_0_1px_rgba(255,255,255,0.015)_inset]`}
                  />
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
