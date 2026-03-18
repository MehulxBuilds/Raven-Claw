import { signIn } from '@/lib/auth-client';

export const authHandler = () => signIn.social({
    provider: 'github',
    callbackURL: "/"
});