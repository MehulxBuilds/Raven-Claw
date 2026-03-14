"use server";

import { auth } from '@repo/auth';
import { client } from '@repo/db';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { API_BASE } from './constants';

export const requireAuth = async () => {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        redirect("/sign-in");
    }

    return session;
};

export const requireUnAuth = async () => {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (session) {
        redirect("/");
    }

    return session;
};

export const redirectToHomeIfSession = async () => {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (session) {
        redirect("/home");
    }

    return session;
}

export const currentUser = async () => {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/sign-in");
    }

    const user = client.user.findUnique({
        where: {
            id: session.user.id,
        }
    })

    return user;
}

export const getDBUser = async () => {
    const cookieStore = await cookies();

    const response = await fetch(`${API_BASE}/api/v1/user/fetch-user`, {
        method: "GET",
        headers: {
            Cookie: cookieStore.toString(),
        },
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error("Failed to fetch user");
    }

    const result = await response.json();

    return result.user || [];
};