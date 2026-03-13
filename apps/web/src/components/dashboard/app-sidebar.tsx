"use client";

import * as React from "react"
import { IconCategory, IconDeviceAnalytics, IconSettings, IconShoppingBagCheck, IconTemplate, type Icon } from "@tabler/icons-react";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
} from "@repo/ui"
import { usePathname } from "next/navigation";
import { useRequireAuth } from "@/hooks/query/auth";

// This is sample data.
const data = {
    navigation: [
        {
            title: "Application Menu",
            url: "#",
            items: [
                {
                    icon: IconCategory,
                    title: "Threads",
                    url: "/dashboard",
                },
                {
                    icon: IconTemplate,
                    title: "Features",
                    url: "/dashboard/features",
                },
                {
                    icon: IconDeviceAnalytics,
                    title: "Analytics",
                    url: "/dashboard/analytics",
                },
                {
                    icon: IconShoppingBagCheck,
                    title: "Subscription",
                    url: "/dashboard/subscription",
                },
                {
                    icon: IconSettings,
                    title: "Settings",
                    url: "/dashboard/settings",
                },
            ],
        },
    ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname().split('/').filter(Boolean);
    const currentPath = pathname[pathname.length - 1];

    const { data: user } = useRequireAuth();

    return (
        <Sidebar {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <div className='w-full flex justify-start items-center px-3 gap-3'>
                                <div className="bg-white text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-sm">
                                    <svg className="size-5" data-logo="logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 58 41">
                                        <g style={{ opacity: 1 }} id="logogram" transform="translate(0, 0) rotate(0)"><path fillRule="evenodd" clipRule="evenodd" d="M14.8333 6.49796L0.603516 20.6199C3.44972 23.4447 6.70108 25.8252 10.246 27.6877C11.2258 30.2671 12.7617 32.6861 14.8535 34.7621C22.7236 42.5725 35.4835 42.5725 43.3535 34.7621C45.4454 32.6861 46.9813 30.2671 47.9611 27.6875C51.5059 25.8252 54.7574 23.4447 57.6035 20.6199L43.3853 6.50945C43.3747 6.49889 43.3642 6.48834 43.3535 6.47779C35.4835 -1.33269 22.7236 -1.33269 14.8535 6.47779C14.8468 6.48452 14.84 6.49124 14.8333 6.49796ZM41.9919 30.2355C37.8452 31.6244 33.4921 32.3357 29.1035 32.3357C24.7149 32.3357 20.362 31.6244 16.2152 30.2355C16.6645 30.8271 17.1606 31.3948 17.7035 31.9337C23.9996 38.1821 34.2074 38.1821 40.5035 31.9337C41.0464 31.3948 41.5426 30.8271 41.9919 30.2355ZM17.9958 9.02337C19.065 9.72438 20.2018 10.3243 21.3914 10.8133C23.8364 11.8184 26.457 12.3357 29.1035 12.3357C31.75 12.3357 34.3706 11.8184 36.8156 10.8133C38.0052 10.3243 39.1421 9.72437 40.2114 9.02334C33.9938 3.15212 24.2132 3.15213 17.9958 9.02337Z" fill="#4F41B9"></path></g>
                                        <g style={{ opacity: 1 }} id="logotype" transform="translate(58, 20.5)"></g>
                                    </svg>
                                </div>
                                <div className="flex flex-col gap-1 leading-none">
                                    <span className="font-medium font-sans text-[14px] tracking-tight">Raven Claw</span>
                                    <span className="font-normal text-[11px]">{user?.user?.name}</span>
                                </div>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarMenu>
                        {data.navigation.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild>
                                    <a href={item.url} className="font-medium">
                                        {item.title}
                                    </a>
                                </SidebarMenuButton>
                                {item.items?.length ? (
                                    <SidebarMenuSub>
                                        {item.items.map((item: { title: string, url: string, icon: Icon }) => (
                                            <SidebarMenuSubItem key={item.title}>
                                                <SidebarMenuSubButton asChild isActive={currentPath.toLowerCase() === item.title.toLowerCase() ? true : false}>
                                                    <div>
                                                        <item.icon /><a href={item.url}>{item.title}</a>
                                                    </div>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                ) : null}
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    )
}