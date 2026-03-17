"use client";

import { Toaster } from "@repo/ui";
import QueryProvider from "./query-client";
import { SocketProvider } from "./socket-provider";
import { ThemeProvider } from "./theme-provider";

const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
        <QueryProvider>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <SocketProvider>{children}</SocketProvider>
                <Toaster position="bottom-right" />
            </ThemeProvider>
        </QueryProvider>
    );
};

export default Providers;