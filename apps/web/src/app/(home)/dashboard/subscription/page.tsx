"use client"

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
    Alert,
    AlertDescription,
    AlertTitle,
    Badge,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Spinner,
} from "@repo/ui";
import {
    BarChart3,
    Check,
    ExternalLink,
    Loader2,
    RefreshCw,
    Rocket,
    ShieldCheck,
    Sparkles,
    X,
} from "lucide-react";

import { usePayments } from "@/hooks/query/payments";
import { checkout, customer } from "@/lib/auth-client";
import { syncSubscriptionStatus } from "@/utils/subscription";

const PLAN_FEATURES = {
    free: [
        { name: "Create posts for Instagram, X, LinkedIn, Reddit", included: true },
        { name: "Up to 10 posts per month", included: true },
        { name: "Manual post generation", included: true },
        { name: "Choose platform for each post", included: true },
        { name: "Custom prompt / query input", included: true },
        { name: "Select genre / content style", included: true },
        { name: "Basic AI-generated drafts", included: true },
        { name: "Edit and refine generated posts", included: true },
        { name: "Simple UI for quick generation", included: true },
        { name: "Access to core AI models", included: true },
        { name: "Limited history of generated posts", included: true },
        { name: "No automation (manual workflow only)", included: true },
        { name: "No scheduled generation", included: false },
        { name: "No advanced analytics", included: false },
        { name: "No priority support", included: false },
    ],
    pro: [
        { name: "Everything in Free plan", included: true },
        { name: "Up to 200 posts per month", included: true },
        { name: "Automatic post generation (12x daily)", included: true },
        { name: "2 drafts generated per cycle", included: true },
        { name: "Dedicated Generative Feed tab", included: true },
        { name: "Posts generated based on your selected genres", included: true },
        { name: "Edit genres anytime", included: true },
        { name: "Multi-platform optimized content", included: true },
        { name: "Advanced AI content quality", included: true },
        { name: "Smart content variations", included: true },
        { name: "Full history access", included: true },
        { name: "Priority processing", included: true },
        { name: "Early access to new features", included: true },
        { name: "Advanced analytics (engagement insights)", included: true },
        { name: "Priority support", included: true },
    ],
};

const PLAN_COPY = {
    FREE: {
        badge: "Starter",
        title: "Free",
        description: "A simple setup for trying the workflow and generating content on demand.",
        subtitle: "Best for exploring the product",
        icon: ShieldCheck,
    },
    PRO: {
        badge: "Most Popular",
        title: "Pro",
        description: "A premium setup for creators and teams who want faster output and automation.",
        subtitle: "Built for consistent publishing",
        icon: Sparkles,
    },
} as const;

const STATUS_STYLES = {
    ACTIVE: "text-emerald-600",
    INACTIVE: "text-amber-600",
    CANCELLED: "text-rose-600",
    CANCELED: "text-rose-600",
    PAST_DUE: "text-amber-600",
    UNPAID: "text-rose-600",
} as const;

