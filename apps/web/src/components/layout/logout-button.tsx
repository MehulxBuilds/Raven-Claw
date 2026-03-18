"use client";

import { signOut } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import React from 'react'

const LogoutButton = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    const router = useRouter();
    return (
        <span className={className} onClick={() => signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push('/sign-in')
                }
            }
        })}>
            {children}
        </span>
    )
}

export default LogoutButton;