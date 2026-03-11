import { signIn } from '@repo/auth/client';

export const authHandler = () => signIn.social({
    provider: 'github',
    callbackURL: "/"
});