const SubscriptionPage = () => {
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [portalLoading, setPortalLoading] = useState(false);
    const [syncLoading, setSyncLoading] = useState(false);
    const searchParams = useSearchParams();
    const success = searchParams.get("success");

    const { data, isPending, isError, refetch } = usePayments();

    useEffect(() => {
        if (success !== "true") {
            return;
        }

        const sync = async () => {
            try {
                setSyncLoading(true);

                const result = await syncSubscriptionStatus();

                if (result.success) {
                    toast.success("Subscription status synced successfully");
                    refetch();
                } else {
                    toast.error("Failed to sync subscription status");
                }
            } catch (error) {
                console.error(error);
                toast.error("An error occurred while syncing subscription status");
            } finally {
                setSyncLoading(false);
            }
        };

        sync();
    }, [success, refetch]);

    if (isPending) {
        return (
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="space-y-4">
                    <Spinner />
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
                    <p className="text-muted-foreground">Failed to load subscription data</p>
                </div>

                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        Failed to load subscription data. Please try again.
                        <Button
                            variant="outline"
                            size="sm"
                            className="ml-4"
                            onClick={() => refetch()}
                        >
                            Retry
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!data?.user) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
                    <p className="text-muted-foreground">
                        Please sign in to view subscription options
                    </p>
                </div>
            </div>
        );
    }

    const normalizedTier = String(data.user.subscriptionTier ?? "Free").toUpperCase();
    const currentTier = normalizedTier === "PRO" ? "PRO" : "FREE";
    const isPro = currentTier === "PRO";
    const normalizedStatus = String(data.user.subscriptionStatus ?? "INACTIVE").toUpperCase();
    const isActive = normalizedStatus === "ACTIVE";
    const currentPlanCopy = PLAN_COPY[currentTier];
    const CurrentPlanIcon = currentPlanCopy.icon;
    const subscriptionStatus = normalizedStatus;
    const subscriptionTone =
        STATUS_STYLES[subscriptionStatus as keyof typeof STATUS_STYLES] ?? "text-muted-foreground";
    const repositoryLimit = data.limits?.repositories.limit;
    const repositoryCurrent = data.limits?.repositories.current ?? 0;
    const repositoryUsage = repositoryLimit
        ? Math.min((repositoryCurrent / repositoryLimit) * 100, 100)
        : 100;

    const handleSync = async () => {
        try {
            setSyncLoading(true);

            const result = await syncSubscriptionStatus();

            if (result.success) {
                toast.success("Subscription status synced successfully");
                refetch();
            } else {
                toast.error("Failed to sync subscription status");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while syncing subscription status");
        } finally {
            setSyncLoading(false);
        }
    };

    const handleUpgrade = async () => {
        try {
            setCheckoutLoading(true);

            await checkout({
                slug: "pro",
            });
        } catch (error) {
            console.error(error);
            toast.error("Failed to initiate checkout");
        } finally {
            setCheckoutLoading(false);
        }
    };

    const handleManageSubscription = async () => {
        try {
            setPortalLoading(true);
            await customer.portal();
        } catch (error) {
            console.error(error);
            toast.error("Failed to open customer portal");
        } finally {
            setPortalLoading(false);
        }
    };

    return (
        <div className="space-y-8 p-4 md:p-6">
            <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-background via-background to-primary/5 shadow-sm">
                <CardContent className="relative p-0">
                    <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_45%),radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_30%)]" />
                    <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-start md:justify-between md:p-8">
                        <div className="max-w-2xl space-y-4">
                            <Badge variant="outline" className="w-fit border-primary/20 bg-background/80 px-3 py-1">
                                Pricing
                            </Badge>
                            <div className="space-y-3">
                                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                                    Subscription built to scale with your publishing flow
                                </h1>
                                <p className="max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
                                    Compare plans, track usage, and manage billing in one place with a cleaner and more premium layout.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1.5">
                                    <CurrentPlanIcon className="h-4 w-4 text-primary" />
                                    <span>{currentPlanCopy?.title} plan</span>
                                </div>
                                <div className="flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1.5">
                                    <Rocket className="h-4 w-4 text-primary" />
                                    <span>{isPro ? "Automation enabled" : "Upgrade for automation"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 md:w-[360px]">
                            <div className="rounded-2xl border bg-background/85 p-4 shadow-sm backdrop-blur">
                                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                                    Current plan
                                </p>
                                <p className="mt-3 text-2xl font-semibold">{currentPlanCopy?.title}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{currentPlanCopy?.subtitle}</p>
                            </div>
                            <div className="rounded-2xl border bg-background/85 p-4 shadow-sm backdrop-blur">
                                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                                    Billing status
                                </p>
                                <p className={`mt-3 text-2xl font-semibold ${subscriptionTone}`}>
                                    {subscriptionStatus.replace("_", " ")}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Refresh after checkout if changes do not appear immediately.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Overview</h2>
                    <p className="text-sm text-muted-foreground">
                        A quick snapshot of your tier, billing state, and workspace usage.
                    </p>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSync}
                    disabled={syncLoading}
                    className="gap-2"
                >
                    {syncLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Sync Status
                </Button>
            </div>

            {success === "true" && (
                <Alert className="border-green-500/40 bg-green-50/80 dark:bg-green-950/40">
                    <Check className="h-4 w-4 text-green-600" />
                    <AlertTitle>Success!</AlertTitle>
                    <AlertDescription>
                        Your subscription has been updated successfully. Changes may take a few moments to reflect.
                    </AlertDescription>
                </Alert>
            )}

            {data.limits && (
                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="border-border/70 bg-gradient-to-br from-background to-muted/30">
                        <CardHeader className="pb-3">
                            <CardDescription>Workspace plan</CardDescription>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <CurrentPlanIcon className="h-5 w-5 text-primary" />
                                {currentPlanCopy.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm leading-6 text-muted-foreground">
                                {currentPlanCopy.description}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/70 bg-gradient-to-br from-background to-muted/30">
                        <CardHeader className="pb-3">
                            <CardDescription>Subscription health</CardDescription>
                            <CardTitle className="text-2xl capitalize">
                                {subscriptionStatus.replace("_", " ").toLowerCase()}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <BarChart3 className="h-4 w-4 text-primary" />
                                <span className="text-muted-foreground">
                                    {isActive
                                        ? "Billing is active and premium features are available."
                                        : "Billing may need attention before premium features reactivate."}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/70 bg-gradient-to-br from-background to-muted/30">
                        <CardHeader className="pb-3">
                            <CardDescription>Repository usage</CardDescription>
                            <CardTitle className="text-2xl">
                                {repositoryCurrent}
                                <span className="ml-1 text-base font-medium text-muted-foreground">
                                    / {repositoryLimit ?? "∞"}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                                <div
                                    className={`h-full rounded-full transition-all ${
                                        data.limits.repositories.canAdd ? "bg-primary" : "bg-destructive"
                                    }`}
                                    style={{ width: `${repositoryUsage}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{data.limits.repositories.canAdd ? "Capacity available" : "Limit reached"}</span>
                                <Badge variant={data.limits.repositories.canAdd ? "outline" : "destructive"}>
                                    {data.limits.repositories.canAdd ? "Healthy" : "Upgrade suggested"}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <Card
                    className={`relative overflow-hidden border-border/70 ${
                        !isPro ? "ring-2 ring-primary/30 shadow-lg shadow-primary/10" : "bg-muted/20"
                    }`}
                >
                    <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-muted/80 via-muted/20 to-transparent" />
                    <CardHeader className="relative space-y-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <Badge variant="outline" className="mb-3">
                                    {PLAN_COPY.FREE.badge}
                                </Badge>
                                <CardTitle className="text-2xl">Free</CardTitle>
                                <CardDescription className="mt-2 max-w-sm">
                                    Perfect for getting started and testing your content workflow manually.
                                </CardDescription>
                            </div>
                            {!isPro && <Badge className="ml-2">Current Plan</Badge>}
                        </div>

                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold tracking-tight">$0</span>
                            <span className="pb-1 text-muted-foreground">/month</span>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="rounded-2xl border bg-background/70 p-4">
                            <p className="text-sm font-medium">Mannual Post Generations</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Free tier includes 10 posts generation accross popular platforms.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {PLAN_FEATURES.free.map((feature) => (
                                <div key={feature.name} className="flex items-start gap-3">
                                    {feature.included ? (
                                        <div className="mt-0.5 rounded-full bg-primary/10 p-1">
                                            <Check className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                                        </div>
                                    ) : (
                                        <div className="mt-0.5 rounded-full bg-muted p-1">
                                            <X className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                                        </div>
                                    )}
                                    <span
                                        className={`text-sm leading-6 ${
                                            feature.included ? "" : "text-muted-foreground"
                                        }`}
                                    >
                                        {feature.name}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <Button className="w-full" variant="outline" disabled>
                            {!isPro ? "You are on Free" : "Downgrade"}
                        </Button>
                    </CardContent>
                </Card>

                <Card
                    className={`relative overflow-hidden border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 ${
                        isPro ? "ring-2 ring-primary/40 shadow-xl shadow-primary/10" : "shadow-lg shadow-primary/5"
                    }`}
                >
                    <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.22),transparent_45%),linear-gradient(90deg,rgba(59,130,246,0.08),transparent)]" />
                    <CardHeader className="relative space-y-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <Badge className="mb-3 bg-primary/90 text-primary-foreground">
                                    {PLAN_COPY.PRO.badge}
                                </Badge>
                                <CardTitle className="text-2xl">Pro</CardTitle>
                                <CardDescription className="mt-2 max-w-sm">
                                    A sharper plan for higher output, advanced insights, and automatic generation.
                                </CardDescription>
                            </div>
                            {isPro && <Badge className="ml-2">Current Plan</Badge>}
                        </div>

                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold tracking-tight">$99.99</span>
                            <span className="pb-1 text-muted-foreground">/month</span>
                        </div>

                        <div className="grid gap-3 rounded-2xl border border-primary/15 bg-background/80 p-4 sm:grid-cols-2">
                            <div>
                                <p className="text-sm font-medium">Post volume</p>
                                <p className="mt-1 text-sm text-muted-foreground">Up to 200 posts per month</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Automation</p>
                                <p className="mt-1 text-sm text-muted-foreground">12 generation cycles daily</p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            {PLAN_FEATURES.pro.map((feature) => (
                                <div key={feature.name} className="flex items-start gap-3">
                                    {feature.included ? (
                                        <div className="mt-0.5 rounded-full bg-primary/10 p-1">
                                            <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                                        </div>
                                    ) : (
                                        <div className="mt-0.5 rounded-full bg-muted p-1">
                                            <X className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                                        </div>
                                    )}
                                    <span
                                        className={`text-sm leading-6 ${
                                            feature.included ? "" : "text-muted-foreground"
                                        }`}
                                    >
                                        {feature.name}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {isPro && isActive ? (
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={handleManageSubscription}
                                disabled={portalLoading}
                            >
                                {portalLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Opening Portal...
                                    </>
                                ) : (
                                    <>
                                        Manage Subscription
                                        <ExternalLink className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        ) : (
                            <Button
                                className="w-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
                                onClick={handleUpgrade}
                                disabled={checkoutLoading}
                            >
                                {checkoutLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Loading Checkout...
                                    </>
                                ) : (
                                    "Upgrade to Pro"
                                )}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SubscriptionPage;
