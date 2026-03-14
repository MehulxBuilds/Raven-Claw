"use client";

import { useState } from "react";
import { useReloadPost } from "@/hooks/query/post";
import { Button, Hint } from "@repo/ui";
import { RotateCcw } from "lucide-react";

const ReloadButton = () => {
    const reloadPost = useReloadPost();
    const [loading, setLoading] = useState(false);

    const handleReload = async () => {
        setLoading(true);
        reloadPost();
        setTimeout(() => setLoading(false), 600);
    };

    return (
        <Hint label="Refresh threads" side="top" align="center" asChild>
            <Button
                onClick={handleReload}
                type="button"
                variant="outline"
                size="icon"
                className="size-[48px] rounded-lg border-white/35 bg-white/[0.02] text-white/75 shadow-none hover:bg-white/[0.06] hover:text-white"
            >
                <RotateCcw
                    className={`size-6 ${loading ? "animate-spin" : ""}`}
                    strokeWidth={1.75}
                />
            </Button>
        </Hint>
    );
};

export default ReloadButton;