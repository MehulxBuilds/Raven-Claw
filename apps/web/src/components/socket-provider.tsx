"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useMeQuery } from "@/hooks/use-me-query";

type SocketContextType = {
    socket: Socket | null;
    isConnected: boolean;
};

const SocketContext = createContext<SocketContextType | null>(null);

let socketInstance: Socket | null = null;

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const { data: meData } = useMeQuery(true);

    const [socket, setSocket] = useState<Socket | null>(socketInstance);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // 🔴 Handle logout
        if (!meData?.user?.id) {
            socketInstance?.disconnect();
            socketInstance = null;
            setSocket(null);
            setIsConnected(false);
            return;
        }

        // 🟢 Create socket
        if (!socketInstance) {
            const socketUrl =
                process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080";

            socketInstance = io(socketUrl, {
                path: "/api/socket/io",
                withCredentials: true,
            });

            socketInstance.on("connect", () => {
                console.log("Socket connected:", socketInstance?.id);
                setIsConnected(true);

                socketInstance?.emit("identify", {
                    userId: meData.user.id,
                });
            });

            socketInstance.on("disconnect", () => {
                console.log("Socket disconnected");
                setIsConnected(false);
            });

            setSocket(socketInstance);
        }
    }, [meData?.user?.id]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

// 👇 Hook (export from same file OR separate file)
export const useSocket = () => {
    const context = useContext(SocketContext);

    if (!context) {
        throw new Error("useSocket must be used within SocketProvider");
    }

    return context;
};