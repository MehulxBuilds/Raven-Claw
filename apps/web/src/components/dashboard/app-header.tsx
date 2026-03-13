"use client";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@repo/ui"
import { Separator } from "@repo/ui"
import { SidebarTrigger } from "@repo/ui"
import { usePathname } from "next/navigation";
import UserButton from "../layout/user-button";
import { useRequireAuth } from "@/hooks/query/auth";
import { ModeToggle } from "../theme-toggle";

const AppHeader = () => {
    const { data } = useRequireAuth();
    const pathname = usePathname().split("/").filter(Boolean);
    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b">
            <div className="flex items-center gap-2 px-3">
                <SidebarTrigger />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="/">
                                Home
                            </BreadcrumbLink>
                        </BreadcrumbItem>

                        {pathname[pathname?.length - 1]?.[0].toUpperCase() + pathname[pathname?.length - 1].slice(1) !== "Home" && (
                            <BreadcrumbSeparator />
                        )}

                        {/* {pathname.map((v, idx: number) => (
                            <div key={idx} className="flex justify-center items-center gap-2">
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>{v[0].toUpperCase() + v.slice(1)}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </div>
                        ))} */}
                        <BreadcrumbItem>
                            <BreadcrumbPage>{pathname[pathname?.length - 1]?.[0].toUpperCase() + pathname[pathname?.length - 1].slice(1)}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="px-10 flex justify-center items-center">
                <div className="flex justify-center items-center gap-2 p-1 rounded-[30px] px-1.2">
                    <div className="flex justify-center items-center object-fill border-2 border-white rounded-full">
                        <UserButton user={data?.user ?? null} />
                    </div>
                    <ModeToggle />
                </div>
            </div>
        </header>
    )
}

export default AppHeader