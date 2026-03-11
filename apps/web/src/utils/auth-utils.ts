"use server";

import { auth } from '@repo/auth';
import { client } from '@repo/db';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

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